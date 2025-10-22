import { useEffect } from "react";
import { App, URLOpenListenerEvent } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to handle deep link URLs in Capacitor apps
 * Supports promo code redemption via custom URL scheme
 * Example: privycalc://redeem?code=PROMO123
 */
export function useDeepLinks() {
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) return;

    const handleAppUrlOpen = (event: URLOpenListenerEvent) => {
      const url = event.url;
      console.log("Deep link received:", url);

      try {
        const urlObj = new URL(url);
        
        // Handle promo code redemption deep links
        // Format: privycalc://redeem?code=PROMO123
        if (urlObj.hostname === "redeem" || urlObj.pathname === "/redeem") {
          const promoCode = urlObj.searchParams.get("code");
          
          if (promoCode) {
            // Store the promo code in session storage for the PromoCodeRedeem component to pick up
            sessionStorage.setItem("pendingPromoCode", promoCode);
            
            toast({
              title: "Promo code detected",
              description: `Code: ${promoCode}. Go to Settings to redeem.`,
            });
            
            // Navigate to settings page where promo code can be redeemed
            window.location.href = "/settings";
          }
        }
      } catch (error) {
        console.error("Error parsing deep link URL:", error);
      }
    };

    // Add listener for URL open events
    let listenerHandle: any;
    
    App.addListener("appUrlOpen", handleAppUrlOpen).then((handle) => {
      listenerHandle = handle;
    });

    // Cleanup listener on unmount
    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [isNative, toast]);
}
