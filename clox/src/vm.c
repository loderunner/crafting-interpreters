#include <stdio.h>

#include "common.h"
#include "compiler.h"
#include "debug.h"
#include "vm.h"

VM vm;

static void reset_stack(void) { vm.stack_top = vm.stack; }

void vm_init(void) { reset_stack(); }

void vm_free(void) {}

void push(Value value) {
  *vm.stack_top = value;
  vm.stack_top++;
}

Value pop(void) {
  vm.stack_top--;
  return *vm.stack_top;
}

static InterpretResult run(void) {
#define READ_BYTE() (*vm.ip++)
#define READ_CONSTANT() (vm.chunk->constants.values[READ_BYTE()])
#define BINARY_OP(op) \
  do {                \
    double r = pop(); \
    double l = pop(); \
    push(l op r);     \
  } while (false)

  for (;;) {
#ifdef DEBUG_TRACE_EXECUTION
    printf("\t");
    for (Value* slot = vm.stack; slot < vm.stack_top; slot++) {
      printf("[ ");
      value_print(*slot);
      printf(" ]");
    }
    printf("\n");
    disassemble_instruction(vm.chunk, (size_t)(vm.ip - vm.chunk->code));
#endif
    uint8_t instruction;
    switch (instruction = READ_BYTE()) {
      case OP_CONSTANT: {
        Value value = READ_CONSTANT();
        push(value);
        break;
      }
      case OP_NEGATE:
        push(-pop());
        break;
      case OP_ADD:
        BINARY_OP(+);
        break;
      case OP_SUBTRACT:
        BINARY_OP(-);
        break;
      case OP_MULTIPLY:
        BINARY_OP(*);
        break;
      case OP_DIVIDE:
        BINARY_OP(/);
        break;
      case OP_RETURN:
        value_print(pop());
        printf("\n");
        return INTERPRET_OK;
    }
  }

#undef BINARY_OP
#undef READ_CONSTANT
#undef READ_BYTE
}

InterpretResult interpret(const char* source) {
  Chunk chunk;
  chunk_init(&chunk);

  if (!compile(source, &chunk)) {
    chunk_free(&chunk);
    return INTERPRET_COMPILE_ERROR;
  }

  vm.chunk = &chunk;
  vm.ip = chunk.code;

  run();

  chunk_free(&chunk);
  return INTERPRET_OK;
}
