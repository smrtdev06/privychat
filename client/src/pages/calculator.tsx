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

const calculate = (firstOperand: number, secondOperand: number, operator: string): number => {
  switch (operator) {
    case "+":
      return firstOperand + secondOperand;
    case "-":
      return firstOperand - secondOperand;
    case "*":
    case "×":
      return firstOperand * secondOperand;
    case "/":
    case "÷":
      return firstOperand / secondOperand;
    default:
      return secondOperand;
  }
};

export default function Calculator() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
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

    if (waitingForOperand) {
      setDisplay(value);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? value : display + value);
    }
  };

  const handleOperator = (nextOperator: string) => {
    if (isPasswordMode) return;

    const inputValue = parseFloat(display);

    if (nextOperator === "+") {
      // Check for special plus behavior - only if display is "0" and no previous operation
      if (!isPasswordMode && display === "0" && previousValue === null) {
        setIsPasswordMode(true);
        setPasswordEntry("");
        toast({
          title: "Password Mode",
          description: "Enter your numeric password",
        });
        return;
      }
    }

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operator) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operator);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const handleClear = () => {
    if (isPasswordMode) {
      setIsPasswordMode(false);
      setPasswordEntry("");
    }
    setDisplay("0");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
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

    const inputValue = parseFloat(display);

    if (previousValue !== null && operator) {
      const newValue = calculate(previousValue, inputValue, operator);
      
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  };

  const displayValue = isPasswordMode 
    ? "•".repeat(passwordEntry.length)
    : display;

  const displayExpression = isPasswordMode
    ? "Enter Password"
    : "";

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
