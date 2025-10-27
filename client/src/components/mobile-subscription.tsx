import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Capacitor } from "@capacitor/core";
import { capacitorBridge } from "@/lib/capacitor-remote-bridge";

// Declare inAppPurchases type for TypeScript
declare const inAppPurchases: any;

interface SubscriptionProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  platform: "ios" | "android";
}

interface MobileSubscriptionProps {
  onSubscriptionUpdate?: () => void;
}

export function MobileSubscription({ onSubscriptionUpdate }: MobileSubscriptionProps) {
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);
  const [storeReady, setStoreReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const { toast } = useToast();
  
  // Query for user data to check subscription status
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const addDebug = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    addDebug("🚀 MobileSubscription component initializing...");
    
    // Check if user already has active subscription
    if (user && typeof user === 'object' && 'subscriptionType' in user) {
      const isPremium = (user as any).subscriptionType === 'premium';
      const notExpired = (user as any).subscriptionExpiresAt ? new Date((user as any).subscriptionExpiresAt) > new Date() : false;
      const isActive = isPremium && notExpired;
      setHasActiveSubscription(isActive);
      if (isActive) {
        addDebug(`✅ User already has active subscription until ${(user as any).subscriptionExpiresAt}`);
      }
    }
    
    // Detect platform - use bridge method that works in both direct and iframe mode
    capacitorBridge.getPlatform().then((currentPlatform) => {
      addDebug(`🔍 Platform detected: ${currentPlatform}`);
      
      if (currentPlatform === "ios" || currentPlatform === "android") {
        setPlatform(currentPlatform);
        
        // Check if we're in remote bridge mode
        if (capacitorBridge.isRemoteMode()) {
          addDebug("🌉 Using remote bridge mode (iframe)");
          initializeStoreRemote(currentPlatform);
        } else {
          addDebug("🏠 Using direct mode (local)");
          initializeStore(currentPlatform);
        }
      } else {
        addDebug(`⚠️ Not a mobile platform: ${currentPlatform}`);
      }
    }).catch((error) => {
      addDebug(`❌ Error detecting platform: ${error.message}`);
      console.error("Error detecting platform:", error);
    });
  }, [user]);

  const initializeStore = async (platformType: "ios" | "android") => {
    addDebug("=== DIRECT MODE: STORE INIT START ===");
    addDebug(`Platform: ${platformType}`);
    addDebug(`Plugin available: ${typeof inAppPurchases !== "undefined"}`);
    
    if (typeof inAppPurchases === "undefined") {
      addDebug("❌ inAppPurchases plugin NOT available!");
      addDebug("Make sure you ran: npx cap sync");
      toast({
        title: "Plugin Not Found",
        description: "In-app purchase plugin not loaded. Try reinstalling the app.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Set up event listeners for purchase updates
      addDebug("🎧 Setting up purchase update listeners...");
      
      // Listen for purchase updates
      if (inAppPurchases.onPurchaseUpdate) {
        inAppPurchases.onPurchaseUpdate((purchase: any) => {
          addDebug(`🔔 Purchase update received: ${JSON.stringify(purchase)}`);
          handlePurchaseUpdate(purchase, platformType);
        });
        addDebug("✅ Purchase update listener registered");
      } else {
        addDebug("⚠️ onPurchaseUpdate not available on plugin");
      }

      // Use correct product ID per platform
      const productId = platformType === "android" ? "premium_yearly" : "premium-yearly";
      
      addDebug(`🚀 Loading products for ${platformType}...`);
      addDebug(`Product ID: ${productId}`);

      // Load products using new plugin API
      const loadedProducts = await inAppPurchases.getAllProductInfo([productId]);
      addDebug(`✅ Products loaded: ${JSON.stringify(loadedProducts)}`);
      addDebug(`📊 Product count: ${loadedProducts.length}`);
      
      // Convert to our format and clean up titles
      const formattedProducts = loadedProducts.map((p: any) => {
        // Clean up title - remove package name if present
        let title = p.title || "Premium Yearly";
        if (title.includes("(com.")) {
          // Remove everything from opening paren onwards
          title = title.split("(")[0].trim();
        }
        if (!title || title.length === 0) {
          title = "Premium Yearly";
        }
        
        return {
          id: p.productId,
          title: title,
          description: p.description || "Unlimited messaging for one year",
          price: p.price || "$29.99/year",
          platform: platformType,
        };
      });

      setProducts(formattedProducts);
      setStoreReady(true);

      if (formattedProducts.length === 0) {
        addDebug("⚠️ NO PRODUCTS FOUND!");
        addDebug("Possible reasons:");
        addDebug("1. Product not created in store console");
        addDebug(`2. Product ID mismatch (need: ${productId})`);
        addDebug("3. App not properly signed/configured");
        addDebug("4. Product still propagating (1-2 hours)");
        addDebug("5. App package name mismatch");
        
        toast({
          title: "No Products Found",
          description: "Check debug log below. Product may still be propagating.",
          variant: "destructive",
        });
      } else {
        addDebug("✅ Products loaded successfully!");
        formattedProducts.forEach((p: any) => {
          addDebug(`  - ${p.id}: ${p.title} (${p.price})`);
        });
      }

      console.log("=== MOBILE SUBSCRIPTION DEBUG END ===");

    } catch (error: any) {
      addDebug(`❌ Error loading products: ${error.message}`);
      addDebug(`Error details: ${error.name} - ${error.stack?.substring(0, 100)}`);
      toast({
        title: "Store Error",
        description: error.message || "Failed to load products from store",
        variant: "destructive",
      });
    }
  };

  const initializeStoreRemote = async (platformType: "ios" | "android") => {
    addDebug("=== REMOTE BRIDGE MODE START ===");
    addDebug(`Platform: ${platformType}`);

    try {
      // Setup event listeners for bridge messages
      capacitorBridge.on("PRODUCT_UPDATED", (product: any) => {
        addDebug(`📦 Product updated: ${product.id} - ${product.title || 'No title'}`);
        addDebug(`   Price: ${product.price}, CanPurchase: ${product.canPurchase}, State: ${product.state}`);
        
        if (product.canPurchase) {
          addDebug(`✅ Product ${product.id} can be purchased! Adding to list.`);
          setProducts((prev) => {
            const existing = prev.find((p) => p.id === product.id);
            if (existing) {
              addDebug("   Product already in list, skipping");
              return prev;
            }
            
            const newList = [...prev, product];
            addDebug(`   ✅ Added! New product count: ${newList.length}`);
            return newList;
          });
          
          // Also set store ready immediately when we get a valid product
          addDebug("   Setting store ready = true");
          setStoreReady(true);
        } else {
          addDebug(`⚠️ Product ${product.id} cannot be purchased. State: ${product.state}`);
        }
      });

      capacitorBridge.on("STORE_READY", (payload: any) => {
        addDebug(`✅ Store ready via bridge! Products: ${payload.productsCount || 0}`);
        setStoreReady(true);
      });

      capacitorBridge.on("TRANSACTION_APPROVED", async (transaction: any) => {
        addDebug("✅ Transaction approved via bridge!");
        addDebug(`   Product ID: ${transaction.products[0]?.id || 'N/A'}`);
        console.log("✅ Transaction approved via bridge:", transaction);
        
        try {
          // Validate purchase with backend
          if (platformType === "android") {
            addDebug("📤 Validating Android purchase with backend...");
            await apiRequest("POST", "/api/mobile-subscription/validate-android", {
              packageName: "com.newhomepage.privychat",
              productId: transaction.products[0].id,
              purchaseToken: transaction.nativePurchase.purchaseToken,
            });
            addDebug("✅ Android purchase validated successfully!");
          } else if (platformType === "ios") {
            addDebug("📤 Validating iOS purchase with backend...");
            await apiRequest("POST", "/api/mobile-subscription/validate-ios", {
              receiptData: transaction.nativePurchase.appStoreReceipt,
              transactionId: transaction.nativePurchase.transactionId,
              productId: transaction.products[0].id,
            });
            addDebug("✅ iOS purchase validated successfully!");
          }

          // Refresh user data
          addDebug("🔄 Refreshing user data...");
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
          
          if (onSubscriptionUpdate) {
            onSubscriptionUpdate();
          }

          addDebug("🎉 Subscription activated successfully!");
          toast({
            title: "Subscription Activated",
            description: "Your premium subscription is now active!",
          });
        } catch (error: any) {
          addDebug(`❌ Validation error: ${error.message}`);
          console.error("Error validating purchase:", error);
          toast({
            title: "Validation Error",
            description: error.message || "Failed to validate purchase",
            variant: "destructive",
          });
        }
      });

      capacitorBridge.on("STORE_ERROR", (error: any) => {
        addDebug(`❌ Store error via bridge: ${error.message}`);
        toast({
          title: "Store Error",
          description: error.message || "Failed to initialize app store",
          variant: "destructive",
        });
      });

      // Initialize the store via bridge
      addDebug("🚀 Initializing store via bridge...");
      await capacitorBridge.initStore(platformType);
      addDebug("✅ Bridge initialization complete!");
      addDebug("⏳ Waiting for products from Google Play/App Store...");

      // Set a timeout to check if products loaded
      setTimeout(() => {
        if (products.length === 0) {
          addDebug("⚠️ No products loaded after 5 seconds");
          addDebug("Possible reasons:");
          addDebug("  1. Product not created in Play Console / App Store Connect");
          addDebug("  2. Product ID mismatch (must be 'premium_yearly')");
          addDebug("  3. Product still propagating (takes 1-2 hours)");
          addDebug("  4. App package name mismatch");
        }
      }, 5000);

      addDebug("=== REMOTE BRIDGE MODE END ===");
    } catch (error: any) {
      addDebug(`❌ Error initializing remote bridge: ${error.message}`);
      console.error("❌ Error initializing remote bridge:", error);
      toast({
        title: "Bridge Error",
        description: error.message || "Failed to initialize bridge",
        variant: "destructive",
      });
    }
  };

  // Handle purchase updates from the plugin
  const handlePurchaseUpdate = async (purchase: any, platformType: "ios" | "android") => {
    try {
      addDebug(`📦 Processing purchase update: ${purchase.productId}`);
      addDebug(`   Purchase ID: ${purchase.purchaseId}`);
      addDebug(`   State: ${purchase.state || 'N/A'}`);
      
      // Acknowledge the purchase
      addDebug("✓ Acknowledging purchase...");
      await inAppPurchases.completePurchase(purchase.productId, false);
      addDebug("✅ Purchase acknowledged");

      // Validate with backend
      if (platformType === "android") {
        addDebug("🔐 Validating with backend (Android)...");
        await apiRequest("POST", "/api/mobile-subscription/validate-android", {
          packageName: "com.newhomepage.privychat",
          productId: purchase.productId,
          purchaseToken: purchase.purchaseToken,
        });
      } else if (platformType === "ios") {
        addDebug("🔐 Validating with backend (iOS)...");
        await apiRequest("POST", "/api/mobile-subscription/validate-ios", {
          receiptData: purchase.receipt || "",
          transactionId: purchase.purchaseId,
          productId: purchase.productId,
        });
      }

      // Refresh user data
      addDebug("🔄 Refreshing user data...");
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      if (onSubscriptionUpdate) {
        onSubscriptionUpdate();
      }

      addDebug("🎉 Subscription activated via update listener!");
      toast({
        title: "Subscription Activated",
        description: "Your premium subscription is now active!",
      });
      
      // Clear loading state if it was set
      setLoading(false);
    } catch (error: any) {
      addDebug(`❌ Purchase update error: ${error.message}`);
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    setRestoring(true);
    addDebug("🔄 Restoring purchases...");
    
    try {
      if (typeof inAppPurchases === "undefined") {
        throw new Error("In-app purchases not available");
      }

      const restored = await inAppPurchases.restorePurchases();
      addDebug(`✅ Restored ${restored.length} purchase(s)`);
      
      if (restored.length === 0) {
        toast({
          title: "No Purchases Found",
          description: "No previous purchases found for this account.",
        });
        return;
      }

      // Process each restored purchase
      for (const purchase of restored) {
        addDebug(`📦 Processing purchase: ${purchase.productId}`);
        
        // Validate with backend
        if (platform === "android") {
          await apiRequest("POST", "/api/mobile-subscription/validate-android", {
            packageName: "com.newhomepage.privychat",
            productId: purchase.productId,
            purchaseToken: purchase.purchaseToken,
          });
        } else if (platform === "ios") {
          await apiRequest("POST", "/api/mobile-subscription/validate-ios", {
            receiptData: purchase.receipt || "",
            transactionId: purchase.purchaseId,
            productId: purchase.productId,
          });
        }
      }

      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      if (onSubscriptionUpdate) {
        onSubscriptionUpdate();
      }

      toast({
        title: "Purchases Restored",
        description: `Successfully restored ${restored.length} purchase(s)!`,
      });
    } catch (error: any) {
      addDebug(`❌ Restore error: ${error.message}`);
      toast({
        title: "Restore Failed",
        description: error.message || "Failed to restore purchases",
        variant: "destructive",
      });
    } finally {
      setRestoring(false);
    }
  };

  const handlePurchase = async (productId: string) => {
    setLoading(true);
    addDebug(`💳 Starting purchase: ${productId}`);
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      addDebug("⏰ Purchase timeout - resetting UI");
      setLoading(false);
      toast({
        title: "Purchase Timeout",
        description: "Purchase took too long. Use 'Restore Purchases' to sync your subscription.",
        variant: "destructive",
      });
    }, 60000); // 60 second timeout

    try {
      if (capacitorBridge.isRemoteMode()) {
        // Use bridge for remote mode
        addDebug("🌉 Purchasing via remote bridge");
        await capacitorBridge.purchaseProduct(productId);
        clearTimeout(timeoutId);
      } else {
        // Direct mode - use new plugin API
        if (typeof inAppPurchases === "undefined") {
          throw new Error("In-app purchases not available");
        }

        addDebug(`💳 Calling plugin.purchase(${productId})`);
        addDebug("⏳ Opening Google Play dialog...");
        
        try {
          // Purchase the product - this opens Google Play dialog
          // The result will come via the onPurchaseUpdate listener
          await inAppPurchases.purchase(productId);
          
          addDebug("✅ Purchase dialog completed");
          addDebug("⏳ Waiting for purchase confirmation...");
          
          // Wait a bit for the purchase update event to fire
          // The actual processing happens in handlePurchaseUpdate
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Check if purchase was successful by querying backend
          const result = await queryClient.fetchQuery({ queryKey: ["/api/user"] });
          if (result && typeof result === 'object' && 'subscriptionType' in result) {
            const isPremium = (result as any).subscriptionType === 'premium';
            if (isPremium) {
              addDebug("✅ Purchase confirmed!");
              clearTimeout(timeoutId);
              setLoading(false);
              return;
            }
          }
          
          // If still not premium, suggest using restore
          addDebug("⚠️ Purchase may need manual restore");
          toast({
            title: "Purchase Processing",
            description: "If your subscription doesn't activate, use 'Restore Purchases' button.",
          });
          clearTimeout(timeoutId);
          setLoading(false);
          
        } catch (purchaseError: any) {
          // Handle purchase cancelled or already owned
          const errMsg = purchaseError.message || purchaseError.toString();
          if (errMsg.includes("cancelled") || errMsg.includes("USER_CANCELED")) {
            addDebug("ℹ️ User cancelled purchase");
            clearTimeout(timeoutId);
            setLoading(false);
            return;
          }
          if (errMsg.includes("ITEM_ALREADY_OWNED") || errMsg.includes("already subscribed")) {
            addDebug("ℹ️ User already owns this - Google Play handles this");
            addDebug("💡 Use 'Restore Purchases' to sync with backend");
            clearTimeout(timeoutId);
            setLoading(false);
            return;
          }
          throw purchaseError;
        }
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      const errorMsg = error.message || error.toString();
      addDebug(`❌ Purchase error: ${errorMsg}`);
      
      // Don't show toast for expected cases
      if (!errorMsg.includes("already subscribed") && 
          !errorMsg.includes("ITEM_ALREADY_OWNED") && 
          !errorMsg.includes("cancelled") &&
          !errorMsg.includes("USER_CANCELED")) {
        toast({
          title: "Purchase Failed",
          description: errorMsg || "Failed to process purchase",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Debug Info Component - shown in all states
  const DebugInfoDisplay = () => (
    debugInfo.length > 0 ? (
      <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 p-4 rounded-lg mt-4">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center justify-between">
          Debug Log
          <button
            onClick={() => setDebugInfo([])}
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Clear
          </button>
        </h4>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {debugInfo.map((msg, idx) => (
            <div 
              key={idx} 
              className="text-xs font-mono text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 px-2 py-1 rounded"
            >
              {msg}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Product ID: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
            {platform === "android" ? "premium_yearly" : platform === "ios" ? "premium-yearly" : "detecting..."}
          </code> | 
          Platform: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{platform || 'detecting...'}</code> | 
          Products Found: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{products.length}</code>
        </p>
      </div>
    ) : null
  );

  if (!platform) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-3 text-sm text-muted-foreground">Detecting platform...</p>
          </div>
          <DebugInfoDisplay />
        </CardContent>
      </Card>
    );
  }

  if (!storeReady) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-3 text-sm text-muted-foreground">Loading store...</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg mt-4">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              <strong>State:</strong> storeReady={storeReady ? 'true' : 'false'}, products={products.length}
            </p>
          </div>
          <DebugInfoDisplay />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.length === 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
              <p className="text-sm text-muted-foreground">Loading subscription options...</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Dev Mode:</strong> Product must be created in store first:
              </p>
              <ul className="text-xs text-yellow-700 mt-2 space-y-1 ml-4">
                <li>• Product ID: <code className="bg-yellow-100 px-1 rounded">premium_yearly</code></li>
                <li>• Price: <code className="bg-yellow-100 px-1 rounded">$29.99/year</code></li>
              </ul>
              <p className="text-xs text-yellow-700 mt-2">
                Check the browser console for detailed logs.
              </p>
            </div>
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="space-y-4" data-testid={`product-${product.id}`}>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-lg">{product.title}</h3>
                <p className="text-2xl font-bold mt-1">{product.price}</p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Premium Features</h4>
                <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  <li>• Unlimited messages</li>
                  <li>• Send images and videos</li>
                  <li>• Priority support</li>
                </ul>
              </div>

              <Button
                onClick={() => handlePurchase(product.id)}
                disabled={loading || hasActiveSubscription}
                className="w-full"
                data-testid={`button-purchase-${product.id}`}
                variant={hasActiveSubscription ? "secondary" : "default"}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : hasActiveSubscription ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Active
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Subscribe
                  </>
                )}
              </Button>
            </div>
          ))
        )}

        {!capacitorBridge.isRemoteMode() && products.length > 0 && (
          <Button
            onClick={handleRestorePurchases}
            disabled={restoring}
            variant="outline"
            className="w-full"
            data-testid="button-restore-purchases"
          >
            {restoring ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Restoring...
              </>
            ) : (
              "Restore Purchases"
            )}
          </Button>
        )}

        <DebugInfoDisplay />
      </CardContent>
    </Card>
  );
}
