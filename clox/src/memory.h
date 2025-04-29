#ifndef clox_memory_h
#define clox_memory_h

#include "common.h"

#define GROW_CAPACITY(capacity) ((capacity < 8) ? 8 : (capacity) * 2)

#define GROW_ARRAY(type, pointer, old_count, new_count) \
  (type*)reallocate(pointer, sizeof(type) * new_count)

#define FREE_ARRAY(type, pointer, count) reallocate(pointer, 0)

void* reallocate(void* pointer, size_t new_size);

#endif
