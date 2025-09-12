export class Calculator {
  private expression: string = "";
  private result: string = "0";

  public getExpression(): string {
    return this.expression;
  }

  public getResult(): string {
    return this.result;
  }

  public addNumber(num: string): void {
    if (this.result === "0" && num !== ".") {
      this.result = num;
      this.expression = num;
    } else {
      this.result += num;
      this.expression += num;
    }
  }

  public addOperator(operator: string): void {
    this.expression += ` ${operator} `;
    this.result = "0";
  }

  public calculate(): void {
    try {
      // Replace display operators with JS operators
      const jsExpression = this.expression
        .replace(/×/g, '*')
        .replace(/÷/g, '/');
      
      const evalResult = eval(jsExpression);
      this.result = evalResult.toString();
      this.expression = "";
    } catch (error) {
      this.result = "Error";
      this.expression = "";
    }
  }

  public clear(): void {
    this.expression = "";
    this.result = "0";
  }
}
