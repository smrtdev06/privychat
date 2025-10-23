import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Capacitor } from "@capacitor/core";

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
  const { toast } = useToast();

  useEffect(() => {
    // Detect platform
    const currentPlatform = Capacitor.getPlatform();
    if (currentPlatform === "ios" || currentPlatform === "android") {
      setPlatform(currentPlatform);
      initializeStore(currentPlatform);
    }
  }, []);

  const initializeStore = async (platformType: "ios" | "android") => {
    if (typeof CdvPurchase === "undefined") {
      console.log("In-app purchase plugin not available");
      return;
    }

    try {
      const { store, ProductType, Platform } = CdvPurchase;

      // Register products based on platform
      if (platformType === "android") {
        store.register([
          {
            id: "premium_monthly",
            type: ProductType.PAID_SUBSCRIPTION,
            platform: Platform.GOOGLE_PLAY,
          },
          {
            id: "premium_yearly",
            type: ProductType.PAID_SUBSCRIPTION,
            platform: Platform.GOOGLE_PLAY,
          },
        ]);
      } else if (platformType === "ios") {
        store.register([
          {
            id: "premium_monthly",
            type: ProductType.PAID_SUBSCRIPTION,
            platform: Platform.APPLE_APPSTORE,
          },
          {
            id: "premium_yearly",
            type: ProductType.PAID_SUBSCRIPTION,
            platform: Platform.APPLE_APPSTORE,
          },
        ]);
      }

      // Set up event handlers
      store.when().productUpdated((product: any) => {
        console.log("Product updated:", product);
        if (product.canPurchase) {
          setProducts((prev) => {
            const existing = prev.find((p) => p.id === product.id);
            if (existing) return prev;
            
            return [
              ...prev,
              {
                id: product.id,
                title: product.title || product.id,
                description: product.description || "",
                price: product.pricing?.price || "$29/year",
                platform: platformType,
              },
            ];
          });
        }
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
      await store.initialize();
      setStoreReady(true);

    } catch (error) {
      console.error("Error initializing store:", error);
      toast({
        title: "Store Error",
        description: "Failed to initialize app store",
        variant: "destructive",
      });
    }
  };

  const handlePurchase = async (productId: string) => {
    if (typeof CdvPurchase === "undefined") {
      toast({
        title: "Not Available",
        description: "In-app purchases not available on this platform",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { store } = CdvPurchase;
      const product = store.get(productId);
      
      if (!product) {
        throw new Error("Product not found");
      }

      // Initiate purchase
      const offer = product.getOffer();
      await offer.order();

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

  if (!platform) {
    return null;
  }

  if (!storeReady) {
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
          </div>
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
          <p className="text-sm text-muted-foreground">Loading subscription options...</p>
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

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mt-4">
          <h4 className="font-semibold text-blue-900 mb-2">Premium Features</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Unlimited messages</li>
            <li>• Send images, videos, and voice messages</li>
            <li>• Priority support</li>
            <li>• No ads</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
