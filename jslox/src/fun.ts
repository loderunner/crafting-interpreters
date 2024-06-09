import { Environment } from './environment.js';
import { Callable, Interpreter, Value } from './interpreter.js';
import { FunStmt } from './stmt.js';

export class Fun implements Callable {
  constructor(private readonly declaration: FunStmt) {}

  public get arity(): number {
    return this.declaration.params.length;
  }

  public call(interpreter: Interpreter, args: Value[]): Value {
    const env = new Environment(interpreter.globals);
    for (const [i, arg] of args.entries()) {
      env.define(this.declaration.params[i].lexeme, arg);
    }

    interpreter.executeBlock(this.declaration.body, env);
    return null;
  }

  public toString(): string {
    return `<fun ${this.declaration.name.lexeme}>`;
  }
}
