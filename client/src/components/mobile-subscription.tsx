import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Capacitor } from "@capacitor/core";
import { capacitorBridge } from "@/lib/capacitor-remote-bridge";

// Declare CdvPurchase type for TypeScript
declare const CdvPurchase: any;

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
    console.log("=== MOBILE SUBSCRIPTION DEBUG START ===");
    console.log("Platform detected:", platformType);
    console.log("CdvPurchase available:", typeof CdvPurchase !== "undefined");
    
    if (typeof CdvPurchase === "undefined") {
      console.error("❌ CdvPurchase plugin not available!");
      console.log("Make sure you ran: npx cap sync");
      toast({
        title: "Plugin Not Found",
        description: "In-app purchase plugin not loaded. Try reinstalling the app.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { store, ProductType, Platform, LogLevel } = CdvPurchase;
      
      // Enable verbose logging for debugging
      store.verbosity = LogLevel.DEBUG;
      console.log("Store verbosity set to DEBUG");

      console.log(`Initializing ${platformType} store...`);
      console.log("Available ProductType:", ProductType);
      console.log("Available Platform:", Platform);

      // Register products based on platform
      if (platformType === "android") {
        console.log("🤖 Registering Google Play product: premium_yearly");
        console.log("Platform.GOOGLE_PLAY value:", Platform.GOOGLE_PLAY);
        store.register([
          {
            id: "premium_yearly",
            type: ProductType.PAID_SUBSCRIPTION,
            platform: Platform.GOOGLE_PLAY,
          },
        ]);
        console.log("✅ Product registered successfully");
      } else if (platformType === "ios") {
        console.log("🍎 Registering App Store product: premium_yearly");
        console.log("Platform.APPLE_APPSTORE value:", Platform.APPLE_APPSTORE);
        store.register([
          {
            id: "premium_yearly",
            type: ProductType.PAID_SUBSCRIPTION,
            platform: Platform.APPLE_APPSTORE,
          },
        ]);
        console.log("✅ Product registered successfully");
      }

      // Set up event handlers
      store.when().productUpdated((product: any) => {
        console.log("📦 Product updated:", {
          id: product.id,
          title: product.title,
          description: product.description,
          canPurchase: product.canPurchase,
          state: product.state,
          pricing: product.pricing,
          offers: product.offers,
          platform: product.platform,
        });
        
        if (product.canPurchase) {
          console.log("✅ Product can be purchased! Adding to list:", product.id);
          setProducts((prev) => {
            const existing = prev.find((p) => p.id === product.id);
            if (existing) {
              console.log("Product already in list, skipping");
              return prev;
            }
            
            console.log("Adding new product to list");
            return [
              ...prev,
              {
                id: product.id,
                title: product.title || product.id,
                description: product.description || "",
                price: product.pricing?.price || "$29.99/year",
                platform: platformType,
              },
            ];
          });
        } else {
          console.warn("⚠️ Product cannot be purchased. State:", product.state);
        }
      });
      
      // Add error handler
      store.when().error((error: any) => {
        console.error("❌ Store error:", error);
      });

      store.when().approved(async (transaction: any) => {
        console.log("Transaction approved:", transaction);
        
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

          // Finish the transaction
          transaction.finish();

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

      store.when().finished((transaction: any) => {
        console.log("Transaction finished:", transaction);
      });

      // Initialize the store
      console.log("🚀 Calling store.initialize()...");
      const initResult = await store.initialize();
      console.log("✅ Store initialized successfully!");
      console.log("Init result:", initResult);
      console.log("Store ready:", store.ready);
      setStoreReady(true);

      // Check what products we got immediately
      const allProducts = store.products;
      console.log("📊 Immediate products count:", allProducts.length);
      console.log("📊 All products:", allProducts);
      
      // Wait and check again
      setTimeout(() => {
        const productsAfterDelay = store.products;
        console.log("📊 Products after 2s:", productsAfterDelay.length);
        console.log("📊 Product details:", productsAfterDelay);
        
        if (productsAfterDelay.length === 0) {
          console.warn("⚠️ NO PRODUCTS FOUND!");
          console.warn("Possible reasons:");
          console.warn("1. Product not created in Google Play Console");
          console.warn("2. Product ID mismatch (must be exactly 'premium_yearly')");
          console.warn("3. App not properly signed/configured for Google Play");
          console.warn("4. Product still propagating (takes 1-2 hours after creation)");
          console.warn("5. App package name mismatch in Google Play Console");
          
          toast({
            title: "No Products Found",
            description: "Check console for debugging info. Product may still be propagating.",
            variant: "destructive",
          });
        } else {
          console.log("✅ Products loaded successfully!");
          productsAfterDelay.forEach((p: any) => {
            console.log(`  - ${p.id}: ${p.title} (${p.state})`);
          });
        }
      }, 2000);

      console.log("=== MOBILE SUBSCRIPTION DEBUG END ===");

    } catch (error: any) {
      console.error("❌ Error initializing store:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      toast({
        title: "Store Error",
        description: error.message || "Failed to initialize app store",
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
            
            addDebug("   Adding new product to list");
            return [...prev, product];
          });
        } else {
          addDebug(`⚠️ Product ${product.id} cannot be purchased. State: ${product.state}`);
        }
      });

      capacitorBridge.on("STORE_READY", (payload: any) => {
        addDebug("✅ Store ready via bridge!");
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
          addDebug("  1. Product not created in Play Console");
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
    try {
      if (capacitorBridge.isRemoteMode()) {
        // Use bridge for remote mode
        console.log("🌉 Purchasing via bridge:", productId);
        await capacitorBridge.purchaseProduct(productId);
      } else {
        // Direct mode
        if (typeof CdvPurchase === "undefined") {
          throw new Error("In-app purchases not available");
        }

        const { store } = CdvPurchase;
        const product = store.get(productId);
        
        if (!product) {
          throw new Error("Product not found");
        }

        const offer = product.getOffer();
        await offer.order();
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
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
          Product ID: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">premium_yearly</code> | 
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
                <strong>Dev Mode:</strong> Product must be created in Google Play Console first:
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
