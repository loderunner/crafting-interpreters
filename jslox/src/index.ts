#! /usr/bin/env node
import process from 'node:process';
import { USAGE } from './sysexits.js';
import fs from 'node:fs/promises';
import readline from 'node:readline/promises';

const args = process.argv.slice(2);

if (args.length > 1) {
  console.log(`Usage: jslox [script]`);
  process.exit(USAGE);
} else if (args.length == 1) {
  runFile(args[0]);
} else {
  runPrompt();
}

async function runFile(file: string) {
  const buf = await fs.readFile(file);
  run(buf.toString('utf-8'));
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
  }
}

function run(program: string) {
  console.log(program);
}
