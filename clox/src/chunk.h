#ifndef clox_chunk_h
#define clox_chunk_h

#include "common.h"
#include "value.h"

typedef enum {
  OP_CONSTANT,
  OP_NEGATE,
  OP_ADD,
  OP_SUBTRACT,
  OP_MULTIPLY,
  OP_DIVIDE,
  OP_RETURN,
} OpCode;

typedef struct {
  size_t count;
  size_t capacity;
  uint8_t* code;
  size_t* lines;
  ValueArray constants;
} Chunk;

void chunk_init(Chunk* chunk);
void chunk_write(Chunk* chunk, uint8_t byte, size_t line);
size_t chunk_add_constant(Chunk* chunk, Value value);
void chunk_free(Chunk* chunk);

#endif
