import Token, { Literal } from './token.js';

export interface Visitor<R> {
  visitBinary(expr: BinaryExpr): R;
  visitGrouping(expr: GroupingExpr): R;
  visitLiteral(expr: LiteralExpr): R;
  visitUnary(expr: UnaryExpr): R;
};

export abstract class Expr {
  abstract accept<R>(visitor: Visitor<R>): R;
}

export class BinaryExpr extends Expr {
  constructor(
    public readonly op: Token,
    public readonly left: Expr,
    public readonly right: Expr,
  ) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitBinary(this);
  }
};

export class GroupingExpr extends Expr {
  constructor(
    public readonly expr: Expr,
  ) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitGrouping(this);
  }
};

export class LiteralExpr extends Expr {
  constructor(
    public readonly value: Literal,
  ) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitLiteral(this);
  }
};

export class UnaryExpr extends Expr {
  constructor(
    public readonly op: Token,
    public readonly right: Expr,
  ) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitUnary(this);
  }
};

