import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { capacitorBridge } from "@/lib/capacitor-remote-bridge";

declare const inAppPurchases: any;

// Global flag to track if plugins are initialized
let pluginsInitialized = false;

export function CapacitorBridge() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function initializePlugins() {
      if (pluginsInitialized) {
        setIsInitializing(false);
        return;
      }

      console.log("🌉 Capacitor Bridge initializing (LOCAL MODE)...");
      console.log(`Platform: ${Capacitor.getPlatform()}`);
      console.log(`Native: ${Capacitor.isNativePlatform()}`);

      // Initialize in-app purchases plugin
      if (typeof inAppPurchases !== "undefined") {
        console.log("✅ inAppPurchases plugin available!");
        
        try {
          // Detect platform for store initialization
          const platform = await capacitorBridge.getPlatform();
          
          if (platform === "ios" || platform === "android") {
            console.log(`🏪 Initializing ${platform} in-app purchase store...`);
            
            // Initialize the store with the platform
            // This will set up purchase listeners and load products
            await capacitorBridge.initStore(platform);
            
            console.log("✅ Store initialization complete!");
            pluginsInitialized = true;
          } else {
            console.log("ℹ️ Not on mobile platform, skipping store init");
            pluginsInitialized = true;
          }
        } catch (error) {
          console.error("❌ Failed to initialize in-app purchases:", error);
          // Don't set pluginsInitialized - allow retry on next component mount
          // but continue loading the app
        }
      } else {
        console.warn("⚠️ inAppPurchases plugin not available");
        pluginsInitialized = true;
      }

      setIsInitializing(false);
    }

    initializePlugins();
  }, []);

  // Show loading screen only during initial plugin setup
  if (isInitializing) {
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
        <div style={{ textAlign: "center" }}>
          <div style={{ 
            fontSize: "48px", 
            marginBottom: "16px",
            animation: "pulse 1.5s ease-in-out infinite"
          }}>
            🧮
          </div>
          <div style={{ fontSize: "24px", marginBottom: "16px" }}>Calculator+</div>
          <div style={{ fontSize: "14px", opacity: 0.8 }}>Initializing native features...</div>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
        `}</style>
      </div>
    );
  }

  // After initialization, return null to let App.tsx render the actual UI
  return null;
}
