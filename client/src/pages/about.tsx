import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Eye, Zap } from "lucide-react";
import { useLocation } from "wouter";

export default function About() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation('/');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold">About PrivyCalc</h2>
        </div>

        {/* App Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Secure Messaging, Disguised</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              PrivyCalc is a secure messaging application cleverly disguised as a fully functional calculator. 
              It provides a private communication platform where your messages are protected and your privacy is paramount.
            </p>
            <p className="text-muted-foreground">
              With PrivyCalc, you can send text messages, images, videos, and voice messages to your contacts 
              while maintaining the appearance of a simple calculator app.
            </p>
          </CardContent>
        </Card>

        {/* Key Features */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Stealth Mode</h3>
                <p className="text-sm text-muted-foreground">
                  The calculator interface conceals your messaging activity. Access secure messages with a special PIN.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">End-to-End Security</h3>
                <p className="text-sm text-muted-foreground">
                  Your messages are protected with industry-standard encryption and secure authentication.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Rich Media Support</h3>
                <p className="text-sm text-muted-foreground">
                  Send text, images, videos, and voice messages with secure cloud storage.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Premium Features</h3>
                <p className="text-sm text-muted-foreground">
                  Upgrade to premium for unlimited messaging and enhanced features at $29.99/year.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Version & Legal */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Version:</strong> 1.0.0</p>
              <p><strong>Package:</strong> com.newhomepage.privycalc</p>
              <p className="pt-2">
                PrivyCalc is designed for users who value privacy and discretion in their digital communications.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
