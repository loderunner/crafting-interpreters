import { Environment } from './environment.js';
import {
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  ExprVisitor,
  VariableExpr,
  AssignExpr,
  LogicalExpr,
} from './expr.js';
import { runtimeError } from './index.js';
import {
  BlockStmt,
  ExpressionStmt,
  IfStmt,
  PrintStmt,
  Stmt,
  StmtVisitor,
  VarStmt,
} from './stmt.js';
import { Token, TokenType } from './token.js';

export class RuntimeError extends Error {
  constructor(
    public readonly token: Readonly<Token>,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export class InterpreterError extends Error {
  constructor(
    public readonly token: Readonly<Token>,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export type Value = null | boolean | number | string;

export class Interpreter implements ExprVisitor<Value>, StmtVisitor<void> {
  private environment = new Environment();

  interpret(stmts: Stmt[]) {
    try {
      for (const stmt of stmts) {
        this.execute(stmt);
      }
    } catch (err) {
      if (err instanceof RuntimeError) {
        runtimeError(err);
        return;
      }
      throw err;
    }
  }

  private execute(stmt: Stmt): void {
    stmt.accept(this);
  }

  visitExpression(stmt: ExpressionStmt): void {
    this.evaluate(stmt.expr);
  }

  visitIf(stmt: IfStmt): void {
    if (isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
      return;
    }

    if (stmt.elseBranch !== undefined) {
      this.execute(stmt.elseBranch);
    }
  }

  visitBlock(stmt: BlockStmt): void {
    this.executeBlock(stmt.stmts, new Environment(this.environment));
  }

  private executeBlock(stmts: Stmt[], env: Environment) {
    const previousEnv = this.environment;
    try {
      this.environment = env;
      for (const stmt of stmts) {
        this.execute(stmt);
      }
    } finally {
      this.environment = previousEnv;
    }
  }

  visitPrint(stmt: PrintStmt): void {
    const value = this.evaluate(stmt.expr);
    console.log(stringify(value));
  }

  visitVar(stmt: VarStmt): void {
    if (stmt.initializer === undefined) {
      this.environment.define(stmt.name, null);
      return;
    }

    this.environment.define(stmt.name, this.evaluate(stmt.initializer));
  }

  private evaluate(expr: Expr): Value {
    return expr.accept(this);
  }

  visitAssign(expr: AssignExpr): Value {
    const value = this.evaluate(expr.value);
    this.environment.assign(expr.name, value);
    return value;
  }

  visitVariable(expr: VariableExpr): Value {
    return this.environment.get(expr.name);
  }

  visitBinary(expr: BinaryExpr): Value {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);
    switch (expr.op.tokenType) {
      case TokenType.MINUS:
        if (typeof left === 'number' && typeof right === 'number') {
          return left - right;
        }
        throw new RuntimeError(expr.op, 'Operands must be two numbers.');
      case TokenType.SLASH:
        if (typeof left === 'number' && typeof right === 'number') {
          if (right === 0) {
            throw new RuntimeError(expr.op, 'Cannot divide by 0.');
          }
          return left / right;
        }
        throw new RuntimeError(expr.op, 'Operands must be two numbers.');
      case TokenType.STAR:
        if (typeof left === 'number' && typeof right === 'number') {
          return left * right;
        }
        throw new RuntimeError(expr.op, 'Operands must be two numbers.');
      case TokenType.PLUS:
        if (typeof left === 'number' && typeof right === 'number') {
          return left + right;
        }
        if (typeof left === 'string' && typeof right === 'string') {
          return left + right;
        }
        throw new RuntimeError(
          expr.op,
          'Operands must be two numbers or two strings.',
        );
      case TokenType.GREATER:
        if (typeof left === 'number' && typeof right === 'number') {
          return left > right;
        }
        throw new RuntimeError(expr.op, 'Operands must be two numbers.');
      case TokenType.GREATER_EQUAL:
        if (typeof left === 'number' && typeof right === 'number') {
          return left >= right;
        }
        throw new RuntimeError(expr.op, 'Operands must be two numbers.');
      case TokenType.LESS:
        if (typeof left === 'number' && typeof right === 'number') {
          return left < right;
        }
        throw new RuntimeError(expr.op, 'Operands must be two numbers.');
      case TokenType.LESS_EQUAL:
        if (typeof left === 'number' && typeof right === 'number') {
          return left <= right;
        }
        throw new RuntimeError(expr.op, 'Operands must be two numbers.');
      case TokenType.BANG_EQUAL:
        return !isEqual(left, right);
      case TokenType.EQUAL_EQUAL:
        return isEqual(left, right);
      default:
        throw new InterpreterError(
          expr.op,
          'Unexpected operator in binary expression.',
        );
    }
  }

  visitGrouping(expr: GroupingExpr): Value {
    return this.evaluate(expr.expr);
  }

  visitLiteral(expr: LiteralExpr): Value {
    return expr.value;
  }

  visitLogical(expr: LogicalExpr): Value {
    const left = this.evaluate(expr.left);

    if (expr.op.tokenType === TokenType.OR) {
      if (isTruthy(left)) {
        return left;
      }
    } else {
      if (!isTruthy(left)) {
        return left;
      }
    }

    return this.evaluate(expr.right);
  }

  visitUnary(expr: UnaryExpr): Value {
    const value = this.evaluate(expr.right);
    switch (expr.op.tokenType) {
      case TokenType.MINUS:
        if (typeof value === 'number') {
          return -value;
        }
        throw new RuntimeError(expr.op, 'Operands must be number.');
      case TokenType.BANG:
        return !isTruthy(value);
      default:
        throw new InterpreterError(
          expr.op,
          'Unexpected operator in unary expression.',
        );
    }
  }
}

function isTruthy(value: Value): boolean {
  if (value === null) {
    return false;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  return true;
}

function isEqual(left: Value, right: Value): boolean {
  if (Number.isNaN(left) && Number.isNaN(right)) {
    return true;
  }

  return left === right;
}

function stringify(value: Value): string {
  if (value === null) {
    return 'nil';
  }

  return value.toString();
}
