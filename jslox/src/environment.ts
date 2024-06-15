import { RuntimeError, Value } from './interpreter.js';
import { Token } from './token.js';

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

  get(name: Token): Value {
    const value = this.values.get(name.lexeme);

    if (value === undefined) {
      if (this.enclosing !== undefined) {
        return this.enclosing.get(name);
      }
      throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
    }
    return value;
  }

  getAt(name: Token, depth: number): Value {
    const ancestor = this.ancestor(depth);
    if (ancestor === undefined) {
      throw new RuntimeError(
        name,
        "Couldn't resolve variable '" + name.lexeme + "'.",
      );
    }
    return ancestor.values.get(name.lexeme) as Value;
  }

  assign(name: Token, value: Value) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing !== undefined) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
  }

  assignAt(name: Token, value: Value, depth: number) {
    const ancestor = this.ancestor(depth);
    if (ancestor === undefined) {
      throw new RuntimeError(
        name,
        "Couldn't resolve variable '" + name.lexeme + "'.",
      );
    }
    ancestor.values.set(name.lexeme, value);
  }
}
