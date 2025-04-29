#include "strlist.h"

#include <stdlib.h>
#include <string.h>

typedef struct strlist_node strlist_node;
struct strlist_node {
  char *str;
  strlist_node *prev;
  strlist_node *next;
};

strlist *strlist_new(void) {
  strlist *l = malloc(sizeof(strlist));
  *l = 0;
  return l;
}

void strlist_free(strlist *l) {
  if (*l != 0) {
    strlist_node *n = *l;
    while (n != 0) {
      strlist_node *next = n->next;
      free(n->str);
      free(n);
      n = next;
    }
  }

  free(l);
}

size_t strlist_len(strlist *l) {
  if (*l == 0) {
    return 0;
  }

  size_t i;
  strlist_node *n = *l;
  for (i = 0; n != 0; i++) {
    n = n->next;
  }

  return i;
}

const char *strlist_get(strlist *l, size_t index) {
  size_t i;
  strlist_node *n = *l;
  for (i = 0; i < index; i++) {
    n = n->next;
  }

  return n->str;
}

void strlist_insert(strlist *l, size_t index, const char *str) {
  strlist_node *item = malloc(sizeof(strlist_node));

  size_t len = strlen(str) + 1;
  item->str = malloc(sizeof(char) * len);
  strncpy(item->str, str, len);

  if (index == 0) {
    item->prev = 0;
    item->next = *l;

    *l = item;

    return;
  }

  size_t i;
  strlist_node *before = *l;
  for (i = 1; i < index; i++) {
    before = before->next;
  }

  strlist_node *after = before->next;

  item->prev = before;
  item->next = after;

  before->next = item;
  if (after != 0) {
    after->prev = item;
  }
}

void strlist_remove(strlist *l, size_t index) {
  if (index == 0) {
    strlist_node *n = *l;

    *l = n->next;
    if ((*l) != 0) {
      (*l)->prev = 0;
    }

    free(n->str);
    free(n);

    return;
  }

  size_t i;
  strlist_node *item = *l;
  for (i = 0; i < index; i++) {
    item = item->next;
  }

  strlist_node *before = item->prev;
  strlist_node *after = item->next;

  if (before != 0) {
    before->next = after;
  }
  if (after != 0) {
    after->prev = before;
  }

  free(item->str);
  free(item);
}
