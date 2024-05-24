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

START_TEST(test_strlist_insert_one) {
  strlist *l = strlist_new();

  strlist_insert(l, 0, "Hello");
  ck_assert_str_eq(strlist_get(l, 0), "Hello");

  strlist_free(l);
}
END_TEST

START_TEST(test_strlist_insert_many) {
  strlist *l = strlist_new();

  strlist_insert(l, 0, "Hello");
  strlist_insert(l, 1, "World");
  strlist_insert(l, 2, "!");

  ck_assert_str_eq(strlist_get(l, 0), "Hello");
  ck_assert_str_eq(strlist_get(l, 1), "World");
  ck_assert_str_eq(strlist_get(l, 2), "!");

  strlist_free(l);
}
END_TEST

START_TEST(test_strlist_insert_before) {
  strlist *l = strlist_new();

  strlist_insert(l, 0, "!");
  ck_assert_str_eq(strlist_get(l, 0), "!");

  strlist_insert(l, 0, "Hello");
  ck_assert_str_eq(strlist_get(l, 0), "Hello");
  ck_assert_str_eq(strlist_get(l, 1), "!");

  strlist_insert(l, 1, "World");
  ck_assert_str_eq(strlist_get(l, 0), "Hello");
  ck_assert_str_eq(strlist_get(l, 1), "World");
  ck_assert_str_eq(strlist_get(l, 2), "!");

  strlist_free(l);
}
END_TEST

START_TEST(test_strlist_remove_one) {
  strlist *l = strlist_new();

  strlist_insert(l, 0, "Hello");
  strlist_insert(l, 1, "World");
  strlist_insert(l, 2, "!");

  strlist_remove(l, 1);
  ck_assert_str_eq(strlist_get(l, 1), "!");

  strlist_remove(l, 0);
  ck_assert_str_eq(strlist_get(l, 0), "!");

  strlist_free(l);
}
END_TEST

START_TEST(test_strlist_remove_last) {
  strlist *l = strlist_new();

  strlist_insert(l, 0, "Hello");
  strlist_remove(l, 0);

  strlist_free(l);
}
END_TEST

START_TEST(test_strlist_len) {
  strlist *l = strlist_new();

  ck_assert_uint_eq(strlist_len(l), 0);

  strlist_insert(l, 0, "Hello");
  ck_assert_uint_eq(strlist_len(l), 1);

  strlist_insert(l, 1, "World");
  ck_assert_uint_eq(strlist_len(l), 2);

  strlist_remove(l, 1);
  ck_assert_uint_eq(strlist_len(l), 1);

  strlist_remove(l, 0);
  ck_assert_uint_eq(strlist_len(l), 0);

  strlist_free(l);
}
END_TEST

Suite *strlist_suite(void) {
  Suite *s;
  TCase *tc;

  s = suite_create("strlist");
  tc = tcase_create("main");

  tcase_add_checked_fixture(tc, setup_dmalloc, teardown_dmalloc);

  tcase_add_test(tc, test_strlist_new);
  tcase_add_test(tc, test_strlist_insert_one);
  tcase_add_test(tc, test_strlist_insert_many);
  tcase_add_test(tc, test_strlist_insert_before);
  tcase_add_test(tc, test_strlist_remove_one);
  tcase_add_test(tc, test_strlist_remove_last);
  tcase_add_test(tc, test_strlist_len);

  suite_add_tcase(s, tc);

  return s;
}
