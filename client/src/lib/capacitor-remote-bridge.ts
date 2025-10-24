/**
 * Capacitor Remote Bridge
 * 
 * This helper allows the remote app (loaded in iframe) to communicate
 * with the locally-loaded Capacitor plugins via postMessage.
 */

type MessageCallback = (payload: any) => void;

class CapacitorRemoteBridge {
  private messageId = 0;
  private callbacks = new Map<number, MessageCallback>();
  private eventHandlers = new Map<string, MessageCallback[]>();
  private isInIframe = window.self !== window.top;

  constructor() {
    if (this.isInIframe) {
      console.log("🌉 Running in iframe - bridge mode active");
      window.addEventListener("message", this.handleMessage.bind(this));
    } else {
      console.log("🏠 Running standalone - direct mode");
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
    if (!this.isInIframe) {
      return; // Direct mode - will use CdvPurchase directly
    }
    
    console.log("🏪 Initializing store via bridge...");
    await this.sendMessage("INIT_STORE", { platform });
  }

  async getProducts(): Promise<any[]> {
    if (!this.isInIframe) {
      return [];
    }
    
    const result = await this.sendMessage("GET_PRODUCTS");
    return result.products;
  }

  async purchaseProduct(productId: string): Promise<void> {
    if (!this.isInIframe) {
      throw new Error("Purchase not available");
    }
    
    await this.sendMessage("PURCHASE_PRODUCT", { productId });
  }

  isRemoteMode(): boolean {
    return this.isInIframe;
  }

  async getPlatform(): Promise<"ios" | "android" | "web"> {
    if (!this.isInIframe) {
      // Direct mode - check Capacitor directly
      if (typeof (window as any).Capacitor !== "undefined") {
        const platform = (window as any).Capacitor.getPlatform();
        return platform === "ios" || platform === "android" ? platform : "web";
      }
      return "web";
    }
    
    // Remote mode - ask parent for platform
    const result = await this.sendMessage("GET_PLATFORM");
    return result.platform;
  }
}

export const capacitorBridge = new CapacitorRemoteBridge();
