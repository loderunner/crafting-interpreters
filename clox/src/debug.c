#include <stdio.h>

#include "debug.h"

size_t simple_instruction(const char* name, size_t offset) {
  printf("%s\n", name);
  return offset + 1;
}

void disassemble_chunk(Chunk* chunk, const char* name) {
  printf("== %s ==\n", name);
  for (size_t offset = 0; offset < chunk->count;) {
    offset = disassemble_instruction(chunk, offset);
  }
}

size_t disassemble_instruction(Chunk* chunk, size_t offset) {
  printf("%04lu ", offset);

  uint8_t instruction = chunk->code[offset];
  switch (instruction) {
    case OP_RETURN:
      return simple_instruction("OP_RETURN", offset);
    default:
      printf("Unknown opcode %d\n", instruction);
      return offset + 1;
  }
}
