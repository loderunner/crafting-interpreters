export enum TokenType {
  // Single-character tokens.
  LEFT_PAREN,
  RIGHT_PAREN,
  LEFT_BRACE,
  RIGHT_BRACE,
  COMMA,
  DOT,
  MINUS,
  PLUS,
  SEMICOLON,
  SLASH,
  STAR,

  // One or two character tokens.
  BANG,
  BANG_EQUAL,
  EQUAL,
  EQUAL_EQUAL,
  GREATER,
  GREATER_EQUAL,
  LESS,
  LESS_EQUAL,

  // Literals.
  IDENTIFIER,
  STRING,
  NUMBER,

  // Keywords.
  AND,
  CLASS,
  ELSE,
  FALSE,
  FUN,
  FOR,
  IF,
  NIL,
  OR,
  PRINT,
  RETURN,
  SUPER,
  THIS,
  TRUE,
  VAR,
  WHILE,

  // End-of-file
  EOF,
}

export type Literal = string | number | boolean | null;

export class Token {
  constructor(
    readonly tokenType: TokenType,
    readonly lexeme: string,
    readonly literal: Literal,
    readonly line: number,
  ) {}

  toString(): string {
    return `${TokenType[this.tokenType]} ${this.lexeme} ${JSON.stringify(this.literal)}`;
  }
}
