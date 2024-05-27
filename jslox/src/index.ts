#! /usr/bin/env node
import process from 'node:process';
import { DATAERR, USAGE } from './sysexits.js';
import fs from 'node:fs/promises';
import readline from 'node:readline/promises';
import Scanner from './scanner.js';
import Token, { TokenType } from './token.js';
import Parser from './parser.js';
import ASTPrinter from './ast-printer.js';

const args = process.argv.slice(2);

if (args.length > 1) {
  console.log(`Usage: jslox [script]`);
  process.exit(USAGE);
} else if (args.length == 1) {
  runFile(args[0]);
} else {
  runPrompt();
}

let hadError = false;

async function runFile(file: string) {
  const buf = await fs.readFile(file);
  run(buf.toString('utf-8'));

  if (hadError) {
    process.exit(DATAERR);
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
  }
}

function run(source: string) {
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();

  const parser = new Parser(tokens);
  const expr = parser.parse();

  if (hadError) {
    return;
  }

  if (expr !== undefined) {
    console.log(new ASTPrinter().print(expr));
  }
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
    report(token.line, ' at end', message);
  } else {
    report(token.line, " at '" + token.lexeme + "'", message);
  }
}

function report(line: number, where: string, message: string) {
  console.error(`[line ${line}] Error ${where}: ${message}`);
  hadError = true;
}
