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
  CallExpr,
  ArrayExpr,
} from './expr.js';
import { Fun, Return } from './fun.js';
import { runtimeError } from './index.js';
import {
  BlockStmt,
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

export interface Callable {
  call(interpreter: Interpreter, args: Value[]): Value;
  arity: number;
}
export type Value = null | boolean | number | string | Callable | Value[];

function isCallable(value: Value): value is Callable {
  return (
    typeof value === 'object' &&
    value !== null &&
    'call' in value &&
    typeof value.call === 'function' &&
    'arity' in value &&
    typeof value.arity === 'number'
  );
}

export class Interpreter implements ExprVisitor<Value>, StmtVisitor<void> {
  private readonly globals = new Environment();
  private environment = this.globals;
  private readonly locals = new Map<Expr, number>();

  constructor() {
    const clockCallable = {
      arity: 0,
      call(_interpreter: Interpreter, _args: Value[]) {
        return Date.now() / 1000.0;
      },
      toString() {
        return '<native fun>';
      },
    };
    this.globals.define('clock', clockCallable);
  }

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

  visitFun(stmt: FunStmt): void {
    const fun = new Fun(stmt, this.environment);
    this.environment.define(stmt.name.lexeme, fun);
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

  executeBlock(stmts: Stmt[], env: Environment) {
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

  visitReturn(stmt: ReturnStmt): void {
    if (stmt.value !== undefined) {
      throw new Return(this.evaluate(stmt.value));
    }
    throw new Return(null);
  }

  visitWhile(stmt: WhileStmt): void {
    while (isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
  }

  visitVar(stmt: VarStmt): void {
    if (stmt.initializer === undefined) {
      this.environment.define(stmt.name.lexeme, null);
      return;
    }

    this.environment.define(stmt.name.lexeme, this.evaluate(stmt.initializer));
  }

  private evaluate(expr: Expr): Value {
    return expr.accept(this);
  }

  visitArray(expr: ArrayExpr): Value {
    const values = expr.items.map((item) => this.evaluate(item));
    return values;
  }

  visitAssign(expr: AssignExpr): Value {
    const value = this.evaluate(expr.value);
    const depth = this.locals.get(expr);
    if (depth !== undefined) {
      this.environment.assignAt(expr.name, value, depth);
    } else {
      this.globals.assign(expr.name, value);
    }
    return value;
  }

  visitVariable(expr: VariableExpr): Value {
    const depth = this.locals.get(expr);
    if (depth !== undefined) {
      return this.environment.getAt(expr.name, depth);
    } else {
      return this.globals.get(expr.name);
    }
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
      case TokenType.LEFT_BRACKET:
        if (!Array.isArray(left)) {
          throw new RuntimeError(expr.op, 'Can only index arrays.');
        }
        if (
          typeof right !== 'number' ||
          !Number.isInteger(right) ||
          right < 0
        ) {
          throw new RuntimeError(
            expr.op,
            'Can only index arrays with positive integers.',
          );
        }
        if (right >= left.length) {
          throw new RuntimeError(expr.op, 'Array index out of bounds.');
        }
        return left[right];
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

  visitCall(expr: CallExpr): Value {
    const callee = this.evaluate(expr.callee);
    if (!isCallable(callee)) {
      throw new RuntimeError(
        expr.paren,
        'Can only call functions and classes.',
      );
    }
    if (expr.args.length !== callee.arity) {
      throw new RuntimeError(
        expr.paren,
        `Expected ${callee.arity} arguments, got ${expr.args.length}`,
      );
    }
    const args = expr.args.map((arg) => this.evaluate(arg));
    return callee.call(this, args);
  }

  resolve(expr: Expr, depth: number) {
    this.locals.set(expr, depth);
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

function stringify(value: Value, depth = 0): string {
  if (value === null) {
    return 'nil';
  }

  if (Array.isArray(value)) {
    return `[${value.map((v) => stringify(v, depth + 1)).join(',')}]`;
  }

  if (typeof value === 'string' && depth > 0) {
    return JSON.stringify(value);
  }
  return value.toString();
}
