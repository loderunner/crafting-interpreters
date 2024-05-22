#include "strlist.h"
#include <stdlib.h>

strlist *strlist_new(const char *str) {
  strlist *l = malloc(sizeof(strlist));
  l->str = str;
  l->prev = 0;
  l->next = 0;

  return l;
}

void strlist_free(strlist *l, int free_all) {
  if (!free_all) {
    free(l);
    return;
  }

  while (l != 0) {
    strlist *next = l->next;
    free(l);
    l = next;
  }
}

void strlist_insert(strlist *l, strlist *item, int insert_all) {
  strlist *end = item;
  if (insert_all) {
    while (end->next != 0) {
      end = end->next;
    }
  }

  item->prev = l;
  end->next = l->next;

  if (l->next != 0) {
    l->next->prev = end;
  }
  l->next = item;
}

void strlist_remove(strlist *l, int remove_all) {
  if (remove_all) {
    if (l->prev != 0) {
      l->prev->next = 0;
      l->prev = 0;
    }
    return;
  }

  if (l->prev != 0) {
    l->prev->next = l->next;
  }

  if (l->next != 0) {
    l->next->prev = l->prev;
  }

  l->next = 0;
  l->prev = 0;
}
