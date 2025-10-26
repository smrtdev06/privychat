import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";

declare const inAppPurchases: any;

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
    if (typeof inAppPurchases !== "undefined") {
      addLog("✅ inAppPurchases plugin available!");
      
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
              
              const platform = payload.platform;
              let productId = "";
              
              if (platform === "android") {
                productId = "premium_yearly";
                addLog(`🤖 Android: Loading product ${productId}`);
              } else if (platform === "ios") {
                productId = "premium-yearly";
                addLog(`🍎 iOS: Loading product ${productId}`);
              }

              try {
                // Load products using new plugin API
                addLog("🏪 Calling getAllProductInfo()...");
                const products = await inAppPurchases.getAllProductInfo([productId]);
                addLog(`✅ Products loaded! Count: ${products.length}`);
                
                // Log each product in detail
                products.forEach((p: any) => {
                  // Clean up title - remove package name if present
                  let title = p.title || 'Premium Yearly';
                  if (title.includes("(com.")) {
                    title = title.split("(")[0].trim();
                  }
                  if (!title || title.length === 0) {
                    title = "Premium Yearly";
                  }
                  
                  addLog(`📦 Product: ${p.productId}`);
                  addLog(`   - Title: ${title}`);
                  addLog(`   - Price: ${p.price || 'No price'}`);
                  addLog(`   - Description: ${p.description || 'No description'}`);
                  
                  // Send product update to remote
                  sendToRemote({
                    type: "PRODUCT_UPDATED",
                    payload: {
                      id: p.productId,
                      title: title,
                      description: p.description,
                      canPurchase: true,
                      state: "valid",
                      price: p.price || "$29.99/year",
                      platform: platform,
                    },
                  });
                });
                
                if (products.length === 0) {
                  addLog("⚠️ No products loaded!");
                  addLog("Possible reasons:");
                  addLog("1. Product not created in Play Console/App Store Connect");
                  addLog("2. Product ID mismatch");
                  addLog("3. Still propagating (wait 15-30 min)");
                  addLog("4. App not from test track");
                }
                
                sendToRemote({
                  type: "STORE_READY",
                  id,
                  payload: { ready: true, productsCount: products.length },
                });
              } catch (error: any) {
                addLog(`❌ Error loading products: ${error.message}`);
                sendToRemote({
                  type: "STORE_ERROR",
                  payload: { message: error.message },
                });
              }
              break;
            }

            case "PURCHASE_PRODUCT": {
              addLog(`💳 Initiating purchase: ${payload.productId}`);
              
              try {
                // Purchase using new plugin API
                const purchaseData = await inAppPurchases.purchase(payload.productId);
                addLog(`✅ Purchase successful!`);
                addLog(`   Purchase ID: ${purchaseData.purchaseId}`);
                
                // Complete the purchase (consume = false for subscriptions)
                await inAppPurchases.completePurchase(payload.productId, false);
                addLog(`✅ Purchase completed!`);
                
                sendToRemote({
                  type: "TRANSACTION_APPROVED",
                  payload: {
                    products: [{ id: payload.productId }],
                    nativePurchase: {
                      transactionId: purchaseData.purchaseId,
                      purchaseToken: purchaseData.purchaseToken || purchaseData.receipt,
                      appStoreReceipt: purchaseData.receipt,
                    },
                  },
                });
                
                sendToRemote({
                  type: "PURCHASE_INITIATED",
                  id,
                  payload: { success: true },
                });
              } catch (error: any) {
                const errorMsg = error.message || error.toString();
                addLog(`❌ Purchase error: ${errorMsg}`);
                
                // Provide helpful error messages for common issues
                if (errorMsg.includes("GOOGLE_PLAY_KEY_ERROR")) {
                  addLog("⚠️ GOOGLE_PLAY_KEY_ERROR means:");
                  addLog("1. App not uploaded to Play Console yet");
                  addLog("2. App not signed with release/upload key");
                  addLog("3. Not testing from internal test track");
                  addLog("4. Google account not added as tester");
                  addLog("5. Product not activated in Play Console");
                  addLog("📖 Check BUILD_VERSION_11_INSTRUCTIONS.md");
                }
                
                sendToRemote({
                  type: "STORE_ERROR",
                  payload: { message: errorMsg },
                });
              }
              break;
            }

            case "GET_PRODUCTS": {
              addLog("📋 GET_PRODUCTS requested");
              // Products are already sent via PRODUCT_UPDATED events
              sendToRemote({
                type: "PRODUCTS_LIST",
                id,
                payload: { products: [] },
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
          addLog(`❌ Bridge error: ${error.message}`);
          sendToRemote({
            type: "ERROR",
            id,
            payload: { message: error.message },
          });
        }
      });
    } else {
      addLog("⚠️ inAppPurchases plugin not available");
      console.warn("⚠️ inAppPurchases not available");
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
            <strong style={{ color: "#ffff00" }}>📱 NATIVE DEBUG LOG</strong>
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
