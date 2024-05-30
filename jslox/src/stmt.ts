import { Token } from './token.js';
import { Expr } from './expr.js';

export interface StmtVisitor<R> {
  visitExpression(stmt: ExpressionStmt): R;
  visitPrint(stmt: PrintStmt): R;
  visitVar(stmt: VarStmt): R;
};

export abstract class Stmt {
  abstract accept<R>(visitor: StmtVisitor<R>): R;
}

export class ExpressionStmt extends Stmt {
  constructor(
    public readonly expr: Expr,
  ) {
    super();
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitExpression(this);
  }
};

export class PrintStmt extends Stmt {
  constructor(
    public readonly expr: Expr,
  ) {
    super();
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitPrint(this);
  }
};

export class VarStmt extends Stmt {
  constructor(
    public readonly name: Token,
    public readonly initializer?: Expr,
  ) {
    super();
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitVar(this);
  }
};

