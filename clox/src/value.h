#ifndef clox_value_h
#define clox_value_h

#include "common.h"

typedef double Value;

typedef struct {
  size_t count;
  size_t capacity;
  Value* values;
} ValueArray;

void valuearray_init(ValueArray* array);
void valuearray_write(ValueArray* array, Value value);
void valuearray_free(ValueArray* array);

#endif