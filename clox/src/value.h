#ifndef clox_value_h
#define clox_value_h

#include "common.h"

typedef enum {
  VAL_BOOL,
  VAL_NIL,
  VAL_NUMBER,
} ValueType;

typedef struct {
  ValueType type;
  union {
    bool boolean;
    double number;
  } as;
} Value;

#define IS_BOOL(v) ((v).type == VAL_BOOL)
#define IS_NIL(v) ((v).type == VAL_NIL)
#define IS_NUMBER(v) ((v).type == VAL_NUMBER)

#define AS_BOOL(v) ((v).as.boolean)
#define AS_NUMBER(v) ((v).as.number)

#define BOOL_VALUE(b) ((Value){.type = VAL_BOOL, .as.boolean = (b)})
#define NIL_VALUE() ((Value){.type = VAL_NIL, .as.number = 0})
#define NUMBER_VALUE(n) ((Value){.type = VAL_NUMBER, .as.number = (n)})

void value_print(Value value);

typedef struct {
  size_t count;
  size_t capacity;
  Value* values;
} ValueArray;

void valuearray_init(ValueArray* array);
void valuearray_write(ValueArray* array, Value value);
void valuearray_free(ValueArray* array);

#endif
