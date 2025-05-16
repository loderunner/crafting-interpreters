#include <stdio.h>

#include "common.h"
#include "compiler.h"
#include "scanner.h"

const char* token_name(TokenType type) {
  switch (type) {
    case TOKEN_LEFT_PAREN:
      return "LEFT_PAREN";
    case TOKEN_RIGHT_PAREN:
      return "RIGHT_PAREN";
    case TOKEN_LEFT_BRACE:
      return "LEFT_BRACE";
    case TOKEN_RIGHT_BRACE:
      return "RIGHT_BRACE";
    case TOKEN_COMMA:
      return "COMMA";
    case TOKEN_DOT:
      return "DOT";
    case TOKEN_MINUS:
      return "MINUS";
    case TOKEN_PLUS:
      return "PLUS";
    case TOKEN_SEMICOLON:
      return "SEMICOLON";
    case TOKEN_SLASH:
      return "SLASH";
    case TOKEN_STAR:
      return "STAR";
    case TOKEN_BANG:
      return "BANG";
    case TOKEN_BANG_EQUAL:
      return "BANG_EQUAL";
    case TOKEN_EQUAL:
      return "EQUAL";
    case TOKEN_EQUAL_EQUAL:
      return "EQUAL_EQUAL";
    case TOKEN_GREATER:
      return "GREATER";
    case TOKEN_GREATER_EQUAL:
      return "GREATER_EQUAL";
    case TOKEN_LESS:
      return "LESS";
    case TOKEN_LESS_EQUAL:
      return "LESS_EQUAL";
    case TOKEN_IDENTIFIER:
      return "IDENTIFIER";
    case TOKEN_STRING:
      return "STRING";
    case TOKEN_NUMBER:
      return "NUMBER";
    case TOKEN_AND:
      return "AND";
    case TOKEN_CLASS:
      return "CLASS";
    case TOKEN_ELSE:
      return "ELSE";
    case TOKEN_FALSE:
      return "FALSE";
    case TOKEN_FOR:
      return "FOR";
    case TOKEN_FUN:
      return "FUN";
    case TOKEN_IF:
      return "IF";
    case TOKEN_NIL:
      return "NIL";
    case TOKEN_OR:
      return "OR";
    case TOKEN_PRINT:
      return "PRINT";
    case TOKEN_SUPER:
      return "SUPER";
    case TOKEN_RETURN:
      return "RETURN";
    case TOKEN_THIS:
      return "THIS";
    case TOKEN_TRUE:
      return "TRUE";
    case TOKEN_VAR:
      return "VAR";
    case TOKEN_WHILE:
      return "WHILE";
    case TOKEN_ERROR:
      return "ERROR";
    case TOKEN_EOF:
      return "EOF";
    default:
      return "unknown";
  }
}

void compile(const char* source) {
  scanner_init(source);

  long line = -1;
  for (;;) {
    Token tok = scan_token();
    if (tok.line != line) {
      printf("%4ld ", tok.line);
      line = tok.line;
    } else {
      printf("   | ");
    }
    printf("%13s '%.*s'\n", token_name(tok.type), (int)tok.length, tok.start);

    if (tok.type == TOKEN_EOF) {
      break;
    }
  }
}
