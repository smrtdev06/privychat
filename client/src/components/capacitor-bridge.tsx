import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";

declare const CdvPurchase: any;

const REMOTE_APP_URL = "https://622e822f-d1a1-4fd9-828a-42c12b885a85-00-1hd0vg3rilq4.worf.replit.dev/";

export function CapacitorBridge() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log("🌉 Capacitor Bridge initializing...");
    console.log("Platform:", Capacitor.getPlatform());
    console.log("Native:", Capacitor.isNativePlatform());

    // Initialize plugins
    if (typeof CdvPurchase !== "undefined") {
      console.log("✅ CdvPurchase plugin available!");
      
      // Setup message handler for remote app
      window.addEventListener("message", async (event) => {
        // Security: strict origin validation
        const allowedOrigins = [
          "https://622e822f-d1a1-4fd9-828a-42c12b885a85-00-1hd0vg3rilq4.worf.replit.dev",
          "https://privycalc.com",
        ];
        
        let isAllowed = false;
        try {
          const eventOriginUrl = new URL(event.origin);
          for (const allowed of allowedOrigins) {
            const allowedUrl = new URL(allowed);
            if (eventOriginUrl.origin === allowedUrl.origin) {
              isAllowed = true;
              break;
            }
          }
        } catch (e) {
          console.error("Invalid origin:", event.origin);
          return;
        }
        
        if (!isAllowed) {
          console.warn("🚫 Blocked message from untrusted origin:", event.origin);
          return;
        }

        console.log("📨 Received message from remote app:", event.data);

        const { type, payload, id } = event.data;

        try {
          switch (type) {
            case "INIT_STORE": {
              const { store, ProductType, Platform, LogLevel } = CdvPurchase;
              store.verbosity = LogLevel.DEBUG;
              
              const platform = payload.platform;
              if (platform === "android") {
                store.register([
                  {
                    id: "premium_yearly",
                    type: ProductType.PAID_SUBSCRIPTION,
                    platform: Platform.GOOGLE_PLAY,
                  },
                ]);
              } else if (platform === "ios") {
                store.register([
                  {
                    id: "premium_yearly",
                    type: ProductType.PAID_SUBSCRIPTION,
                    platform: Platform.APPLE_APPSTORE,
                  },
                ]);
              }

              // Setup event handlers
              store.when().productUpdated((product: any) => {
                console.log("📦 Product updated:", product);
                sendToRemote({
                  type: "PRODUCT_UPDATED",
                  payload: {
                    id: product.id,
                    title: product.title,
                    description: product.description,
                    canPurchase: product.canPurchase,
                    state: product.state,
                    price: product.pricing?.price || "$29.99/year",
                    platform: platform,
                  },
                });
              });

              store.when().approved(async (transaction: any) => {
                console.log("✅ Transaction approved:", transaction);
                sendToRemote({
                  type: "TRANSACTION_APPROVED",
                  payload: transaction,
                });
              });

              store.when().error((error: any) => {
                console.error("❌ Store error:", error);
                sendToRemote({
                  type: "STORE_ERROR",
                  payload: { message: error.message },
                });
              });

              console.log("🏪 Calling store.initialize()...");
              await store.initialize();
              console.log("✅ Store initialized!");
              console.log("📊 All products registered:", store.products);
              console.log("📊 Product count:", store.products.length);
              
              // Log each product in detail
              store.products.forEach((p: any) => {
                console.log(`  📦 Product: ${p.id}`);
                console.log(`     - Title: ${p.title}`);
                console.log(`     - State: ${p.state}`);
                console.log(`     - Can Purchase: ${p.canPurchase}`);
                console.log(`     - Pricing: ${JSON.stringify(p.pricing)}`);
              });
              
              // Wait a bit and check again
              setTimeout(() => {
                console.log("📊 Products after 3s delay:", store.products.length);
                store.products.forEach((p: any) => {
                  console.log(`  📦 ${p.id}: ${p.state} (canPurchase: ${p.canPurchase})`);
                });
                
                if (store.products.length === 0) {
                  console.error("⚠️ NO PRODUCTS FOUND!");
                  console.error("Troubleshooting:");
                  console.error("1. Is license testing Gmail added to Play Console?");
                  console.error("2. Is app downloaded from Internal Testing link?");
                  console.error("3. Did you wait 15-30 min after first upload?");
                  console.error("4. Check: adb logcat | grep -i billing");
                }
              }, 3000);
              
              sendToRemote({
                type: "STORE_READY",
                id,
                payload: { ready: true },
              });
              break;
            }

            case "PURCHASE_PRODUCT": {
              const { store } = CdvPurchase;
              const product = store.get(payload.productId);
              
              if (!product) {
                throw new Error("Product not found");
              }

              const offer = product.getOffer();
              await offer.order();
              
              sendToRemote({
                type: "PURCHASE_INITIATED",
                id,
                payload: { success: true },
              });
              break;
            }

            case "GET_PRODUCTS": {
              const { store } = CdvPurchase;
              const products = store.products;
              
              sendToRemote({
                type: "PRODUCTS_LIST",
                id,
                payload: { products },
              });
              break;
            }

            case "GET_PLATFORM": {
              const platform = Capacitor.getPlatform();
              
              sendToRemote({
                type: "PLATFORM_INFO",
                id,
                payload: { platform },
              });
              break;
            }
          }
        } catch (error: any) {
          console.error("Bridge error:", error);
          sendToRemote({
            type: "ERROR",
            id,
            payload: { message: error.message },
          });
        }
      });
    } else {
      console.warn("⚠️ CdvPurchase not available");
    }

    setIsReady(true);
  }, []);

  const sendToRemote = (data: any) => {
    if (iframeRef.current?.contentWindow) {
      // Security: use specific target origin instead of wildcard
      iframeRef.current.contentWindow.postMessage(data, REMOTE_APP_URL);
    }
  };

  if (!isReady) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        fontFamily: "sans-serif",
      }}>
        <div>
          <div style={{ fontSize: "24px", marginBottom: "16px" }}>Initializing...</div>
          <div style={{ fontSize: "14px", opacity: 0.8 }}>Loading Capacitor plugins</div>
        </div>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src={REMOTE_APP_URL}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        border: "none",
        margin: 0,
        padding: 0,
      }}
      allow="camera; microphone; geolocation"
    />
  );
}
