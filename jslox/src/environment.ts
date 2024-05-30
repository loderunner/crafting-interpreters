import { Value } from './interpreter.js';

export class Environment {
  private readonly values = new Map<string, Value>();

  define(name: string, value: Value) {
    this.values.set(name, value);
  }

  get(name: string): Value | undefined {
    return this.values.get(name);
  }
}
