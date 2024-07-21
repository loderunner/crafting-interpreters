import { Fun } from './fun.js';
import { Callable, Interpreter, RuntimeError, Value } from './interpreter.js';
import { Token } from './token.js';

export class Class implements Callable {
  constructor(
    public readonly name: string,
    private readonly methods: Map<string, Fun>,
  ) {}

  call(interpreter: Interpreter, args: Value[]): Value {
    const instance = new Instance(this);
    const initializer = this.findMethod('init');
    if (initializer !== undefined) {
      initializer.bind(instance).call(interpreter, args);
    }
    return instance;
  }

  public get arity(): number {
    const initializer = this.findMethod('init');
    if (initializer !== undefined) {
      return initializer.arity;
    }
    return 0;
  }

  public findMethod(name: string): Fun | undefined {
    return this.methods.get(name);
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

    const method = this.cls.findMethod(name.lexeme);
    if (method !== undefined) {
      return method.bind(this);
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
