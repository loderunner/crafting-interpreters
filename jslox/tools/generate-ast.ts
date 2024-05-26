import process from 'node:process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { USAGE } from '../src/sysexits.js';

const baseClass = 'Expr';
const types = [
  'Binary   -> op: Token, left: Expr, right: Expr',
  'Grouping -> expr: Expr',
  'Literal  -> value: Literal',
  'Unary    -> op: Token, right: Expr',
];

const args = process.argv.slice(2);

if (args.length != 1) {
  console.log('Usage: generate_ast <output directory>');
  process.exit(USAGE);
}

const outDir = path.resolve(args[0]);
const file = await fs.open(`${outDir}/expr.ts`, 'w');

await generateAST();

async function generateAST() {
  const pairs = types.map((t) => t.split('->').map((r) => r.trim()));
  const names = pairs.map(([name]) => name);

  await file.write("import Token, { Literal } from './token.js';\n");
  await file.write('\n');

  await generateVisitor(names);

  await file.write(`export abstract class ${baseClass} {\n`);
  await file.write('  abstract accept<R>(visitor: Visitor<R>): R;\n');
  await file.write('}\n');
  await file.write('\n');

  for (const [name, fields] of pairs) {
    await generateType(name, fields);
  }
}

async function generateVisitor(names: string[]) {
  await file.write('export interface Visitor<R> {\n');
  for (const name of names) {
    await file.write(
      `  visit${name}(${name.toLowerCase()}: ${name}${baseClass}): R;\n`,
    );
  }
  await file.write('};\n');
  await file.write('\n');
}

async function generateType(name: string, fields: string) {
  await file.write(`export class ${name}${baseClass} extends ${baseClass} {\n`);

  await file.write('  constructor(\n');
  for (const field of fields.split(', ')) {
    await file.write(`    public readonly ${field},\n`);
  }
  await file.write('  ) {\n');
  await file.write('    super();\n');
  await file.write('  }\n');
  await file.write('\n');

  await file.write('  accept<R>(visitor: Visitor<R>): R {\n');
  await file.write(`    return visitor.visit${name}(this);\n`);
  await file.write('  }\n');

  await file.write('};\n');
  await file.write('\n');
}
