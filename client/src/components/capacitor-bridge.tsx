import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";

declare const CdvPurchase: any;

const REMOTE_APP_URL = "https://622e822f-d1a1-4fd9-828a-42c12b885a85-00-1hd0vg3rilq4.worf.replit.dev/";

export function CapacitorBridge() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(true);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setDebugLogs(prev => [...prev, logMessage]);
    console.log(message);
  };

  useEffect(() => {
    addLog("🌉 Capacitor Bridge initializing...");
    addLog(`Platform: ${Capacitor.getPlatform()}`);
    addLog(`Native: ${Capacitor.isNativePlatform()}`);

    // Initialize plugins
    if (typeof CdvPurchase !== "undefined") {
      addLog("✅ CdvPurchase plugin available!");
      
      // Setup message handler for remote app
      window.addEventListener("message", async (event) => {
        addLog(`📨 Message received from: ${event.origin}`);
        
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
          addLog(`❌ Invalid origin: ${event.origin}`);
          return;
        }
        
        if (!isAllowed) {
          addLog(`🚫 BLOCKED message from: ${event.origin}`);
          addLog(`Allowed origins: ${allowedOrigins.join(", ")}`);
          return;
        }

        const { type, payload, id } = event.data;
        addLog(`✅ Message accepted: ${type}`);

        try {
          switch (type) {
            case "INIT_STORE": {
              addLog(`🎯 INIT_STORE handler triggered!`);
              addLog(`Platform from payload: ${payload.platform}`);
              
              const { store, ProductType, Platform, LogLevel } = CdvPurchase;
              store.verbosity = LogLevel.DEBUG;
              
              const platform = payload.platform;
              if (platform === "android") {
                store.register([
                  {
                    id: "premium-yearly",  // Changed to match base plan ID with hyphen
                    type: ProductType.PAID_SUBSCRIPTION,
                    platform: Platform.GOOGLE_PLAY,
                  },
                ]);
              } else if (platform === "ios") {
                store.register([
                  {
                    id: "premium-yearly",  // Changed to match product ID with hyphen
                    type: ProductType.PAID_SUBSCRIPTION,
                    platform: Platform.APPLE_APPSTORE,
                  },
                ]);
              }

              // Setup event handlers
              store.when().productUpdated((product: any) => {
                addLog(`📦 Product updated: ${product.id}`);
                addLog(`   - State: ${product.state}, Can purchase: ${product.canPurchase}`);
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
                addLog(`❌ Store error: ${error.message || error.code || 'Unknown error'}`);
                sendToRemote({
                  type: "STORE_ERROR",
                  payload: { message: error.message },
                });
              });

              addLog("🏪 Calling store.initialize()...");
              await store.initialize();
              addLog("✅ Store initialized!");
              addLog(`📊 Product count: ${store.products.length}`);
              
              // Log each product in detail
              store.products.forEach((p: any) => {
                addLog(`📦 Product: ${p.id}`);
                addLog(`   - Title: ${p.title || 'No title'}`);
                addLog(`   - State: ${p.state}`);
                addLog(`   - Can Purchase: ${p.canPurchase}`);
                addLog(`   - Price: ${p.pricing?.price || 'No price'}`);
              });
              
              // Wait a bit and check again
              setTimeout(() => {
                addLog(`📊 Products after 3s: ${store.products.length}`);
                
                if (store.products.length === 0) {
                  addLog("⚠️ NO PRODUCTS FOUND!");
                  addLog("Possible causes:");
                  addLog("1. License testing Gmail not added");
                  addLog("2. Product not active in Play Console");
                  addLog("3. Still propagating (wait 15-30 min)");
                  addLog("4. App not from Internal Testing link");
                } else {
                  store.products.forEach((p: any) => {
                    addLog(`✅ ${p.id}: ${p.state} (${p.canPurchase ? 'can purchase' : 'cannot purchase'})`);
                  });
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
    <>
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
      
      {/* Debug Log Overlay */}
      {showDebug && debugLogs.length > 0 && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: "40vh",
          backgroundColor: "rgba(0, 0, 0, 0.95)",
          color: "#00ff00",
          fontFamily: "monospace",
          fontSize: "11px",
          overflowY: "auto",
          padding: "12px",
          borderTop: "2px solid #00ff00",
          zIndex: 99999,
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
            borderBottom: "1px solid #00ff00",
            paddingBottom: "8px",
          }}>
            <strong style={{ color: "#ffff00" }}>📱 NATIVE DEBUG LOG (Google Play)</strong>
            <button
              onClick={() => setShowDebug(false)}
              style={{
                background: "#ff0000",
                color: "white",
                border: "none",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "10px",
                cursor: "pointer",
              }}
            >
              Hide
            </button>
          </div>
          {debugLogs.map((log, idx) => (
            <div key={idx} style={{ marginBottom: "4px", lineHeight: "1.4" }}>
              {log}
            </div>
          ))}
        </div>
      )}
      
      {/* Toggle button when hidden */}
      {!showDebug && (
        <button
          onClick={() => setShowDebug(true)}
          style={{
            position: "fixed",
            bottom: "16px",
            right: "16px",
            background: "#00ff00",
            color: "black",
            border: "2px solid #000",
            padding: "12px 16px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "bold",
            cursor: "pointer",
            zIndex: 99999,
            boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
          }}
        >
          📱 Show Debug
        </button>
      )}
    </>
  );
}
