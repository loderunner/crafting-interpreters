#include <stdio.h>

#include "strlist.h"

void print_list(strlist* l) {
  int len = strlist_len(l);
  for (int i = 0; i < len; i++) {
    printf("%s\n", strlist_get(l, i));
  }
}

int main(void) {
  strlist* l = strlist_new();
  strlist_insert(l, 0, "Hello");
  strlist_insert(l, 1, "World");
  strlist_insert(l, 2, "!");

  print_list(l);

  strlist_free(l);

  return 0;
}
