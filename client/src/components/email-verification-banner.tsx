import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, AlertCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface EmailVerificationBannerProps {
  user: User;
}

export function EmailVerificationBanner({ user }: EmailVerificationBannerProps) {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  // Don't show banner if email is already verified
  if (user.isEmailVerified) {
    return null;
  }

  const handleResendEmail = async () => {
    setSending(true);
    try {
      await apiRequest("/api/email/resend-verification", {
        method: "POST",
      });

      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox and spam folder",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Send Email",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-yellow-500/50 bg-yellow-500/10" data-testid="banner-email-verification">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1" data-testid="text-verification-title">
              Verify Your Email Address
            </h3>
            <p className="text-sm text-muted-foreground mb-3" data-testid="text-verification-message">
              Please check your inbox at <strong>{user.email}</strong> and click the verification link we sent you. Don't forget to check your spam folder.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleResendEmail}
              disabled={sending}
              className="gap-2"
              data-testid="button-resend-verification"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Resend Verification Email
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
