#include <stdio.h>
#include <strings.h>

#include "common.h"
#include "scanner.h"

typedef struct {
  const char* start;
  const char* current;
  int line;
} Scanner;

Scanner scanner;

void scanner_init(const char* source) {
  scanner.start = source;
  scanner.current = source;
  scanner.line = 1;
}

inline static bool is_digit(char c) { return (c >= '0' && c <= '9'); }
inline static bool is_alpha(char c) {
  return ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c == '_'));
}

inline static bool is_eof(void) { return (*scanner.current == '\0'); }

inline static char peek(void) { return *scanner.current; }

static char peek_next(void) {
  if (is_eof()) {
    return '\0';
  }
  return *(scanner.current + 1);
}

static char advance(void) { return *(scanner.current++); }

static bool match(char expected) {
  if (is_eof()) {
    return false;
  }
  if (*scanner.current != expected) {
    return false;
  }
  scanner.current++;
  return true;
}

inline static Token make_token(TokenType type) {
  return (Token){
      .type = type,
      .start = scanner.start,
      .length = (long)(scanner.current - scanner.start),
      .line = scanner.line,
  };
}

inline static Token make_error(const char* msg) {
  return (Token){
      .type = TOKEN_ERROR,
      .start = msg,
      .length = (long)strlen(msg),
      .line = scanner.line,
  };
}

static Token scan_string(void) {
  while (peek() != '"' && !is_eof()) {
    if (peek() == '\n') {
      scanner.line++;
    }
    advance();
  }

  if (is_eof()) {
    return make_error("unterminated string");
  }

  // The closing quote
  advance();
  return make_token(TOKEN_STRING);
}

static Token scan_number(void) {
  while (is_digit(peek())) {
    advance();
  }

  // Look for a fractional part
  if (peek() == '.' && is_digit(peek_next())) {
    // Consume the dot
    advance();

    while (is_digit(peek())) {
      advance();
    }
  }

  return make_token(TOKEN_NUMBER);
}

static TokenType check_keyword(size_t start, size_t length, const char* rest,
                               TokenType type) {
  if ((((size_t)(scanner.current - scanner.start)) == (start + length)) &&
      (memcmp(scanner.start + start, rest, length) == 0)) {
    return type;
  }
  return TOKEN_IDENTIFIER;
}

static TokenType identifier_type(void) {
  switch (scanner.start[0]) {
    case 'a':
      return check_keyword(1, 2, "nd", TOKEN_AND);
    case 'c':
      return check_keyword(1, 4, "lass", TOKEN_CLASS);
    case 'e':
      return check_keyword(1, 3, "lse", TOKEN_ELSE);
    case 'f':
      if (scanner.current - scanner.start > 1) {
        switch (scanner.start[1]) {
          case 'a':
            return check_keyword(2, 3, "lse", TOKEN_FALSE);
          case 'o':
            return check_keyword(2, 1, "r", TOKEN_FOR);
          case 'u':
            return check_keyword(2, 1, "n", TOKEN_FUN);
        }
      }
      break;
    case 'i':
      return check_keyword(1, 1, "f", TOKEN_IF);
    case 'n':
      return check_keyword(1, 2, "il", TOKEN_NIL);
    case 'o':
      return check_keyword(1, 1, "r", TOKEN_OR);
    case 'p':
      return check_keyword(1, 4, "rint", TOKEN_PRINT);
    case 'r':
      return check_keyword(1, 5, "eturn", TOKEN_RETURN);
    case 's':
      return check_keyword(1, 4, "uper", TOKEN_SUPER);
    case 't':
      if (scanner.current - scanner.start > 1) {
        switch (scanner.start[1]) {
          case 'h':
            return check_keyword(2, 2, "is", TOKEN_THIS);
          case 'r':
            return check_keyword(2, 2, "ue", TOKEN_TRUE);
        }
      }
      break;
    case 'v':
      return check_keyword(1, 2, "ar", TOKEN_VAR);
    case 'w':
      return check_keyword(1, 4, "hile", TOKEN_WHILE);
  }

  return TOKEN_IDENTIFIER;
}

static Token scan_identifier(void) {
  while (is_alpha(peek()) || is_digit(peek())) {
    advance();
  }

  return make_token(identifier_type());
}

static void skip_whitespace(void) {
  for (;;) {
    char c = peek();
    switch (c) {
      case ' ':
      case '\t':
      case '\r':
        advance();
        break;
      case '\n':
        scanner.line++;
        advance();
        break;
      case '/':
        if (peek_next() == '/') {
          // A comment goes until the end of the line
          while (peek() != '\n' && !is_eof()) {
            advance();
          }
        } else {
          return;
        }
        break;
      default:
        return;
    }
  }
}

Token scan_token(void) {
  skip_whitespace();
  scanner.start = scanner.current;

  if (is_eof()) {
    return make_token(TOKEN_EOF);
  }

  char c = advance();
  if (is_alpha(c)) {
    return scan_identifier();
  }
  if (is_digit(c)) {
    return scan_number();
  }

  switch (c) {
    case '(':
      return make_token(TOKEN_LEFT_PAREN);
    case ')':
      return make_token(TOKEN_RIGHT_PAREN);
    case '{':
      return make_token(TOKEN_LEFT_BRACE);
    case '}':
      return make_token(TOKEN_RIGHT_BRACE);
    case ',':
      return make_token(TOKEN_COMMA);
    case '.':
      return make_token(TOKEN_DOT);
    case '-':
      return make_token(TOKEN_MINUS);
    case '+':
      return make_token(TOKEN_PLUS);
    case ';':
      return make_token(TOKEN_SEMICOLON);
    case '/':
      return make_token(TOKEN_SLASH);
    case '*':
      return make_token(TOKEN_STAR);
    case '!':
      return match('=') ? make_token(TOKEN_BANG_EQUAL) : make_token(TOKEN_BANG);
    case '=':
      return match('=') ? make_token(TOKEN_EQUAL_EQUAL)
                        : make_token(TOKEN_EQUAL);
    case '<':
      return match('=') ? make_token(TOKEN_LESS_EQUAL) : make_token(TOKEN_LESS);
    case '>':
      return match('=') ? make_token(TOKEN_GREATER_EQUAL)
                        : make_token(TOKEN_GREATER);
    case '"':
      return scan_string();
  }

  return make_error("unexpected character");
}
