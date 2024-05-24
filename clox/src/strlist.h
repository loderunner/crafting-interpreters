#ifndef STRLIST_H
#define STRLIST_H

typedef struct strlist_node *strlist;

strlist *strlist_new(void);
void strlist_free(strlist *l);
int strlist_len(strlist *l);
const char *strlist_get(strlist *l, int index);
void strlist_insert(strlist *l, int index, const char *str);
void strlist_remove(strlist *l, int index);

#endif
