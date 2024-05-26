import {
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  Visitor,
} from './expr.js';

export default class ASTPrinter implements Visitor<string> {
  print(expr: Expr): string {
    return expr.accept(this);
  }

  visitBinary(expr: BinaryExpr): string {
    return this.parenthesize(expr.op.lexeme, expr.left, expr.right);
  }

  visitGrouping(expr: GroupingExpr): string {
    return this.parenthesize('group', expr.expr);
  }

  visitLiteral(expr: LiteralExpr): string {
    return expr.value === null ? 'nil' : JSON.stringify(expr.value);
  }

  visitUnary(expr: UnaryExpr): string {
    return this.parenthesize(expr.op.lexeme, expr.right);
  }

  private parenthesize(name: string, ...exprs: Expr[]) {
    return (
      '(' + name + ' ' + exprs.map((expr) => expr.accept(this)).join(' ') + ')'
    );
  }
}
