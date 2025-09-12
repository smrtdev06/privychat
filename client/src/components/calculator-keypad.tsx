import { Button } from "@/components/ui/button";

interface CalculatorKeypadProps {
  onNumberClick: (value: string) => void;
  onOperatorClick: (operator: string) => void;
  onClearClick: () => void;
  onEqualsClick: () => void;
}

export default function CalculatorKeypad({
  onNumberClick,
  onOperatorClick,
  onClearClick,
  onEqualsClick,
}: CalculatorKeypadProps) {
  return (
    <div className="p-6 pt-2">
      <div className="grid grid-cols-4 gap-4">
        {/* Row 1 */}
        <Button
          onClick={onClearClick}
          className="calculator-button function-button"
          data-testid="button-clear"
        >
          C
        </Button>
        <Button className="calculator-button function-button">±</Button>
        <Button className="calculator-button function-button">%</Button>
        <Button
          onClick={() => onOperatorClick("÷")}
          className="calculator-button operator-button"
          data-testid="button-divide"
        >
          ÷
        </Button>
        
        {/* Row 2 */}
        <Button
          onClick={() => onNumberClick("7")}
          className="calculator-button number-button"
          data-testid="button-7"
        >
          7
        </Button>
        <Button
          onClick={() => onNumberClick("8")}
          className="calculator-button number-button"
          data-testid="button-8"
        >
          8
        </Button>
        <Button
          onClick={() => onNumberClick("9")}
          className="calculator-button number-button"
          data-testid="button-9"
        >
          9
        </Button>
        <Button
          onClick={() => onOperatorClick("×")}
          className="calculator-button operator-button"
          data-testid="button-multiply"
        >
          ×
        </Button>
        
        {/* Row 3 */}
        <Button
          onClick={() => onNumberClick("4")}
          className="calculator-button number-button"
          data-testid="button-4"
        >
          4
        </Button>
        <Button
          onClick={() => onNumberClick("5")}
          className="calculator-button number-button"
          data-testid="button-5"
        >
          5
        </Button>
        <Button
          onClick={() => onNumberClick("6")}
          className="calculator-button number-button"
          data-testid="button-6"
        >
          6
        </Button>
        <Button
          onClick={() => onOperatorClick("-")}
          className="calculator-button operator-button"
          data-testid="button-minus"
        >
          −
        </Button>
        
        {/* Row 4 */}
        <Button
          onClick={() => onNumberClick("1")}
          className="calculator-button number-button"
          data-testid="button-1"
        >
          1
        </Button>
        <Button
          onClick={() => onNumberClick("2")}
          className="calculator-button number-button"
          data-testid="button-2"
        >
          2
        </Button>
        <Button
          onClick={() => onNumberClick("3")}
          className="calculator-button number-button"
          data-testid="button-3"
        >
          3
        </Button>
        <Button
          onClick={() => onOperatorClick("+")}
          className="calculator-button operator-button"
          data-testid="button-plus"
        >
          +
        </Button>
        
        {/* Row 5 */}
        <Button
          onClick={() => onNumberClick("0")}
          className="calculator-button number-button col-span-2 !w-auto !rounded-full"
          data-testid="button-0"
        >
          0
        </Button>
        <Button
          onClick={() => onNumberClick(".")}
          className="calculator-button number-button"
          data-testid="button-decimal"
        >
          .
        </Button>
        <Button
          onClick={onEqualsClick}
          className="calculator-button operator-button"
          data-testid="button-equals"
        >
          =
        </Button>
      </div>
    </div>
  );
}
