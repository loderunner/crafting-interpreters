import {
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
} from './expr.js';
import { error } from './index.js';
import Token, { TokenType } from './token.js';

export class ParseError extends Error {}

export default class Parser {
  private current = 0;
  constructor(private tokens: ReadonlyArray<Readonly<Token>>) {}

  private get eof(): boolean {
    return this.peek().tokenType === TokenType.EOF;
  }

  parse(): Expr | undefined {
    try {
      return this.parseExpression();
    } catch (err) {
      if (err instanceof ParseError) {
        return;
      }
      throw err;
    }
  }

  private parseExpression(): Expr {
    return this.parseEquality();
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
    return this.parsePrimary();
  }

  private parsePrimary(): Expr {
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

    throw this.error(this.peek(), 'Expected expression');
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

    throw this.error(this.peek(), message);
  }

  private error(token: Token, message: string) {
    error(token, message);
    return new ParseError();
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
