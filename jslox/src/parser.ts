import {
  ArrayExpr,
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  UnaryExpr,
  VariableExpr,
} from './expr.js';
import { error } from './index.js';
import {
  BlockStmt,
  ExpressionStmt,
  FunStmt,
  IfStmt,
  PrintStmt,
  ReturnStmt,
  Stmt,
  VarStmt,
  WhileStmt,
} from './stmt.js';
import { Token, TokenType } from './token.js';

class ParseError extends Error {
  constructor(
    public readonly token: Readonly<Token>,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

function createError(token: Token, message: string) {
  error(token, message);
  return new ParseError(token, message);
}
export default class Parser {
  private current = 0;
  constructor(private tokens: ReadonlyArray<Readonly<Token>>) {}

  private get eof(): boolean {
    return this.peek().tokenType === TokenType.EOF;
  }

  parse(): Stmt[] {
    try {
      const stmts: Stmt[] = [];
      while (!this.eof) {
        try {
          const stmt = this.parseDeclaration();
          stmts.push(stmt);
        } catch (err) {
          if (err instanceof ParseError) {
            this.synchronize();
          }
          throw err;
        }
      }
      return stmts;
    } catch (err) {
      if (err instanceof ParseError) {
        return [];
      }
      throw err;
    }
  }

  private parseDeclaration(): Stmt {
    if (this.match(TokenType.FUN)) {
      return this.parseFunctionDeclaration('function');
    }
    if (this.match(TokenType.VAR)) {
      return this.parseVarDeclaration();
    }
    return this.parseStatement();
  }

  private parseFunctionDeclaration(kind: 'function'): Stmt {
    const name = this.consume(TokenType.IDENTIFIER, `Expect ${kind} name.`);
    this.consume(TokenType.LEFT_PAREN, `Expect '(' after ${kind} name.`);
    const params: Token[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (params.length >= 255) {
          createError(this.peek(), "Can't have more than 255 parameters.");
        }
        params.push(
          this.consume(TokenType.IDENTIFIER, 'Expect parameter name.'),
        );
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RIGHT_PAREN, `Expect ')' after ${kind} parameters.`);
    this.consume(TokenType.LEFT_BRACE, `Expect '{' before ${kind} body.`);
    const body = this.parseBlockStatement();

    return new FunStmt(name, params, body);
  }

  private parseVarDeclaration(): Stmt {
    const name = this.consume(TokenType.IDENTIFIER, 'Expect variable name.');

    let initializer: Expr | undefined = undefined;
    if (this.match(TokenType.EQUAL)) {
      initializer = this.parseExpression();
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
    return new VarStmt(name, initializer);
  }

  private parseStatement(): Stmt {
    if (this.match(TokenType.FOR)) {
      return this.parseForStatement();
    }

    if (this.match(TokenType.IF)) {
      return this.parseIfStatement();
    }

    if (this.match(TokenType.PRINT)) {
      return this.parsePrintStatement();
    }

    if (this.match(TokenType.RETURN)) {
      return this.parseReturnStatement();
    }

    if (this.match(TokenType.WHILE)) {
      return this.parseWhileStatement();
    }

    if (this.match(TokenType.LEFT_BRACE)) {
      return new BlockStmt(this.parseBlockStatement());
    }

    return this.parseExpressionStatement();
  }

  private parseForStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");

    let init: Stmt | undefined = undefined;
    if (this.match(TokenType.VAR)) {
      init = this.parseVarDeclaration();
    } else if (!this.match(TokenType.SEMICOLON)) {
      init = this.parseExpressionStatement();
    }

    let cond: Expr | undefined = undefined;
    if (!this.match(TokenType.SEMICOLON)) {
      cond = this.parseExpression();
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after 'for' condition.");

    let incr: Expr | undefined = undefined;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      incr = this.parseExpression();
    }

    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after 'for' clauses");

    const body = this.parseStatement();

    let forStmt = body;
    if (incr !== undefined) {
      forStmt = new BlockStmt([forStmt, new ExpressionStmt(incr)]);
    }
    forStmt = new WhileStmt(cond ?? new LiteralExpr(true), forStmt);
    if (init !== undefined) {
      forStmt = new BlockStmt([init, forStmt]);
    }

    return forStmt;
  }

  private parseIfStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
    const cond = this.parseExpression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after 'if' condition.");
    const thenBranch = this.parseStatement();

    if (this.match(TokenType.ELSE)) {
      return new IfStmt(cond, thenBranch, this.parseStatement());
    }

    return new IfStmt(cond, thenBranch);
  }

  private parsePrintStatement(): Stmt {
    const expr = this.parseExpression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new PrintStmt(expr);
  }

  private parseReturnStatement(): Stmt {
    const keyword = this.previous();
    let expr: Expr | undefined = undefined;
    if (!this.check(TokenType.SEMICOLON)) {
      expr = this.parseExpression();
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after return statement.");
    return new ReturnStmt(keyword, expr);
  }

  private parseWhileStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
    const cond = this.parseExpression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after 'while' condition.");
    const body = this.parseStatement();

    return new WhileStmt(cond, body);
  }

  private parseBlockStatement(): Stmt[] {
    const stmts: Stmt[] = [];
    while (!this.check(TokenType.RIGHT_BRACE) && !this.eof) {
      stmts.push(this.parseDeclaration());
    }

    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return stmts;
  }

  private parseExpressionStatement(): Stmt {
    const expr = this.parseExpression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new ExpressionStmt(expr);
  }

  private parseExpression(): Expr {
    return this.parseAssignment();
  }

  private parseAssignment(): Expr {
    const expr = this.parseOr();

    if (this.match(TokenType.EQUAL)) {
      const equals = this.previous();
      const value = this.parseAssignment();

      if (expr instanceof VariableExpr) {
        const name = expr.name;
        return new AssignExpr(name, value);
      }

      createError(equals, 'Invalid assignment target.');
    }

    return expr;
  }

  private parseOr(): Expr {
    let left = this.parseAnd();

    while (this.match(TokenType.OR)) {
      const op = this.previous();
      const right = this.parseAnd();
      left = new LogicalExpr(op, left, right);
    }

    return left;
  }

  private parseAnd(): Expr {
    let left = this.parseEquality();

    while (this.match(TokenType.AND)) {
      const op = this.previous();
      const right = this.parseEquality();
      left = new LogicalExpr(op, left, right);
    }

    return left;
  }

  private parseEquality(): Expr {
    let left = this.parseComparison();
    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const op = this.previous();
      const right = this.parseComparison();
      left = new BinaryExpr(op, left, right);
    }
    return left;
  }

  private parseComparison(): Expr {
    let left = this.parseTerm();
    while (
      this.match(
        TokenType.LESS,
        TokenType.LESS_EQUAL,
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
      )
    ) {
      const op = this.previous();
      const right = this.parseTerm();
      left = new BinaryExpr(op, left, right);
    }
    return left;
  }

  private parseTerm(): Expr {
    let left = this.parseFactor();
    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const op = this.previous();
      const right = this.parseFactor();
      left = new BinaryExpr(op, left, right);
    }
    return left;
  }

  private parseFactor(): Expr {
    let left = this.parseUnary();
    while (this.match(TokenType.STAR, TokenType.SLASH)) {
      const op = this.previous();
      const right = this.parseUnary();
      left = new BinaryExpr(op, left, right);
    }
    return left;
  }

  private parseUnary(): Expr {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const op = this.previous();
      const right = this.parseUnary();
      return new UnaryExpr(op, right);
    }
    return this.parseCall();
  }

  private parseCall(): Expr {
    let expr = this.parsePrimary();

    while (this.match(TokenType.LEFT_PAREN)) {
      expr = this.finishCall(expr);
    }

    return expr;
  }

  private finishCall(expr: Expr): Expr {
    const args: Expr[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (args.length >= 255) {
          createError(this.peek(), "Can't have more than 255 arguments.");
        }
        args.push(this.parseExpression());
      } while (this.match(TokenType.COMMA));
    }

    const paren = this.consume(
      TokenType.RIGHT_PAREN,
      "Expect ')' after arguments.",
    );

    return new CallExpr(expr, paren, args);
  }

  private parsePrimary(): Expr {
    if (this.match(TokenType.LEFT_BRACKET)) {
      if (this.match(TokenType.RIGHT_BRACKET)) {
        return new ArrayExpr([]);
      }

      const items: Expr[] = [];
      do {
        const item = this.parseExpression();
        items.push(item);
      } while (this.match(TokenType.COMMA));
      this.consume(TokenType.RIGHT_BRACKET, "Expect ']' after array items.");
      return new ArrayExpr(items);
    }
    if (this.match(TokenType.FALSE)) {
      return new LiteralExpr(false);
    }
    if (this.match(TokenType.TRUE)) {
      return new LiteralExpr(true);
    }
    if (this.match(TokenType.NIL)) {
      return new LiteralExpr(null);
    }
    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new LiteralExpr(this.previous().literal);
    }
    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.parseExpression();
      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression");
      return new GroupingExpr(expr);
    }
    if (this.match(TokenType.IDENTIFIER)) {
      return new VariableExpr(this.previous());
    }

    throw createError(this.peek(), 'Expected expression');
  }

  private match(...tokenTypes: TokenType[]) {
    if (this.check(...tokenTypes)) {
      this.advance();
      return true;
    }

    return false;
  }

  private check(...tokenTypes: TokenType[]): boolean {
    if (this.eof) {
      return false;
    }
    return tokenTypes.includes(this.peek().tokenType);
  }

  private advance(): Token {
    if (!this.eof) {
      return this.tokens[this.current++];
    }
    return this.previous();
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(tokenType: TokenType, message: string): Token {
    if (this.check(tokenType)) {
      return this.advance();
    }

    throw createError(this.peek(), message);
  }

  private synchronize() {
    this.advance();
    while (!this.eof) {
      if (this.previous().tokenType === TokenType.SEMICOLON) {
        return;
      }
      switch (this.peek().tokenType) {
        case TokenType.CLASS:
        case TokenType.FOR:
        case TokenType.FUN:
        case TokenType.IF:
        case TokenType.PRINT:
        case TokenType.RETURN:
        case TokenType.VAR:
        case TokenType.WHILE:
          return;
      }
      this.advance();
    }
  }
}
