import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  ExprVisitor,
  GetExpr,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  SetExpr,
  UnaryExpr,
  VariableExpr,
} from './expr.js';
import { error } from './index.js';
import { Interpreter } from './interpreter.js';
import {
  BlockStmt,
  ClassStmt,
  ExpressionStmt,
  FunStmt,
  IfStmt,
  PrintStmt,
  ReturnStmt,
  Stmt,
  StmtVisitor,
  VarStmt,
  WhileStmt,
} from './stmt.js';
import { Token } from './token.js';

enum VarState {
  Declared,
  Defined,
}

enum FunctionType {
  NONE,
  FUNCTION,
  METHOD,
}

type Scope = Map<string, VarState>;
const Scope = Map<string, VarState>;

class Scopes extends Array<Scope> {
  get top(): Scope | undefined {
    return this.at(-1);
  }
}

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private readonly scopes = new Scopes();
  private currentFunctionType = FunctionType.NONE;

  constructor(private readonly interpreter: Interpreter) {}

  resolve(stmts: Stmt[]) {
    for (const stmt of stmts) {
      this.resolveStmt(stmt);
    }
  }

  visitBlock(block: BlockStmt): void {
    this.beginScope();
    this.resolve(block.stmts);
    this.endScope();
  }

  visitClass(stmt: ClassStmt): void {
    this.declare(stmt.name);
    this.define(stmt.name);
    for (const method of stmt.methods) {
      this.resolveFun(method, FunctionType.METHOD);
    }
  }

  visitVar(stmt: VarStmt): void {
    this.declare(stmt.name);
    if (stmt.initializer !== undefined) {
      this.resolveExpr(stmt.initializer);
    }
    this.define(stmt.name);
  }

  visitVariable(expr: VariableExpr): void {
    const name = expr.name.lexeme;
    if (this.scopes.top?.has(name) && !this.scopes.top.get(name)) {
      error(expr.name, "Can't read local variable in its own initializer.");
    }

    this.resolveLocal(expr, name);
  }

  visitAssign(expr: AssignExpr): void {
    this.resolveExpr(expr.value);
    this.resolveLocal(expr, expr.name.lexeme);
  }

  visitFun(stmt: FunStmt): void {
    this.declare(stmt.name);
    this.define(stmt.name);
    this.resolveFun(stmt, FunctionType.FUNCTION);
  }

  visitExpression(stmt: ExpressionStmt): void {
    this.resolveExpr(stmt.expr);
  }

  visitIf(stmt: IfStmt): void {
    this.resolveExpr(stmt.condition);
    this.resolveStmt(stmt.thenBranch);
    if (stmt.elseBranch !== undefined) {
      this.resolveStmt(stmt.elseBranch);
    }
  }

  visitPrint(stmt: PrintStmt): void {
    this.resolveExpr(stmt.expr);
  }

  visitReturn(stmt: ReturnStmt): void {
    if (this.currentFunctionType === FunctionType.NONE) {
      error(stmt.keyword, "Can't return from top-level code.");
    }

    if (stmt.value !== undefined) {
      this.resolveExpr(stmt.value);
    }
  }

  visitWhile(stmt: WhileStmt): void {
    this.resolveExpr(stmt.condition);
    this.resolveStmt(stmt.body);
  }

  visitBinary(expr: BinaryExpr): void {
    this.resolveExpr(expr.left);
    this.resolveExpr(expr.right);
  }

  visitCall(expr: CallExpr): void {
    this.resolveExpr(expr.callee);
    for (const arg of expr.args) {
      this.resolveExpr(arg);
    }
  }

  visitGet(expr: GetExpr): void {
    this.resolveExpr(expr.obj);
  }

  visitSet(expr: SetExpr): void {
    this.resolveExpr(expr.obj);
    this.resolveExpr(expr.value);
  }

  visitGrouping(expr: GroupingExpr): void {
    this.resolveExpr(expr.expr);
  }

  visitLogical(expr: LogicalExpr): void {
    this.resolveExpr(expr.left);
    this.resolveExpr(expr.right);
  }

  visitUnary(expr: UnaryExpr): void {
    this.resolveExpr(expr.right);
  }

  visitLiteral(_expr: LiteralExpr): void {}

  private beginScope() {
    this.scopes.push(new Scope());
  }

  private endScope() {
    this.scopes.pop();
  }

  private resolveStmt(stmt: Stmt) {
    stmt.accept(this);
  }

  private resolveExpr(expr: Expr) {
    expr.accept(this);
  }

  private declare(name: Token) {
    const scope = this.scopes.top;
    if (scope === undefined) {
      return;
    }
    if (scope.has(name.lexeme)) {
      error(name, `Already a variable named ${name.lexeme} in this scope.`);
    }

    scope.set(name.lexeme, VarState.Declared);
  }

  private define(name: Token) {
    if (this.scopes.top === undefined) {
      return;
    }

    this.scopes.top.set(name.lexeme, VarState.Defined);
  }

  private resolveLocal(expr: Expr, name: string) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const scope = this.scopes[i];
      if (scope.has(name)) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        return;
      }
    }
  }

  private resolveFun(fun: FunStmt, functionType: FunctionType) {
    const enclosingFunctionType = this.currentFunctionType;
    this.currentFunctionType = functionType;
    this.beginScope();
    for (const param of fun.params) {
      this.declare(param);
      this.define(param);
    }
    this.resolve(fun.body);
    this.endScope();

    this.currentFunctionType = enclosingFunctionType;
  }
}
