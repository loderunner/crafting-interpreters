#ifndef STRLIST_H
#define STRLIST_H

typedef struct strlist strlist;

struct strlist {
  const char *str;
  strlist *next;
  strlist *prev;
};

strlist *strlist_new(const char *str);
void strlist_free(strlist *l, int free_all);
void strlist_insert(strlist *l, strlist *item, int insert_all);
void strlist_remove(strlist *l, int remove_all);

#endif
