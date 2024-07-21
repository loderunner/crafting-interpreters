import { Value } from './interpreter.js';

export class NameError extends Error {
  constructor(
    public readonly name: string,
    message?: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export class Environment {
  private readonly values = new Map<string, Value>();

  constructor(private readonly enclosing?: Environment) {}

  define(name: string, value: Value) {
    this.values.set(name, value);
  }

  private ancestor(depth: number): Environment | undefined {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let env: Environment | undefined = this;
    for (let i = 0; i < depth; i++) {
      env = env?.enclosing;
    }
    return env;
  }

  getAt(name: string, depth: number): Value {
    const ancestor = this.ancestor(depth);
    if (ancestor === undefined) {
      throw new NameError(name, `Couldn't resolve variable '${name}'.`);
    }
    return ancestor.values.get(name) as Value;
  }

  assignAt(name: string, value: Value, depth: number) {
    const ancestor = this.ancestor(depth);
    if (ancestor === undefined) {
      throw new NameError(name, `Couldn't resolve variable '${name}'.`);
    }
    ancestor.values.set(name, value);
  }
}
