#include <stdio.h>

#include "debug.h"

void disassemble_chunk(Chunk* chunk, const char* name) {
  printf("== %s ==\n", name);
  for (size_t offset = 0; offset < chunk->count;) {
    offset = disassemble_instruction(chunk, offset);
  }
}

static size_t simple_instruction(const char* name, size_t offset) {
  printf("%s\n", name);
  return offset + 1;
}

static void print_value(Value value) { printf("%g", value); }

static size_t constant_instruction(const char* name, Chunk* chunk,
                                   size_t offset) {
  uint8_t constant = chunk->code[offset + 1];
  printf("%-16s %4hu '", name, constant);
  print_value(chunk->constants.values[constant]);
  printf("'\n");
  return offset + 2;
}

size_t disassemble_instruction(Chunk* chunk, size_t offset) {
  printf("%04lu ", offset);

  if (offset > 0 && chunk->lines[offset] == chunk->lines[offset - 1]) {
    printf("   | ");
  } else {
    printf("%4lu ", chunk->lines[offset]);
  }

  uint8_t instruction = chunk->code[offset];
  switch (instruction) {
    case OP_CONSTANT:
      return constant_instruction("OP_CONSTANT", chunk, offset);
    case OP_RETURN:
      return simple_instruction("OP_RETURN", offset);
    default:
      printf("Unknown opcode %d\n", instruction);
      return offset + 1;
  }
}
