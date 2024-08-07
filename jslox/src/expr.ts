import { Token, Literal } from './token.js';

export interface ExprVisitor<R> {
  visitAssign(expr: AssignExpr): R;
  visitBinary(expr: BinaryExpr): R;
  visitCall(expr: CallExpr): R;
  visitGet(expr: GetExpr): R;
  visitGrouping(expr: GroupingExpr): R;
  visitLiteral(expr: LiteralExpr): R;
  visitLogical(expr: LogicalExpr): R;
  visitSet(expr: SetExpr): R;
  visitSuper(expr: SuperExpr): R;
  visitThis(expr: ThisExpr): R;
  visitUnary(expr: UnaryExpr): R;
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

export class CallExpr extends Expr {
  constructor(
    public readonly callee: Expr,
    public readonly paren: Token,
    public readonly args: Expr[],
  ) {
    super();
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitCall(this);
  }
};

export class GetExpr extends Expr {
  constructor(
    public readonly obj: Expr,
    public readonly name: Token,
  ) {
    super();
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitGet(this);
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

export class LogicalExpr extends Expr {
  constructor(
    public readonly op: Token,
    public readonly left: Expr,
    public readonly right: Expr,
  ) {
    super();
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLogical(this);
  }
};

export class SetExpr extends Expr {
  constructor(
    public readonly obj: Expr,
    public readonly name: Token,
    public readonly value: Expr,
  ) {
    super();
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitSet(this);
  }
};

export class SuperExpr extends Expr {
  constructor(
    public readonly keyword: Token,
    public readonly method: Token,
  ) {
    super();
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitSuper(this);
  }
};

export class ThisExpr extends Expr {
  constructor(
    public readonly keyword: Token,
  ) {
    super();
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitThis(this);
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

