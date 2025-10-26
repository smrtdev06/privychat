import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { capacitorBridge } from "@/lib/capacitor-remote-bridge";
import { Gift, Loader2 } from "lucide-react";
import type { PromoCodeRedemption } from "@shared/schema";

interface RedemptionHistory {
  redemptions: PromoCodeRedemption[];
}

export function PromoCodeRedeem() {
  const [open, setOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [platform, setPlatform] = useState<string>("web");
  const [isNative, setIsNative] = useState(false);
  const { toast } = useToast();
  
  // Detect platform using capacitorBridge (works in iframe mode too)
  useEffect(() => {
    capacitorBridge.getPlatform().then((detectedPlatform) => {
      setPlatform(detectedPlatform);
      setIsNative(detectedPlatform === "ios" || detectedPlatform === "android");
    });
  }, []);

  // Check for pending promo code from deep link
  useEffect(() => {
    const pendingCode = sessionStorage.getItem("pendingPromoCode");
    if (pendingCode) {
      setPromoCode(pendingCode);
      setOpen(true);
      sessionStorage.removeItem("pendingPromoCode");
    }
  }, []);

  // Get redemption history
  const { data: history } = useQuery<RedemptionHistory>({
    queryKey: ["/api/promo-code/history"],
    enabled: open, // Only fetch when dialog is open
  });

  const redeemMutation = useMutation({
    mutationFn: async (code: string) => {
      // Determine platform - only log if on native mobile
      const redemptionPlatform = platform === "ios" ? "ios" : platform === "android" ? "android" : null;
      
      if (!redemptionPlatform) {
        throw new Error("Promo code redemption is only available on mobile devices");
      }

      // Log the redemption attempt
      const redemptionResponse = await apiRequest(
        "POST",
        "/api/promo-code/log-redemption",
        {
          platform: redemptionPlatform,
          promoCode: code,
        }
      );

      if (platform === "ios") {
        // For iOS: Present the native redemption sheet
        // @ts-ignore - StoreKit is available in Capacitor
        if (window.storekit && window.storekit.presentCodeRedemptionSheet) {
          // @ts-ignore
          await window.storekit.presentCodeRedemptionSheet();
        } else {
          // Fallback: Generate and open the redemption URL
          // Get App Store app ID from environment variable
          const appId = import.meta.env.VITE_APP_STORE_ID || "6738359693"; // Default iOS app ID
          const urlResponse = await apiRequest(
            "POST",
            "/api/promo-code/generate-url",
            {
              platform: "ios",
              promoCode: code,
              appId,
            }
          );
          window.open(urlResponse.url, "_blank");
        }
      } else if (platform === "android") {
        // For Android: Generate Google Play redemption URL
        const urlResponse = await apiRequest(
          "POST",
          "/api/promo-code/generate-url",
          {
            platform: "android",
            promoCode: code,
          }
        );
        window.open(urlResponse.url, "_blank");
      }

      return redemptionResponse;
    },
    onSuccess: () => {
      toast({
        title: "Redemption initiated",
        description: isNative 
          ? "Complete the redemption in the app store." 
          : "Opening redemption page...",
      });
      setPromoCode("");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/promo-code/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mobile-subscription/status"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Redemption failed",
        description: error.message || "Failed to redeem promo code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRedeem = () => {
    if (!promoCode.trim()) {
      toast({
        title: "Invalid code",
        description: "Please enter a promo code.",
        variant: "destructive",
      });
      return;
    }

    if (!isNative) {
      toast({
        title: "Mobile app required",
        description: "Promo code redemption is only available in the mobile app.",
        variant: "destructive",
      });
      return;
    }

    redeemMutation.mutate(promoCode);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" data-testid="button-redeem-code">
          <Gift className="w-4 h-4 mr-2" />
          Redeem Promo Code
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="dialog-redeem-code">
        <DialogHeader>
          <DialogTitle>Redeem Promo Code</DialogTitle>
          <DialogDescription>
            Enter your promo code to unlock premium features or discounts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="promo-code" data-testid="label-promo-code">Promo Code</Label>
            <Input
              id="promo-code"
              data-testid="input-promo-code"
              placeholder="Enter your code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRedeem();
                }
              }}
            />
          </div>

          <Button
            onClick={handleRedeem}
            disabled={redeemMutation.isPending || !promoCode.trim()}
            className="w-full"
            data-testid="button-submit-promo-code"
          >
            {redeemMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Redeem Code
          </Button>

          {!isNative && (
            <p className="text-sm text-muted-foreground text-center">
              Promo code redemption is only available in the mobile app.
            </p>
          )}

          {/* Redemption History */}
          {history && history.redemptions && history.redemptions.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Recent Redemptions</h4>
              <div className="space-y-2">
                {history.redemptions.slice(0, 3).map((redemption) => (
                  <div
                    key={redemption.id}
                    className="flex items-center justify-between text-sm"
                    data-testid={`redemption-${redemption.id}`}
                  >
                    <span className="font-mono">{redemption.promoCode}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        redemption.status === "success"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : redemption.status === "failed"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                      }`}
                    >
                      {redemption.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
