#include <stdio.h>

#include "common.h"
#include "chunk.h"
#include "debug.h"
#include "vm.h"

int main(void) {
  vm_init();

  Chunk chunk;

  chunk_init(&chunk);

  size_t constant = chunk_add_constant(&chunk, 1.2);
  chunk_write(&chunk, OP_CONSTANT, 123);
  chunk_write(&chunk, (uint8_t)constant, 123);

  constant = chunk_add_constant(&chunk, 3.4);
  chunk_write(&chunk, OP_CONSTANT, 123);
  chunk_write(&chunk, (uint8_t)constant, 123);

  chunk_write(&chunk, OP_ADD, 123);

  constant = chunk_add_constant(&chunk, 5.6);
  chunk_write(&chunk, OP_CONSTANT, 123);
  chunk_write(&chunk, (uint8_t)constant, 123);

  chunk_write(&chunk, OP_DIVIDE, 123);
  chunk_write(&chunk, OP_NEGATE, 123);

  chunk_write(&chunk, OP_RETURN, 123);

  disassemble_chunk(&chunk, "test chunk");
  printf("\n");

  interpret(&chunk);

  chunk_free(&chunk);

  vm_free();
  return 0;
}
