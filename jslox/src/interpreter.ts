import assert from 'node:assert';
import { Class, Instance } from './class.js';
import { Environment, NameError } from './environment.js';
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
  GetExpr,
  SetExpr,
  ThisExpr,
  SuperExpr,
} from './expr.js';
import { Fun, Return } from './fun.js';
import { runtimeError } from './index.js';
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

export type Value = null | boolean | number | string | Callable | Instance;

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
        return "<native fun 'clock'>";
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
    const fun = new Fun(stmt, this.environment, false);
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

  visitClass(stmt: ClassStmt): void {
    let superclass: Value | undefined = undefined;
    if (stmt.superclass !== undefined) {
      superclass = this.evaluate(stmt.superclass);
      if (!(superclass instanceof Class)) {
        throw new RuntimeError(
          stmt.superclass.name,
          'Superclass must be a class.',
        );
      }
    }

    this.environment.define(stmt.name.lexeme, null);

    let enclosing: Environment | undefined = undefined;
    if (superclass !== undefined) {
      enclosing = this.environment;
      this.environment = new Environment(this.environment);
      this.environment.define('super', superclass);
    }

    const methods = new Map<string, Fun>();
    for (const m of stmt.methods) {
      const f = new Fun(m, this.environment, m.name.lexeme === 'init');
      methods.set(m.name.lexeme, f);
    }

    const cls = new Class(stmt.name.lexeme, methods, superclass);

    if (enclosing !== undefined) {
      this.environment = enclosing;
    }

    try {
      this.environment.assignAt(stmt.name.lexeme, cls, 0);
    } catch (err) {
      if (err instanceof NameError) {
        throw new RuntimeError(stmt.name, err.message);
      }
      throw err;
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

  visitAssign(expr: AssignExpr): Value {
    const value = this.evaluate(expr.value);
    const depth = this.locals.get(expr);
    try {
      if (depth !== undefined) {
        this.environment.assignAt(expr.name.lexeme, value, depth);
      } else {
        this.globals.assignAt(expr.name.lexeme, value, 0);
      }
    } catch (err) {
      if (err instanceof NameError) {
        throw new RuntimeError(expr.name, err.message);
      }
      throw err;
    }
    return value;
  }

  visitVariable(expr: VariableExpr): Value {
    return this.lookupVariable(expr.name, expr);
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

  visitGet(expr: GetExpr): Value {
    const obj = this.evaluate(expr.obj);
    if (obj instanceof Instance) {
      return obj.get(expr.name);
    }

    throw new RuntimeError(expr.name, 'Only instances have properties.');
  }

  visitSet(expr: SetExpr): Value {
    const obj = this.evaluate(expr.obj);
    if (!(obj instanceof Instance)) {
      throw new RuntimeError(expr.name, 'Only instances have properties.');
    }

    const value = this.evaluate(expr.value);
    obj.set(expr.name, value);
    return value;
  }

  visitSuper(expr: SuperExpr): Value {
    const depth = this.locals.get(expr);
    assert(typeof depth === 'number');

    const superclass = this.environment.getAt('super', depth);
    assert(superclass instanceof Class);

    const instance = this.environment.getAt('this', depth - 1);
    assert(instance instanceof Instance);

    const method = superclass.findMethod(expr.method.lexeme);
    if (method === undefined) {
      throw new RuntimeError(
        expr.method,
        `Undefined property '${expr.method.lexeme}'.`,
      );
    }

    return method.bind(instance);
  }

  visitThis(expr: ThisExpr): Value {
    return this.lookupVariable(expr.keyword, expr);
  }

  resolve(expr: Expr, depth: number) {
    this.locals.set(expr, depth);
  }

  private lookupVariable(name: Token, expr: Expr) {
    const depth = this.locals.get(expr);
    try {
      if (depth !== undefined) {
        return this.environment.getAt(name.lexeme, depth);
      } else {
        return this.globals.getAt(name.lexeme, 0);
      }
    } catch (err) {
      if (err instanceof NameError) {
        throw new RuntimeError(name, err.message);
      }
      throw err;
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
