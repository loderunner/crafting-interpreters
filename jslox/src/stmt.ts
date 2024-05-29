import { Expr } from './expr.js';

export interface Visitor<R> {
  visitExpr(stmt: ExprStmt): R;
  visitPrint(stmt: PrintStmt): R;
};

export abstract class Stmt {
  abstract accept<R>(visitor: Visitor<R>): R;
}

export class ExprStmt extends Stmt {
  constructor(
    public readonly expression: Expr,
  ) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitExpr(this);
  }
};

export class PrintStmt extends Stmt {
  constructor(
    public readonly expression: Expr,
  ) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitPrint(this);
  }
};

