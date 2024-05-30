import process from 'node:process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { USAGE } from '../src/sysexits.js';

const args = process.argv.slice(2);

if (args.length != 1) {
  console.log('Usage: generate_ast <output directory>');
  process.exit(USAGE);
}

const outDir = path.resolve(args[0]);

const exprBaseClass = 'Expr';
const exprRules = [
  'Assign   -> name: Token, value: Expr',
  'Binary   -> op: Token, left: Expr, right: Expr',
  'Grouping -> expr: Expr',
  'Unary    -> op: Token, right: Expr',
  'Literal  -> value: Literal',
  'Variable -> name: Token',
];
const exprImports = ["import { Token, Literal } from './token.js'"];
const exprFile = await fs.open(`${outDir}/expr.ts`, 'w');
await generateAST(exprFile, exprImports, exprBaseClass, exprRules);
await exprFile.close();

const stmtBaseClass = 'Stmt';
const stmtRules = [
  'Block      -> stmts: Stmt[]',
  'Expression -> expr: Expr',
  'Print      -> expr: Expr',
  'Var        -> name: Token, initializer?: Expr',
];
const stmtFile = await fs.open(`${outDir}/stmt.ts`, 'w');
const stmtImports = [
  "import { Token } from './token.js'",
  "import { Expr } from './expr.js'",
];
await generateAST(stmtFile, stmtImports, stmtBaseClass, stmtRules);
await exprFile.close();

async function generateAST(
  file: fs.FileHandle,
  imports: string[],
  baseClass: string,
  rules: string[],
) {
  const pairs = rules.map((t) => t.split('->').map((r) => r.trim()));
  const names = pairs.map(([name]) => name);

  for (const imp of imports) {
    await file.write(`${imp};\n`);
  }
  await file.write('\n');

  await generateVisitor(file, baseClass, names);

  await file.write(`export abstract class ${baseClass} {\n`);
  await file.write(
    `  abstract accept<R>(visitor: ${baseClass}Visitor<R>): R;\n`,
  );
  await file.write('}\n');
  await file.write('\n');

  for (const [name, fields] of pairs) {
    await generateType(file, baseClass, name, fields);
  }
}

async function generateVisitor(
  file: fs.FileHandle,
  baseClass: string,
  names: string[],
) {
  await file.write(`export interface ${baseClass}Visitor<R> {\n`);
  for (const name of names) {
    await file.write(
      `  visit${name}(${baseClass.toLowerCase()}: ${name}${baseClass}): R;\n`,
    );
  }
  await file.write('};\n');
  await file.write('\n');
}

async function generateType(
  file: fs.FileHandle,
  baseClass: string,
  name: string,
  fields: string,
) {
  await file.write(`export class ${name}${baseClass} extends ${baseClass} {\n`);

  await file.write('  constructor(\n');
  for (const field of fields.split(', ')) {
    await file.write(`    public readonly ${field},\n`);
  }
  await file.write('  ) {\n');
  await file.write('    super();\n');
  await file.write('  }\n');
  await file.write('\n');

  await file.write(`  accept<R>(visitor: ${baseClass}Visitor<R>): R {\n`);
  await file.write(`    return visitor.visit${name}(this);\n`);
  await file.write('  }\n');

  await file.write('};\n');
  await file.write('\n');
}
