interface CalculationHistoryEntry {
  expression: string;
  result: string;
}

interface CalculatorDisplayProps {
  expression: string;
  result: string;
  calculationHistory?: CalculationHistoryEntry[];
}

export default function CalculatorDisplay({ expression, result, calculationHistory = [] }: CalculatorDisplayProps) {
  return (
    <div className="flex-1 flex flex-col p-6 pb-4">
      {/* Calculation History */}
      {calculationHistory.length > 0 && (
        <div className="flex-1 overflow-y-auto mb-4 space-y-2" data-testid="calculation-history">
          {calculationHistory.map((entry, index) => (
            <div key={index} className="text-right text-zinc-400">
              <div className="text-lg font-mono" data-testid={`history-expression-${index}`}>
                {entry.expression}
              </div>
              <div className="text-2xl font-mono text-white" data-testid={`history-result-${index}`}>
                = {entry.result}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Current Calculation */}
      <div className="text-right">
        <div className="text-2xl text-zinc-400 mb-2 font-mono min-h-[2rem]" data-testid="display-expression">
          {expression}
        </div>
        <div className="text-6xl font-thin font-mono" data-testid="display-result">
          {result}
        </div>
      </div>
    </div>
  );
}
