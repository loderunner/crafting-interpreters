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

int strlist_len(strlist *l) {
  if (*l == 0) {
    return 0;
  }

  int i;
  strlist_node *n = *l;
  for (i = 0; n != 0; i++) {
    n = n->next;
  }

  return i;
}

const char *strlist_get(strlist *l, int index) {
  int i;
  strlist_node *n = *l;
  for (i = 0; i < index; i++) {
    n = n->next;
  }

  return n->str;
}

void strlist_insert(strlist *l, int index, const char *str) {
  if (*l == 0) {
    strlist_node *item = malloc(sizeof(strlist_node));

    size_t len = strlen(str) + 1;
    item->str = malloc(sizeof(char) * len);
    strncpy(item->str, str, len);

    item->prev = 0;
    item->next = 0;

    *l = item;

    return;
  }

  int i;
  strlist_node *n = *l;
  for (i = 0; i < index - 1; i++) {
    n = n->next;
  }

  strlist_node *item = malloc(sizeof(strlist_node));

  size_t len = (strlen(str) + 1);
  item->str = malloc(sizeof(char) * len);
  strncpy(item->str, str, len);

  item->prev = n;
  item->next = n->next;
  n->next = item;
  n->next->prev = item;
}

void strlist_remove(strlist *l, int index) {
  int i;
  strlist_node *n = *l;
  for (i = 0; i < index; i++) {
    n = n->next;
  }

  n->next->prev = n->prev;
  n->prev->next = n->next;

  free(n->str);
  free(n);
}
