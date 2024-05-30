import { RuntimeError, Value } from './interpreter.js';
import { Token } from './token.js';

export class Environment {
  private readonly values = new Map<string, Value>();

  define(name: Token, value: Value) {
    this.values.set(name.lexeme, value);
  }

  get(name: Token): Value {
    const value = this.values.get(name.lexeme);
    if (value === undefined) {
      throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
    }
    return value;
  }

  assign(name: Token, value: Value) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
  }
}
