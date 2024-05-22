#include <stdio.h>

#include "strlist.h"

void print_list(strlist *l) {
  printf("%s", l->str);
  while (l->next != 0) {
    printf(" ");
    l = l->next;
    printf("%s", l->str);
  }
  printf("\n");
}

int main(void) {
  strlist *hello = strlist_new("Hello");

  strlist *world = strlist_new("World");
  strlist_insert(hello, world, 0);

  strlist *exclamatation_mark = strlist_new("!");
  strlist_insert(world, exclamatation_mark, 0);

  print_list(hello);

  return 0;
}
