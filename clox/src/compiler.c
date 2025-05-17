#include <stdio.h>
#include <stdlib.h>

#include "common.h"
#include "compiler.h"
#include "scanner.h"

#ifdef DEBUG_PRINT_CODE
#include "debug.h"
#endif

/* ---- Data Structures ---- */

typedef enum {
  PREC_NONE,
  PREC_ASSIGN,      // =
  PREC_OR,          // or
  PREC_AND,         // and
  PREC_EQUALITY,    // ==, !=
  PREC_COMPARISON,  // <, <=, >, <=
  PREC_TERM,        // + -
  PREC_FACTOR,      // * /
  PREC_UNARY,       // - !
  PREC_CALL,        // . ()
  PREC_PRIMARY,
} Precedence;

typedef struct {
  Token current;
  Token previous;
  bool had_error;
  bool panic_mode;
} Parser;

typedef void (*ParseFn)(void);

typedef struct {
  ParseFn prefix;
  ParseFn infix;
  Precedence precedence;
} ParseRule;

/* ---- Global State ---- */

Parser parser;
Chunk* compiling_chunk;

/* ---- Helper Functions ---- */

static Chunk* current_chunk(void) { return compiling_chunk; }

static void error_at(Token* token, const char* message) {
  if (parser.panic_mode) {
    return;
  }
  parser.panic_mode = true;
  fprintf(stderr, "[line %ld] Error", token->line);

  if (token->type == TOKEN_EOF) {
    fprintf(stderr, " at end");
  } else if (token->type == TOKEN_ERROR) {
    // Nothing
  } else {
    fprintf(stderr, " at '%.*s'", (int)token->length, token->start);
  }

  fprintf(stderr, ": %s\n", message);
  parser.had_error = true;
}

static void error_at_current(const char* message) {
  error_at(&parser.current, message);
}

static void error(const char* message) { error_at(&parser.previous, message); }

/* ---- Scanner Interface ---- */

static void advance(void) {
  parser.previous = parser.current;

  for (;;) {
    parser.current = scan_token();
    if (parser.current.type != TOKEN_ERROR) {
      break;
    }

    error_at_current(parser.current.start);
  }
}

static void consume(TokenType type, const char* message) {
  if (parser.current.type == type) {
    advance();
    return;
  }

  error_at_current(message);
}

/* ---- Bytecode Emission ---- */

static void emit_byte(uint8_t byte) {
  chunk_write(current_chunk(), byte, (size_t)parser.previous.line);
}

static void emit_bytes(uint8_t byte1, uint8_t byte2) {
  emit_byte(byte1);
  emit_byte(byte2);
}

static void emit_return(void) { emit_byte(OP_RETURN); }

static uint8_t make_constant(Value value) {
  size_t constant = chunk_add_constant(current_chunk(), value);
  if (constant > UINT8_MAX) {
    error("too many constants in chunk");
    return 0;
  }

  return (uint8_t)constant;
}

static void emit_constant(Value value) {
  emit_bytes(OP_CONSTANT, make_constant(value));
}

/* ---- Parse Rules Table ---- */

static void grouping(void);
static void unary(void);
static void binary(void);
static void number(void);
static void expression(void);
static void parse_precedence(Precedence prec);

// Table defining parse rules for each token type
static ParseRule rules[] = {
    [TOKEN_LEFT_PAREN] = {grouping, NULL, PREC_NONE},
    [TOKEN_RIGHT_PAREN] = {NULL, NULL, PREC_NONE},
    [TOKEN_LEFT_BRACE] = {NULL, NULL, PREC_NONE},
    [TOKEN_RIGHT_BRACE] = {NULL, NULL, PREC_NONE},
    [TOKEN_COMMA] = {NULL, NULL, PREC_NONE},
    [TOKEN_DOT] = {NULL, NULL, PREC_NONE},
    [TOKEN_MINUS] = {unary, binary, PREC_TERM},
    [TOKEN_PLUS] = {NULL, binary, PREC_TERM},
    [TOKEN_SEMICOLON] = {NULL, NULL, PREC_NONE},
    [TOKEN_SLASH] = {NULL, binary, PREC_FACTOR},
    [TOKEN_STAR] = {NULL, binary, PREC_FACTOR},
    [TOKEN_BANG] = {NULL, NULL, PREC_NONE},
    [TOKEN_BANG_EQUAL] = {NULL, NULL, PREC_NONE},
    [TOKEN_EQUAL] = {NULL, NULL, PREC_NONE},
    [TOKEN_EQUAL_EQUAL] = {NULL, NULL, PREC_NONE},
    [TOKEN_GREATER] = {NULL, NULL, PREC_NONE},
    [TOKEN_GREATER_EQUAL] = {NULL, NULL, PREC_NONE},
    [TOKEN_LESS] = {NULL, NULL, PREC_NONE},
    [TOKEN_LESS_EQUAL] = {NULL, NULL, PREC_NONE},
    [TOKEN_IDENTIFIER] = {NULL, NULL, PREC_NONE},
    [TOKEN_STRING] = {NULL, NULL, PREC_NONE},
    [TOKEN_NUMBER] = {number, NULL, PREC_NONE},
    [TOKEN_AND] = {NULL, NULL, PREC_NONE},
    [TOKEN_CLASS] = {NULL, NULL, PREC_NONE},
    [TOKEN_ELSE] = {NULL, NULL, PREC_NONE},
    [TOKEN_FALSE] = {NULL, NULL, PREC_NONE},
    [TOKEN_FOR] = {NULL, NULL, PREC_NONE},
    [TOKEN_FUN] = {NULL, NULL, PREC_NONE},
    [TOKEN_IF] = {NULL, NULL, PREC_NONE},
    [TOKEN_NIL] = {NULL, NULL, PREC_NONE},
    [TOKEN_OR] = {NULL, NULL, PREC_NONE},
    [TOKEN_PRINT] = {NULL, NULL, PREC_NONE},
    [TOKEN_SUPER] = {NULL, NULL, PREC_NONE},
    [TOKEN_RETURN] = {NULL, NULL, PREC_NONE},
    [TOKEN_THIS] = {NULL, NULL, PREC_NONE},
    [TOKEN_TRUE] = {NULL, NULL, PREC_NONE},
    [TOKEN_VAR] = {NULL, NULL, PREC_NONE},
    [TOKEN_WHILE] = {NULL, NULL, PREC_NONE},
    [TOKEN_ERROR] = {NULL, NULL, PREC_NONE},
    [TOKEN_EOF] = {NULL, NULL, PREC_NONE},
};

static ParseRule* get_rule(TokenType type) { return &rules[type]; }

/* ---- Parsing Functions ---- */

static void parse_precedence(Precedence prec) {
  advance();
  ParseFn prefix_rule = get_rule(parser.previous.type)->prefix;
  if (prefix_rule == NULL) {
    error("expected expression");
    return;
  }

  prefix_rule();

  while (prec <= get_rule(parser.current.type)->precedence) {
    advance();
    ParseFn infix_rule = get_rule(parser.previous.type)->infix;
    infix_rule();
  }
}

static void expression(void) { parse_precedence(PREC_ASSIGN); }

/* ---- Expression Parsers ---- */

static void number(void) {
  double value = strtod(parser.previous.start, NULL);
  emit_constant(value);
}

static void grouping(void) {
  expression();
  consume(TOKEN_RIGHT_PAREN, "expected ')' after expression");
}

static void unary(void) {
  TokenType op = parser.previous.type;

  // Compile the operand
  parse_precedence(PREC_UNARY);

  // Emit the operator instruction
  switch (op) {
    case TOKEN_MINUS:
      emit_byte(OP_NEGATE);
      break;
    default:
      return;  // unreachable
  }
}

static void binary(void) {
  TokenType op = parser.previous.type;

  ParseRule* rule = get_rule(op);
  parse_precedence((Precedence)(rule->precedence + 1));

  switch (op) {
    case TOKEN_PLUS:
      emit_byte(OP_ADD);
      break;
    case TOKEN_MINUS:
      emit_byte(OP_SUBTRACT);
      break;
    case TOKEN_STAR:
      emit_byte(OP_MULTIPLY);
      break;
    case TOKEN_SLASH:
      emit_byte(OP_DIVIDE);
      break;
    default:
      return;  // unreachable
  }
}

/* ---- Compiler Interface ---- */

static void end_compiler(void) {
  emit_return();
#ifdef DEBUG_PRINT_CODE
  if (!parser.had_error) {
    disassemble_chunk(current_chunk(), "code");
  }
#endif
}

bool compile(const char* source, Chunk* chunk) {
  scanner_init(source);
  compiling_chunk = chunk;

  parser.had_error = false;
  parser.panic_mode = false;

  advance();
  expression();
  consume(TOKEN_EOF, "expected end of expression");

  end_compiler();
  return !parser.had_error;
}
