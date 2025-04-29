#include <stdlib.h>

#include "chunk.h"
#include "memory.h"

void chunk_init(Chunk* chunk) {
  chunk->count = 0;
  chunk->capacity = 0;
  chunk->code = NULL;
  valuearray_init(&chunk->constants);
};

void chunk_write(Chunk* chunk, uint8_t byte) {
  if (chunk->capacity < chunk->count + 1) {
    size_t old_capacity = chunk->capacity;
    chunk->capacity = GROW_CAPACITY(old_capacity);
    chunk->code =
        GROW_ARRAY(uint8_t, chunk->code, old_capacity, chunk->capacity);
  }
  chunk->code[chunk->count] = byte;
  chunk->count++;
}

size_t chunk_add_constant(Chunk* chunk, Value value) {
  valuearray_write(&chunk->constants, value);
  return chunk->constants.count - 1;
}

void chunk_free(Chunk* chunk) {
  FREE_ARRAY(uint8_t, chunk->code, chunk->capacity);
  chunk_init(chunk);
}
