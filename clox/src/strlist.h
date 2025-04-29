#ifndef STRLIST_H
#define STRLIST_H

#include <stddef.h>

typedef struct strlist_node *strlist;

strlist *strlist_new(void);
void strlist_free(strlist *l);
size_t strlist_len(strlist *l);
const char *strlist_get(strlist *l, size_t index);
void strlist_insert(strlist *l, size_t index, const char *str);
void strlist_remove(strlist *l, size_t index);

#endif
