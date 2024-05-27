import { error } from './index.js';
import Token, { Literal, TokenType } from './token.js';

export default class Scanner {
  private tokens: Token[] = [];
  private start = 0;
  private current = 0;
  private line = 1;

  constructor(private readonly source: string) {}

  get eof(): boolean {
    return this.current >= this.source.length;
  }

  scanTokens(): ReadonlyArray<Readonly<Token>> {
    while (!this.eof) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, '', null, this.line));

    return this.tokens;
  }

  private scanToken() {
    const c = this.advance();
    switch (c) {
      case '(':
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case ')':
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case '{':
        this.addToken(TokenType.LEFT_BRACE);
        break;
      case '}':
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      case ',':
        this.addToken(TokenType.COMMA);
        break;
      case '.':
        this.addToken(TokenType.DOT);
        break;
      case '-':
        this.addToken(TokenType.MINUS);
        break;
      case '+':
        this.addToken(TokenType.PLUS);
        break;
      case ';':
        this.addToken(TokenType.SEMICOLON);
        break;
      case '*':
        this.addToken(TokenType.STAR);
        break;
      case '!':
        this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      case '=':
        this.addToken(
          this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL,
        );
        break;
      case '>':
        this.addToken(
          this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER,
        );
        break;
      case '<':
        this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      case '/':
        if (this.match('/')) {
          // A comment goes to the end of the line
          while (this.peek() !== '\n' && !this.eof) {
            this.advance();
          }
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;
      case ' ':
      case '\t':
      case '\r':
        // Ignore whitespace
        break;
      case '\n':
        this.line++;
        break;
      case '"':
        this.scanString();
        break;
      default:
        if (isDigit(c)) {
          this.scanNumber();
          break;
        }
        if (isAlpha(c)) {
          this.scanIdentifier();
          break;
        }
        error(this.line, `unexpected character: ${c}`);
        break;
    }
  }

  private scanString() {
    while (this.peek() !== '"' && !this.eof) {
      if (this.peek() === '\n') {
        this.line++;
      }
      this.advance();
    }

    if (this.eof) {
      error(this.line, 'unterminated string');
      return;
    }

    this.advance(); // The closing '"'

    // Trim the surrounding quotes
    this.addToken(
      TokenType.STRING,
      this.source.slice(this.start + 1, this.current - 1),
    );
  }

  private scanNumber() {
    while (isDigit(this.peek())) {
      this.advance();
    }

    if (this.peek() === '.' && isDigit(this.peekNext())) {
      this.advance(); //Consume the '.'

      while (isDigit(this.peek())) {
        this.advance();
      }
    }

    this.addToken(
      TokenType.NUMBER,
      Number.parseFloat(this.source.slice(this.start, this.current)),
    );
  }

  private scanIdentifier() {
    while (isAlphanumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.slice(this.start, this.current);
    switch (text) {
      case 'and':
        this.addToken(TokenType.AND);
        break;
      case 'class':
        this.addToken(TokenType.CLASS);
        break;
      case 'else':
        this.addToken(TokenType.ELSE);
        break;
      case 'false':
        this.addToken(TokenType.FALSE);
        break;
      case 'fun':
        this.addToken(TokenType.FUN);
        break;
      case 'for':
        this.addToken(TokenType.FOR);
        break;
      case 'if':
        this.addToken(TokenType.IF);
        break;
      case 'nil':
        this.addToken(TokenType.NIL);
        break;
      case 'or':
        this.addToken(TokenType.OR);
        break;
      case 'print':
        this.addToken(TokenType.PRINT);
        break;
      case 'return':
        this.addToken(TokenType.RETURN);
        break;
      case 'super':
        this.addToken(TokenType.SUPER);
        break;
      case 'this':
        this.addToken(TokenType.THIS);
        break;
      case 'true':
        this.addToken(TokenType.TRUE);
        break;
      case 'var':
        this.addToken(TokenType.VAR);
        break;
      case 'while':
        this.addToken(TokenType.WHILE);
        break;
      default:
        this.addToken(TokenType.IDENTIFIER);
    }
  }

  private addToken(tokenType: TokenType, literal: Literal = null) {
    this.tokens.push(
      new Token(
        tokenType,
        this.source.slice(this.start, this.current),
        literal,
        this.line,
      ),
    );
  }

  private advance(): string {
    return this.source[this.current++];
  }

  private peek(): string | undefined {
    return this.source[this.current];
  }

  private peekNext(): string | undefined {
    return this.source[this.current + 1];
  }

  private match(expected: string): boolean {
    if (this.source[this.current] !== expected) {
      return false;
    }

    this.current++;
    return true;
  }
}

function isDigit(c: string | undefined): boolean {
  return c !== undefined && c.charCodeAt(0) >= 48 && c.charCodeAt(0) <= 57;
}

function isAlpha(c: string | undefined): boolean {
  return (
    c !== undefined &&
    (c === '_' ||
      (c.charCodeAt(0) >= 65 && c.charCodeAt(0) <= 90) ||
      (c.charCodeAt(0) >= 90 && c.charCodeAt(0) <= 122))
  );
}

function isAlphanumeric(c: string | undefined): boolean {
  return isDigit(c) || isAlpha(c);
}
