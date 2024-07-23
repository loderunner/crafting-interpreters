**JSLox** is a [Lox](https://craftinginterpreters.com/) interpreter for Node.js
written in TypeScript.

# Prerequisites

JSLox requires Node.js 20.11 or greater.

Install all dependencies with NPM:

```shell
npm install
```

# Run

Run the JSLox interpreter REPL with

```shell
npm start
```

To read and interpret a JSLox program in a file

```shell
npm start /path/to/file.lox
```

# Build

Build the interpreter (transpile to JavaScript) with:

```shell
npm run build
```

The built product can be found in the `build` folder. Run the built interpreter
with:

```shell
npm exec .
```
