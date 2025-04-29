#ifndef clox_chunk_h
#define clox_chunk_h

#include "common.h"

typedef enum { OP_RETURN } OpCode;

typedef struct {
  size_t count;
  size_t capacity;
  uint8_t* code;
} Chunk;

void chunk_init(Chunk* chunk);
void chunk_write(Chunk* chunk, uint8_t byte);
void chunk_free(Chunk* chunk);

#endif
