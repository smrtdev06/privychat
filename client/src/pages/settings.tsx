import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Copy, Gift, CreditCard, RotateCcw, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Settings() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [numericPassword, setNumericPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [upgradeCode, setUpgradeCode] = useState("");
  const [giftEmail, setGiftEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const setupPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      await apiRequest("POST", "/api/setup-numeric-password", {
        numericPassword: password,
      });
    },
    onSuccess: () => {
      toast({
        title: "Password set successfully",
        description: "Your numeric password has been configured.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
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

        {/* Subscription Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Current Plan</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isPremium
                    ? "bg-green-200 text-green-800"
                    : "bg-yellow-200 text-yellow-800"
                }`}
                data-testid="subscription-status"
              >
                {isPremium ? "Premium" : "Free Plan"}
              </span>
            </div>
            
            {!isPremium && (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Messages remaining today: <strong>{1 - (user?.dailyMessageCount || 0)}</strong>
                </p>
                <Button
                  onClick={() => upgradeMutation.mutate()}
                  disabled={upgradeMutation.isPending}
                  className="w-full"
                  data-testid="button-upgrade"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {upgradeMutation.isPending ? "Upgrading..." : "Upgrade to Premium - $29/year"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Gift Subscription */}
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

        {/* Redeem Code */}
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

        {/* Access Messaging */}
        <Button
          onClick={() => setLocation("/messaging")}
          className="w-full mb-6"
          data-testid="button-access-messaging"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Access Secure Messaging
        </Button>

        {/* Logout */}
        <Button
          variant="destructive"
          onClick={() => logoutMutation.mutate()}
          className="w-full"
          data-testid="button-logout"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
