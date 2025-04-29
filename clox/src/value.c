#include "memory.h"
#include "value.h"

void valuearray_init(ValueArray* array) {
  array->capacity = 0;
  array->count = 0;
  array->values = NULL;
}

void valuearray_write(ValueArray* array, Value value) {
  if (array->capacity < array->count + 1) {
    size_t old_capacity = array->capacity;
    array->capacity = GROW_CAPACITY(old_capacity);
    array->values =
        GROW_ARRAY(Value, array->values, old_capacity, array->capacity);
  }

  array->values[array->count] = value;
  array->count++;
}

void valuearray_free(ValueArray* array) {
  FREE_ARRAY(Value, array->values, array->capacity);
  valuearray_init(array);
}
