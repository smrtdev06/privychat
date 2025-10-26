import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);
  const [storeReady, setStoreReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const { toast } = useToast();

  const addDebug = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    addDebug("🚀 MobileSubscription component initializing...");
    
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
  }, []);

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
        console.log("✅ Transaction approved via bridge:", transaction);
        
        try {
          // Validate purchase with backend
          if (platformType === "android") {
            await apiRequest("POST", "/api/mobile-subscription/validate-android", {
              packageName: "com.newhomepage.privychat",
              productId: transaction.products[0].id,
              purchaseToken: transaction.nativePurchase.purchaseToken,
            });
          } else if (platformType === "ios") {
            await apiRequest("POST", "/api/mobile-subscription/validate-ios", {
              receiptData: transaction.nativePurchase.appStoreReceipt,
              transactionId: transaction.nativePurchase.transactionId,
              productId: transaction.products[0].id,
            });
          }

          // Refresh user data
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
          
          if (onSubscriptionUpdate) {
            onSubscriptionUpdate();
          }

          toast({
            title: "Subscription Activated",
            description: "Your premium subscription is now active!",
          });
        } catch (error: any) {
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

  const handlePurchase = async (productId: string) => {
    setLoading(true);
    addDebug(`💳 Starting purchase: ${productId}`);
    try {
      if (capacitorBridge.isRemoteMode()) {
        // Use bridge for remote mode
        addDebug("🌉 Purchasing via remote bridge");
        await capacitorBridge.purchaseProduct(productId);
      } else {
        // Direct mode - use new plugin API
        if (typeof inAppPurchases === "undefined") {
          throw new Error("In-app purchases not available");
        }

        addDebug(`💳 Calling plugin.purchase(${productId})`);
        
        // Purchase the product
        const purchaseData = await inAppPurchases.purchase(productId);
        addDebug(`✅ Purchase successful! ID: ${purchaseData.purchaseId}`);
        addDebug(`   Token: ${purchaseData.purchaseToken ? 'present' : 'N/A'}`);
        
        // Complete the purchase (consume = false for subscriptions)
        await inAppPurchases.completePurchase(productId, false);
        addDebug("✅ Purchase completed");

        // Validate with backend
        if (platform === "android") {
          addDebug("🔐 Validating with Android backend...");
          await apiRequest("POST", "/api/mobile-subscription/validate-android", {
            packageName: "com.newhomepage.privychat",
            productId: productId,
            purchaseToken: purchaseData.purchaseToken || purchaseData.receipt,
          });
          addDebug("✅ Android validation successful");
        } else if (platform === "ios") {
          addDebug("🔐 Validating with iOS backend...");
          await apiRequest("POST", "/api/mobile-subscription/validate-ios", {
            receiptData: purchaseData.receipt,
            transactionId: purchaseData.purchaseId,
            productId: productId,
          });
          addDebug("✅ iOS validation successful");
        }

        // Refresh user data
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        
        if (onSubscriptionUpdate) {
          onSubscriptionUpdate();
        }

        addDebug("🎉 Subscription activated!");
        toast({
          title: "Subscription Activated",
          description: "Your premium subscription is now active!",
        });
      }
    } catch (error: any) {
      addDebug(`❌ Purchase error: ${error.message}`);
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to process purchase",
        variant: "destructive",
      });
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile Subscription
          </CardTitle>
          <CardDescription>
            Initializing {platform === "ios" ? "App Store" : "Google Play"}...
          </CardDescription>
        </CardHeader>
        <CardContent>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Mobile Subscription
        </CardTitle>
        <CardDescription>
          Subscribe on {platform === "ios" ? "iOS" : "Android"} for unlimited messaging
        </CardDescription>
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
            <div
              key={product.id}
              className="flex items-center justify-between p-4 border rounded-lg"
              data-testid={`product-${product.id}`}
            >
              <div className="flex-1">
                <h3 className="font-semibold">{product.title}</h3>
                <p className="text-sm text-muted-foreground">{product.description}</p>
                <p className="text-lg font-bold mt-2">{product.price}</p>
              </div>
              <Button
                onClick={() => handlePurchase(product.id)}
                disabled={loading}
                className="ml-4"
                data-testid={`button-purchase-${product.id}`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
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

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mt-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Premium Features</h4>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li>• Unlimited messages</li>
            <li>• Send images, videos, and voice messages</li>
            <li>• Priority support</li>
            <li>• No ads</li>
          </ul>
        </div>

        <DebugInfoDisplay />
      </CardContent>
    </Card>
  );
}
