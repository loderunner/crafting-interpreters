#include "common.h"
#include "chunk.h"
#include "debug.h"

int main(void) {
  Chunk chunk;

  chunk_init(&chunk);

  size_t constant = chunk_add_constant(&chunk, 2.4);
  chunk_write(&chunk, OP_CONSTANT);
  chunk_write(&chunk, (uint8_t)constant);

  chunk_write(&chunk, OP_RETURN);

  disassemble_chunk(&chunk, "test chunk");

  chunk_free(&chunk);

  return 0;
}
