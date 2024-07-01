import { Callable, Interpreter, Value } from './interpreter.js';

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
  constructor(private readonly cls: Class) {}

  public toString(): string {
    return `<instance ${this.cls.name}>`;
  }
}
