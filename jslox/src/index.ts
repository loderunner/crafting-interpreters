#! /usr/bin/env node
import process from 'node:process';
import * as sysexits from './sysexits.js';
import fs from 'node:fs/promises';
import readline from 'node:readline/promises';
import Scanner from './scanner.js';
import { Token, TokenType } from './token.js';
import Parser from './parser.js';
import { Interpreter, RuntimeError } from './interpreter.js';
import { Resolver } from './resolver.js';

const interpreter = new Interpreter();

let hadError = false;
let hadRuntimeError = false;

function main() {
  const args = process.argv.slice(2);

  if (args.length > 1) {
    console.log(`Usage: jslox [script]`);
    process.exit(sysexits.USAGE);
  } else if (args.length == 1) {
    runFile(args[0]);
  } else {
    runPrompt();
  }
}

async function runFile(file: string) {
  const buf = await fs.readFile(file);
  run(buf.toString('utf-8'));

  if (hadError) {
    process.exit(sysexits.DATAERR);
  }
  if (hadRuntimeError) {
    process.exit(sysexits.SOFTWARE);
  }
}

async function runPrompt() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  for (;;) {
    const answer = await rl.question('> ');
    if (answer === '' && process.stdin.closed) {
      return;
    }
    run(answer);
    hadError = false;
    hadRuntimeError = false;
  }
}

function run(source: string) {
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();

  if (hadError) {
    return;
  }

  const parser = new Parser(tokens);
  const stmts = parser.parse();

  if (hadError) {
    return;
  }

  const resolver = new Resolver(interpreter);
  resolver.resolve(stmts);

  if (hadError) {
    return;
  }

  interpreter.interpret(stmts);
}

export function error(line: number, message: string): void;
export function error(token: Token, message: string): void;
export function error(lineOrToken: number | Token, message: string): void {
  if (typeof lineOrToken === 'number') {
    const line = lineOrToken;
    report(line, '', message);
    return;
  }

  const token = lineOrToken;
  if (token.tokenType == TokenType.EOF) {
    report(token.line, 'at end', message);
  } else {
    report(token.line, "at '" + token.lexeme + "'", message);
  }
}

function report(line: number, where: string, message: string) {
  console.error(`[line ${line}] Error ${where}: ${message}`);
  hadError = true;
}

export function runtimeError(err: RuntimeError) {
  console.error(`[line ${err.token.line}] ${err.message}`);
  hadRuntimeError = true;
}

main();
