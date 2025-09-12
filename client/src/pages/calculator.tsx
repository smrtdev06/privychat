import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import CalculatorDisplay from "@/components/calculator-display";
import CalculatorKeypad from "@/components/calculator-keypad";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSwipeHandler } from "@/lib/swipe-handler";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Calculator() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("0");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [passwordEntry, setPasswordEntry] = useState("");
  const [isPasswordMode, setIsPasswordMode] = useState(false);
  const { toast } = useToast();

  useSwipeHandler((direction) => {
    // No swipe back to messaging from calculator
  });

  // Check if user has completed setup
  useEffect(() => {
    if (user && !user.isSetupComplete) {
      setLocation("/settings");
    }
  }, [user, setLocation]);

  const handleNumberInput = (value: string) => {
    if (isPasswordMode) {
      setPasswordEntry(prev => prev + value);
      return;
    }

    if (result === "0" && value !== ".") {
      setResult(value);
      setExpression(value);
    } else {
      setResult(prev => prev + value);
      setExpression(prev => prev + value);
    }
  };

  const handleOperator = (operator: string) => {
    if (isPasswordMode) return;

    if (operator === "+") {
      // Check for special plus behavior
      if (!isPasswordMode && expression === "" && result === "0") {
        setIsPasswordMode(true);
        setPasswordEntry("");
        toast({
          title: "Password Mode",
          description: "Enter your numeric password",
        });
        return;
      }
    }

    setExpression(prev => prev + ` ${operator} `);
    setResult("0");
  };

  const handleClear = () => {
    if (isPasswordMode) {
      setIsPasswordMode(false);
      setPasswordEntry("");
    }
    setExpression("");
    setResult("0");
  };

  const handleEquals = async () => {
    if (isPasswordMode) {
      // Verify numeric password
      try {
        await apiRequest("POST", "/api/verify-numeric-password", {
          numericPassword: passwordEntry
        });
        
        setIsPasswordMode(false);
        setPasswordEntry("");
        setLocation("/messaging");
      } catch (error) {
        toast({
          title: "Invalid Password",
          description: "Please try again",
          variant: "destructive",
        });
        setPasswordEntry("");
      }
      return;
    }

    try {
      // Simple calculator evaluation
      const evalResult = eval(expression.replace(/×/g, '*').replace(/÷/g, '/'));
      setResult(evalResult.toString());
      setExpression("");
    } catch (error) {
      setResult("Error");
      setExpression("");
    }
  };

  const displayValue = isPasswordMode 
    ? "•".repeat(passwordEntry.length)
    : result;

  const displayExpression = isPasswordMode
    ? "Enter Password"
    : expression;

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Header with Menu */}
      <div className="flex justify-between items-center p-4">
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-zinc-800" data-testid="button-menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Calculator</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setIsMenuOpen(false);
                  setLocation("/settings");
                }}
                data-testid="button-settings"
              >
                Settings
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                Help & Support
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                About
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="text-sm text-zinc-400">Calculator</div>
      </div>

      {/* Calculator Display */}
      <CalculatorDisplay
        expression={displayExpression}
        result={displayValue}
      />

      {/* Calculator Keypad */}
      <CalculatorKeypad
        onNumberClick={handleNumberInput}
        onOperatorClick={handleOperator}
        onClearClick={handleClear}
        onEqualsClick={handleEquals}
      />
    </div>
  );
}
