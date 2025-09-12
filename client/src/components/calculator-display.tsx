interface CalculatorDisplayProps {
  expression: string;
  result: string;
}

export default function CalculatorDisplay({ expression, result }: CalculatorDisplayProps) {
  return (
    <div className="flex-1 flex items-end justify-end p-6 pb-4">
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
