import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    verifyEmail(token);
  }, []);

  const verifyEmail = async (token: string) => {
    try {
      const response: any = await apiRequest("POST", "/api/email/verify", { token });

      setStatus("success");
      setMessage(response.message || "Your email has been successfully verified!");
      
      toast({
        title: "Email Verified!",
        description: "You can now access all features of the app",
      });

      // Redirect to login or dashboard after 3 seconds
      setTimeout(() => {
        setLocation("/auth");
      }, 3000);
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "Failed to verify email. The link may be invalid or expired.");
      
      toast({
        title: "Verification Failed",
        description: error.message || "Please try again or request a new verification email",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === "loading" && (
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin" data-testid="icon-loading" />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-16 w-16 text-green-500" data-testid="icon-success" />
            )}
            {status === "error" && (
              <XCircle className="h-16 w-16 text-red-500" data-testid="icon-error" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === "loading" && "Verifying Your Email"}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
          </CardTitle>
          <CardDescription data-testid="text-message">
            {status === "loading" && "Please wait while we verify your email address..."}
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "success" && (
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                You will be redirected to the login page in a few seconds...
              </p>
              <Button 
                onClick={() => setLocation("/auth")} 
                className="w-full"
                data-testid="button-go-to-login"
              >
                Go to Login Now
              </Button>
            </div>
          )}
          
          {status === "error" && (
            <div className="space-y-4">
              <Button 
                onClick={() => setLocation("/auth")} 
                className="w-full"
                variant="outline"
                data-testid="button-back-to-login"
              >
                Back to Login
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Need help? Contact support or try logging in to resend the verification email.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
