#include <stdlib.h>

#include "check.h"
#include "./test_strlist.h"

#include "dmalloc.h"

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

unsigned long mark;

void setup_dmalloc(void) { mark = dmalloc_mark(); }

void teardown_dmalloc(void) {
  unsigned long unfreed = dmalloc_count_changed(mark, 1, 0);
  if (unfreed > 0) {
    unsigned int flags = dmalloc_debug_current();
    dmalloc_debug_setup("print-messages");
    dmalloc_log_unfreed();
    dmalloc_debug(flags);

    ck_abort_msg("Unfreed memory after test");
  }
}
