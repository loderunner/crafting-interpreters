import { Environment } from './environment.js';
import { Callable, Interpreter, Value } from './interpreter.js';
import { FunStmt } from './stmt.js';

export class Fun implements Callable {
  constructor(
    private readonly declaration: FunStmt,
    private readonly closure?: Environment,
  ) {}

  public get arity(): number {
    return this.declaration.params.length;
  }

  public call(interpreter: Interpreter, args: Value[]): Value {
    const env = new Environment(this.closure);
    for (const [i, arg] of args.entries()) {
      env.define(this.declaration.params[i].lexeme, arg);
    }

    try {
      interpreter.executeBlock(this.declaration.body, env);
    } catch (err) {
      if (err instanceof Return) {
        return err.value;
      }
      throw err;
    }
    return null;
  }

  public toString(): string {
    return `<fun ${this.declaration.name.lexeme}>`;
  }
}

export class Return {
  constructor(public readonly value: Value) {}
}
