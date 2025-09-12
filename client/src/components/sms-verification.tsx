import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SMSVerificationProps {
  onVerified: () => void;
  phone: string;
}

export default function SMSVerification({ onVerified, phone }: SMSVerificationProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLInputElement;
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.querySelector(`input[data-index="${index - 1}"]`) as HTMLInputElement;
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join("");
    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter all 6 digits",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    
    try {
      // Mock verification - always accept 123456
      if (verificationCode === "123456") {
        toast({
          title: "Phone verified!",
          description: "Your account has been verified successfully.",
        });
        onVerified();
      } else {
        toast({
          title: "Invalid code",
          description: "Please check the code and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verify Your Phone</CardTitle>
          <p className="text-muted-foreground">
            We've sent a 6-digit code to<br />
            <span className="font-medium">{phone}</span>
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center space-x-3 mb-6">
            {code.map((digit, index) => (
              <Input
                key={index}
                data-index={index}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-mono"
                data-testid={`input-code-${index}`}
              />
            ))}
          </div>

          <Button
            onClick={handleVerify}
            disabled={isVerifying || code.some(d => !d)}
            className="w-full mb-4"
            data-testid="button-verify"
          >
            {isVerifying ? "Verifying..." : "Verify Code"}
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            data-testid="button-resend"
          >
            Resend Code (0:30)
          </Button>

          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 text-center">
              Demo code: <strong>123456</strong>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
