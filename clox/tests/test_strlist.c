#include "./test_strlist.h"
#include "./test_main.h"

#include "check.h"
#include "dmalloc.h"

#include "strlist.h"

START_TEST(test_strlist_new) {
  strlist *l = strlist_new();

  ck_assert_ptr_nonnull(l);
  ck_assert_int_eq(dmalloc_examine(l, 0, 0, 0, 0, 0, 0, 0), DMALLOC_NOERROR);

  strlist_free(l);
  ck_assert_int_eq(dmalloc_examine(l, 0, 0, 0, 0, 0, 0, 0), DMALLOC_ERROR);
}
END_TEST

Suite *strlist_suite(void) {
  Suite *s;
  TCase *tc;

  s = suite_create("strlist");

  tc = tcase_create("new");

  tcase_add_checked_fixture(tc, setup_dmalloc, teardown_dmalloc);
  tcase_add_test(tc, test_strlist_new);
  suite_add_tcase(s, tc);

  return s;
}
