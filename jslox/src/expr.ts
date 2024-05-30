import { Token, Literal } from './token.js';

export interface ExprVisitor<R> {
  visitAssign(expr: AssignExpr): R;
  visitBinary(expr: BinaryExpr): R;
  visitGrouping(expr: GroupingExpr): R;
  visitUnary(expr: UnaryExpr): R;
  visitLiteral(expr: LiteralExpr): R;
  visitVariable(expr: VariableExpr): R;
};

export abstract class Expr {
  abstract accept<R>(visitor: ExprVisitor<R>): R;
}

export class AssignExpr extends Expr {
  constructor(
    public readonly name: Token,
    public readonly value: Expr,
  ) {
    super();
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitAssign(this);
  }
};

export class BinaryExpr extends Expr {
  constructor(
    public readonly op: Token,
    public readonly left: Expr,
    public readonly right: Expr,
  ) {
    super();
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitBinary(this);
  }
};

export class GroupingExpr extends Expr {
  constructor(
    public readonly expr: Expr,
  ) {
    super();
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitGrouping(this);
  }
};

export class UnaryExpr extends Expr {
  constructor(
    public readonly op: Token,
    public readonly right: Expr,
  ) {
    super();
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitUnary(this);
  }
};

export class LiteralExpr extends Expr {
  constructor(
    public readonly value: Literal,
  ) {
    super();
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLiteral(this);
  }
};

export class VariableExpr extends Expr {
  constructor(
    public readonly name: Token,
  ) {
    super();
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitVariable(this);
  }
};

