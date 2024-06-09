import { RuntimeError, Value } from './interpreter.js';
import { Token } from './token.js';

export class Environment {
  private readonly values = new Map<string, Value>();

  constructor(private readonly enclosing?: Environment) {}

  define(name: string, value: Value) {
    this.values.set(name, value);
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
}
