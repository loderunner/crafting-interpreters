#include <stdarg.h>
#include <stdio.h>

#include "common.h"
#include "compiler.h"
#include "debug.h"
#include "vm.h"

VM vm;

static void reset_stack(void) { vm.stack_top = vm.stack; }

static void runtime_error(const char* format, ...) {
  va_list args;
  va_start(args, format);
  vfprintf(stderr, format, args);
  va_end(args);
  fputs("\n", stderr);

  size_t instruction = ((size_t)(vm.ip - vm.chunk->code)) - 1;
  size_t line = vm.chunk->lines[instruction];
  fprintf(stderr, "[line %lu] in script\n", line);
  reset_stack();
}

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

Value peek(int distance) { return vm.stack_top[-1 - distance]; }

static InterpretResult run(void) {
#define READ_BYTE() (*vm.ip++)
#define READ_CONSTANT() (vm.chunk->constants.values[READ_BYTE()])
#define BINARY_OP(as_value, op)                       \
  do {                                                \
    if (!IS_NUMBER(peek(0)) || !IS_NUMBER(peek(1))) { \
      runtime_error("operands must be numbers");      \
      return INTERPRET_RUNTIME_ERROR;                 \
    }                                                 \
    double r = AS_NUMBER(pop());                      \
    double l = AS_NUMBER(pop());                      \
    push(as_value(l op r));                           \
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
      case OP_NIL:
        push(NIL_VALUE());
        break;
      case OP_TRUE:
        push(BOOL_VALUE(true));
        break;
      case OP_FALSE:
        push(BOOL_VALUE(false));
        break;
      case OP_NEGATE:
        if (!IS_NUMBER(peek(0))) {
          runtime_error("operand must be a number");
          return INTERPRET_RUNTIME_ERROR;
        }
        push(NUMBER_VALUE(-AS_NUMBER(pop())));
        break;
      case OP_ADD:
        BINARY_OP(NUMBER_VALUE, +);
        break;
      case OP_SUBTRACT:
        BINARY_OP(NUMBER_VALUE, -);
        break;
      case OP_MULTIPLY:
        BINARY_OP(NUMBER_VALUE, *);
        break;
      case OP_DIVIDE:
        BINARY_OP(NUMBER_VALUE, /);
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
