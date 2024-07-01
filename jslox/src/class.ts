import { Callable, Interpreter, RuntimeError, Value } from './interpreter.js';
import { Token } from './token.js';

export class Class implements Callable {
  constructor(public readonly name: string) {}

  call(_interpreter: Interpreter, _args: Value[]): Value {
    const instance = new Instance(this);
    return instance;
  }

  public get arity(): number {
    return 0;
  }

  public toString(): string {
    return `<class ${this.name}>`;
  }
}

export class Instance {
  private fields = new Map<string, Value>();

  constructor(private readonly cls: Class) {}

  public get(name: Token): Value {
    const field = this.fields.get(name.lexeme);
    if (field !== undefined) {
      return field;
    }
    throw new RuntimeError(name, `Undefined property '${name.lexeme}'.`);
  }

  public set(name: Token, value: Value) {
    this.fields.set(name.lexeme, value);
  }

  public toString(): string {
    return `<instance ${this.cls.name}>`;
  }
}
