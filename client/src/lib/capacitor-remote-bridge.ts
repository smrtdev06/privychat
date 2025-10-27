/**
 * Capacitor Bridge
 * 
 * Provides a unified interface for accessing Capacitor plugins
 * Works in both local bundle mode (direct plugin access) and remote iframe mode (postMessage)
 */

import { Capacitor } from "@capacitor/core";

declare const inAppPurchases: any;

type MessageCallback = (payload: any) => void;

class CapacitorRemoteBridge {
  private messageId = 0;
  private callbacks = new Map<number, MessageCallback>();
  private eventHandlers = new Map<string, MessageCallback[]>();
  private isInIframe = window.self !== window.top;
  private isNativePlatform = Capacitor.isNativePlatform();
  private purchaseListenerSetup = false;

  constructor() {
    if (this.isInIframe) {
      console.log("🌉 Running in iframe - bridge mode active");
      window.addEventListener("message", this.handleMessage.bind(this));
    } else if (this.isNativePlatform) {
      console.log("📱 Running in local bundle - direct plugin access");
    } else {
      console.log("🌐 Running in web browser - no native features");
    }
  }

  private handleMessage(event: MessageEvent) {
    // Security: validate message origin
    if (event.origin !== "capacitor://localhost" && !event.origin.startsWith("http://localhost") && !event.origin.startsWith("https://localhost")) {
      console.warn("🚫 Blocked message from untrusted parent origin:", event.origin);
      return;
    }
    
    const { type, payload, id } = event.data;

    // Handle callback-based responses
    if (id && this.callbacks.has(id)) {
      const callback = this.callbacks.get(id)!;
      callback(payload);
      this.callbacks.delete(id);
      return;
    }

    // Handle event-based messages
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      handlers.forEach((handler) => handler(payload));
    }
  }

  private sendMessage(type: string, payload?: any): Promise<any> {
    if (!this.isInIframe) {
      return Promise.reject(new Error("Not in iframe mode"));
    }

    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      this.callbacks.set(id, resolve);

      window.parent.postMessage({ type, payload, id }, "*");

      // Timeout after 30s
      setTimeout(() => {
        if (this.callbacks.has(id)) {
          this.callbacks.delete(id);
          reject(new Error("Bridge timeout"));
        }
      }, 30000);
    });
  }

  on(eventType: string, handler: MessageCallback) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  off(eventType: string, handler: MessageCallback) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // In-App Purchase Bridge Methods

  async initStore(platform: "ios" | "android"): Promise<void> {
    if (this.isInIframe) {
      // Iframe mode - use postMessage bridge
      console.log("🏪 Initializing store via bridge...");
      await this.sendMessage("INIT_STORE", { platform });
      return;
    }
    
    // Local mode - initialize plugins directly
    if (typeof inAppPurchases === "undefined") {
      console.warn("⚠️ inAppPurchases plugin not available");
      return;
    }
    
    console.log(`🏪 Initializing in-app purchases for ${platform}...`);
    
    // Set up purchase update listener (important for handling purchases)
    if (inAppPurchases.onPurchaseUpdate && !this.purchaseListenerSetup) {
      console.log("🎧 Setting up purchase update listener...");
      inAppPurchases.onPurchaseUpdate(async (purchase: any) => {
        console.log(`🔔 Purchase update received:`, purchase);
        
        // Acknowledge the purchase first
        try {
          await inAppPurchases.completePurchase(purchase.productId, false);
          
          // Trigger transaction approved event
          this.triggerEvent("TRANSACTION_APPROVED", {
            products: [{ id: purchase.productId }],
            nativePurchase: {
              transactionId: purchase.purchaseId,
              purchaseToken: purchase.purchaseToken || purchase.receipt,
              appStoreReceipt: purchase.receipt,
            },
          });
        } catch (error) {
          console.error("❌ Failed to handle purchase update:", error);
        }
      });
      this.purchaseListenerSetup = true;
      console.log("✅ Purchase update listener registered");
    }
    
    // Load product information
    const productId = platform === "android" ? "premium_yearly" : "premium-yearly";
    
    try {
      const products = await inAppPurchases.getAllProductInfo([productId]);
      console.log(`✅ Loaded ${products.length} products`);
      
      // Trigger product update events
      products.forEach((p: any) => {
        let title = p.title || 'Premium Yearly';
        if (title.includes("(com.")) {
          title = title.split("(")[0].trim();
        }
        if (!title || title.length === 0) {
          title = "Premium Yearly";
        }
        
        this.triggerEvent("PRODUCT_UPDATED", {
          id: p.productId,
          title: title,
          description: p.description,
          canPurchase: true,
          state: "valid",
          price: p.price || "$29.99/year",
          platform: platform,
        });
      });
      
      this.triggerEvent("STORE_READY", { ready: true, productsCount: products.length });
    } catch (error: any) {
      console.error("❌ Error loading products:", error);
      this.triggerEvent("STORE_ERROR", { message: error.message });
      throw error; // Re-throw so caller knows initialization failed
    }
  }

  async getProducts(): Promise<any[]> {
    if (this.isInIframe) {
      // Iframe mode - use postMessage bridge
      const result = await this.sendMessage("GET_PRODUCTS");
      return result.products;
    }
    
    // Local mode - products are loaded via events
    // This method is not used in local mode (products come via PRODUCT_UPDATED events)
    return [];
  }

  async purchaseProduct(productId: string): Promise<void> {
    if (this.isInIframe) {
      // Iframe mode - use postMessage bridge
      await this.sendMessage("PURCHASE_PRODUCT", { productId });
      return;
    }
    
    // Local mode - purchase directly
    if (typeof inAppPurchases === "undefined") {
      throw new Error("In-app purchases not available");
    }
    
    console.log(`💳 Initiating purchase: ${productId}`);
    
    try {
      const purchaseData = await inAppPurchases.purchase(productId);
      console.log(`✅ Purchase successful! ID: ${purchaseData.purchaseId}`);
      
      // Complete the purchase (consume = false for subscriptions)
      await inAppPurchases.completePurchase(productId, false);
      console.log(`✅ Purchase completed!`);
      
      // Trigger transaction approved event
      this.triggerEvent("TRANSACTION_APPROVED", {
        products: [{ id: productId }],
        nativePurchase: {
          transactionId: purchaseData.purchaseId,
          purchaseToken: purchaseData.purchaseToken || purchaseData.receipt,
          appStoreReceipt: purchaseData.receipt,
        },
      });
    } catch (error: any) {
      const errorMsg = error.message || error.toString();
      console.error("❌ Purchase error:", errorMsg);
      
      // Provide helpful error messages for common issues
      if (errorMsg.includes("GOOGLE_PLAY_KEY_ERROR")) {
        console.error("⚠️ GOOGLE_PLAY_KEY_ERROR - Check BUILD_VERSION_11_INSTRUCTIONS.md");
      } else if (errorMsg.includes("already subscribed") || errorMsg.includes("ITEM_ALREADY_OWNED")) {
        console.log("ℹ️ User already owns this subscription");
      }
      
      // Only trigger error for non-"already owned" cases
      if (!errorMsg.includes("already subscribed") && !errorMsg.includes("ITEM_ALREADY_OWNED")) {
        this.triggerEvent("STORE_ERROR", { message: errorMsg });
      }
      
      throw error;
    }
  }

  isRemoteMode(): boolean {
    return this.isInIframe;
  }

  async getPlatform(): Promise<"ios" | "android" | "web"> {
    if (this.isInIframe) {
      // Iframe mode - ask parent for platform
      const result = await this.sendMessage("GET_PLATFORM");
      return result.platform;
    }
    
    // Local mode - check Capacitor directly
    const platform = Capacitor.getPlatform();
    return platform === "ios" || platform === "android" ? platform : "web";
  }

  // Helper to trigger events (for local mode)
  private triggerEvent(type: string, payload: any) {
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      handlers.forEach((handler) => handler(payload));
    }
  }
}

export const capacitorBridge = new CapacitorRemoteBridge();
