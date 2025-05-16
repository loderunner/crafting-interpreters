#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sysexits.h>

#include "vm.h"

static void repl(void) {
  char line[1024];
  for (;;) {
    printf("> ");

    if (fgets(line, sizeof(line), stdin) == NULL) {
      printf("\n");
      break;
    }

    interpret(line);
  }
}

static char* read_file(const char* path) {
  FILE* f = fopen(path, "rb");
  if (f == NULL) {
    fprintf(stderr, "error: could not open file \"%s\"\n", path);
    exit(EX_NOINPUT);
  }

  int err = fseek(f, 0, SEEK_END);
  if (err != 0) {
    fprintf(stderr, "error: couldn't read file\"%s\"\n", path);
    exit(EX_IOERR);
  }

  long sz = ftell(f);
  if (sz == 0 || sz == -1) {
    fprintf(stderr, "error: couldn't read file\"%s\"\n", path);
    exit(EX_NOINPUT);
  }

  rewind(f);
  if (errno != 0) {
    fprintf(stderr, "error: couldn't read file\"%s\"\n", path);
    exit(EX_IOERR);
  }

  char* buf = malloc((size_t)sz + 1);
  if (buf == NULL) {
    fprintf(stderr, "error: not enough memory to read file\"%s\"\n", path);
    exit(EX_OSERR);
  }

  size_t count = fread(buf, sizeof(char), (size_t)sz, f);
  if (count != (size_t)sz || (ferror(f) != 0 && feof(f) == 0)) {
    fprintf(stderr, "error: couldn't read file\"%s\"\n", path);
    exit(EX_IOERR);
  }
  buf[count] = '\0';

  fclose(f);
  return buf;
}
static void run_file(const char* path) {
  char* source = read_file(path);
  InterpretResult result = interpret(source);
  free(source);

  if (result == INTERPRET_COMPILE_ERROR) {
    exit(EX_DATAERR);
  }
  if (result == INTERPRET_RUNTIME_ERROR) {
    exit(EX_SOFTWARE);
  }
}

int main(int argc, const char* argv[]) {
  vm_init();

  if (argc == 1) {
    repl();
  } else if (argc == 2) {
    run_file(argv[1]);
  } else {
    fprintf(stderr, "Usage: clox [path]\n");
    exit(64);
  }

  vm_free();
  return 0;
}
