#include <check.h>
#include <stdlib.h>

#include "strlist.h"

START_TEST(test_strlist_new) {
  strlist *l = strlist_new("Hello World!");

  ck_assert_ptr_nonnull(l);
  ck_assert_ptr_nonnull(l->str);
  ck_assert_str_eq(l->str, "Hello World!");
  ck_assert_ptr_null(l->next);
  ck_assert_ptr_null(l->prev);
}
END_TEST

Suite *strlist_suite(void) {
  Suite *s;
  TCase *tc_core;

  s = suite_create("Strlist");

  tc_core = tcase_create("New");

  tcase_add_test(tc_core, test_strlist_new);
  suite_add_tcase(s, tc_core);

  return s;
}

int main(void) {
  int number_failed;
  Suite *s;
  SRunner *sr;

  s = strlist_suite();
  sr = srunner_create(s);

  srunner_run_all(sr, CK_NORMAL);
  number_failed = srunner_ntests_failed(sr);
  srunner_free(sr);

  return (number_failed == 0) ? EXIT_SUCCESS : EXIT_FAILURE;
}
