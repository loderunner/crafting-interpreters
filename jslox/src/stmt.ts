import { Token } from './token.js';
import { Expr } from './expr.js';

export interface StmtVisitor<R> {
  visitBlock(stmt: BlockStmt): R;
  visitExpression(stmt: ExpressionStmt): R;
  visitFun(stmt: FunStmt): R;
  visitIf(stmt: IfStmt): R;
  visitPrint(stmt: PrintStmt): R;
  visitReturn(stmt: ReturnStmt): R;
  visitWhile(stmt: WhileStmt): R;
  visitVar(stmt: VarStmt): R;
};

export abstract class Stmt {
  abstract accept<R>(visitor: StmtVisitor<R>): R;
}

export class BlockStmt extends Stmt {
  constructor(
    public readonly stmts: Stmt[],
  ) {
    super();
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitBlock(this);
  }
};

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

export class FunStmt extends Stmt {
  constructor(
    public readonly name: Token,
    public readonly params: Token[],
    public readonly body: Stmt[],
  ) {
    super();
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitFun(this);
  }
};

export class IfStmt extends Stmt {
  constructor(
    public readonly condition: Expr,
    public readonly thenBranch: Stmt,
    public readonly elseBranch?: Stmt,
  ) {
    super();
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitIf(this);
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

export class ReturnStmt extends Stmt {
  constructor(
    public readonly keyword: Token,
    public readonly value?: Expr,
  ) {
    super();
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitReturn(this);
  }
};

export class WhileStmt extends Stmt {
  constructor(
    public readonly condition: Expr,
    public readonly body: Stmt,
  ) {
    super();
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitWhile(this);
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

