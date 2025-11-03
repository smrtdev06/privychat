import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Copy, Gift, CreditCard, RotateCcw, MessageCircle, Calculator, CheckCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import { MobileSubscription } from "@/components/mobile-subscription";
import { PromoCodeRedeem } from "@/components/promo-code-redeem";
import { capacitorBridge } from "@/lib/capacitor-remote-bridge";
import { useEffect } from "react";

export default function Settings() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [numericPassword, setNumericPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [upgradeCode, setUpgradeCode] = useState("");
  const [giftEmail, setGiftEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isMobilePlatform, setIsMobilePlatform] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if running on mobile platform (works in both direct and iframe bridge mode)
  useEffect(() => {
    capacitorBridge.getPlatform().then((platform) => {
      setIsMobilePlatform(platform === "ios" || platform === "android");
    });
  }, []);

  const setupPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      await apiRequest("POST", "/api/setup-numeric-password", {
        numericPassword: password,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setShowSuccessModal(true);
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/subscription/upgrade");
    },
    onSuccess: () => {
      toast({
        title: "Upgraded to Premium",
        description: "You now have unlimited messaging!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });

  const giftMutation = useMutation({
    mutationFn: async (data: { recipientEmail: string; giftMessage?: string }) => {
      return await apiRequest("POST", "/api/subscription/gift", data);
    },
    onSuccess: (data) => {
      toast({
        title: "Gift sent successfully",
        description: `Upgrade code ${data.upgradeCode} sent to ${giftEmail}`,
      });
      setGiftEmail("");
      setGiftMessage("");
    },
  });

  const redeemMutation = useMutation({
    mutationFn: async (code: string) => {
      await apiRequest("POST", "/api/subscription/redeem", {
        upgradeCode: code,
      });
    },
    onSuccess: () => {
      toast({
        title: "Code redeemed successfully",
        description: "You now have premium access!",
      });
      setUpgradeCode("");
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/account", {});
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted",
      });
      // Navigate to home page after deletion
      setTimeout(() => {
        setLocation("/");
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    },
  });

  const handleSetupPassword = () => {
    if (!numericPassword || !/^\d+$/.test(numericPassword)) {
      toast({
        title: "Invalid password",
        description: "Password must contain only numbers",
        variant: "destructive",
      });
      return;
    }

    if (numericPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please confirm your password",
        variant: "destructive",
      });
      return;
    }

    setupPasswordMutation.mutate(numericPassword);
  };

  const copyUserCode = () => {
    if (user?.userCode) {
      navigator.clipboard.writeText(user.userCode);
      toast({
        title: "Copied to clipboard",
        description: "Your user code has been copied",
      });
    }
  };

  const handleGiftSubscription = () => {
    if (!giftEmail) {
      toast({
        title: "Email required",
        description: "Please enter recipient email",
        variant: "destructive",
      });
      return;
    }

    giftMutation.mutate({
      recipientEmail: giftEmail,
      giftMessage,
    });
  };

  const handleRedeemCode = () => {
    if (!upgradeCode) {
      toast({
        title: "Code required",
        description: "Please enter upgrade code",
        variant: "destructive",
      });
      return;
    }

    redeemMutation.mutate(upgradeCode);
  };

  const isPremium = user?.subscriptionType === "premium" && 
    user?.subscriptionExpiresAt && 
    new Date(user.subscriptionExpiresAt) > new Date();

  // Show password setup if not completed
  if (user && !user.isSetupComplete) {
    return (
      <div className="min-h-screen bg-background p-6 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Setup Security Password</h2>
            <p className="text-muted-foreground">Create a numeric password to access messaging features</p>
          </div>

          <div className="space-y-6">
            {/* How It Works Instructions */}
            <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                How to Access Your Messages
              </h3>
              <div className="space-y-3 text-sm text-blue-800">
                <div className="flex items-start">
                  <span className="font-bold mr-2 mt-0.5 bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <p>The app will show a <strong>calculator screen</strong> (this is the disguise!)</p>
                </div>
                <div className="flex items-start">
                  <span className="font-bold mr-2 mt-0.5 bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <p>Type your numeric password using the calculator buttons</p>
                </div>
                <div className="flex items-start">
                  <span className="font-bold mr-2 mt-0.5 bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <p>Press the <strong>=</strong> button to unlock messaging</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-xs text-blue-700 font-medium">
                  Example: If your password is "1234", type 1-2-3-4 then press =
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="numeric-password">Numeric Password (Numbers Only)</Label>
              <Input
                id="numeric-password"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={numericPassword}
                onChange={(e) => setNumericPassword(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl font-mono"
                placeholder="••••••"
                data-testid="input-numeric-password"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Remember this password - it cannot be recovered!
              </p>
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl font-mono"
                placeholder="••••••"
                data-testid="input-confirm-password"
              />
            </div>

            <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
              <div className="flex items-start space-x-3">
                <RotateCcw className="w-5 h-5 text-red-600 mt-1" />
                <div>
                  <h3 className="font-medium text-red-800 mb-1">Critical Warning</h3>
                  <p className="text-sm text-red-700">
                    If you forget this password, you will be permanently locked out. Only option will be to reset the entire app, losing all conversations.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSetupPassword}
              disabled={setupPasswordMutation.isPending}
              className="w-full"
              data-testid="button-set-password"
            >
              {setupPasswordMutation.isPending ? "Setting Password..." : "Set Password & Continue"}
            </Button>

            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="w-full"
              data-testid="button-cancel-setup"
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* Success Modal with Practice Option */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <DialogTitle className="text-center text-2xl">Password Set Successfully!</DialogTitle>
              <DialogDescription className="text-center space-y-4 pt-4">
                <p>Your numeric password has been configured.</p>
                
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-left">
                  <p className="text-sm text-blue-900 font-medium mb-2">Quick Reminder:</p>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Open the calculator screen</li>
                    <li>Type your password using the number buttons</li>
                    <li>Press the <strong>=</strong> button to unlock</li>
                  </ol>
                </div>

                <p className="text-sm text-muted-foreground">
                  Would you like to practice entering your password now?
                </p>
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col gap-3 mt-4">
              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  setLocation("/");
                }}
                className="w-full"
                data-testid="button-practice-now"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Practice Now
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuccessModal(false);
                  setLocation("/");
                }}
                className="w-full"
                data-testid="button-skip-practice"
              >
                Skip - I Got It
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8 safe-area-top">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="mr-4"
            data-testid="button-back-settings"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold">Settings</h2>
        </div>

        {/* Email Verification Banner */}
        {user && <EmailVerificationBanner user={user} />}

        {/* User Code */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Unique Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <code className="flex-1 text-lg font-mono bg-muted p-3 rounded-lg" data-testid="user-code">
                {user?.userCode}
              </code>
              <Button onClick={copyUserCode} data-testid="button-copy-code">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Share this code with others to receive messages
            </p>
          </CardContent>
        </Card>

        {/* Mobile Subscription - Always show on mobile for subscription management */}
        {isMobilePlatform && (
          <MobileSubscription onSubscriptionUpdate={() => queryClient.invalidateQueries({ queryKey: ["/api/user"] })} />
        )}

        {/* Promo Code Redemption - Only show for non-premium users */}
        {!isPremium && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Redeem Promo Code</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Have a promo code? Redeem it here to unlock premium features.
              </p>
              <PromoCodeRedeem />
            </CardContent>
          </Card>
        )}

        {/* Gift Subscription - WEB ONLY (Hidden on mobile to comply with app store policies) */}
        {!isMobilePlatform && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-green-800">Gift Premium Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700 mb-4">
                Purchase premium access for another user
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="gift-email">Recipient Email</Label>
                  <Input
                    id="gift-email"
                    type="email"
                    value={giftEmail}
                    onChange={(e) => setGiftEmail(e.target.value)}
                    placeholder="Enter recipient's email address"
                    data-testid="input-gift-email"
                  />
                </div>
                <div>
                  <Label htmlFor="gift-message">Gift Message (Optional)</Label>
                  <Textarea
                    id="gift-message"
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder="Add a personal message..."
                    data-testid="input-gift-message"
                  />
                </div>
                <Button
                  onClick={handleGiftSubscription}
                  disabled={giftMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700"
                  data-testid="button-gift-premium"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  {giftMutation.isPending ? "Processing..." : "Gift Premium Access - $29"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Redeem Code - Web only (mobile users should use in-app purchase or promo codes) */}
        {!isMobilePlatform && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-blue-800">Redeem Upgrade Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-3">
                <Input
                  value={upgradeCode}
                  onChange={(e) => setUpgradeCode(e.target.value)}
                  placeholder="Enter upgrade code"
                  data-testid="input-upgrade-code"
                />
                <Button
                  onClick={handleRedeemCode}
                  disabled={redeemMutation.isPending}
                  data-testid="button-redeem-code"
                >
                  {redeemMutation.isPending ? "Redeeming..." : "Redeem"}
                </Button>
              </div>
              <p className="text-sm text-blue-700">
                Have a code someone purchased for you? Enter it here.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Logout */}
        <Button
          variant="destructive"
          onClick={() => logoutMutation.mutate()}
          className="w-full"
          data-testid="button-logout"
        >
          Logout
        </Button>

        {/* Account Deletion - Required by App Store */}
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 text-base">Delete Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full border-red-300 text-red-700 hover:bg-red-100" 
                  data-testid="button-delete-account"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account,
                    all your messages, conversations, and remove all associated data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteAccountMutation.mutate()}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={deleteAccountMutation.isPending}
                    data-testid="button-confirm-delete"
                  >
                    {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
