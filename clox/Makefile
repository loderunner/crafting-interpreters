MKDIR := mkdir
RMDIR := rmdir

SRCDIR := src
INCLUDEDIR := src
BUILDDIR := build
TESTDIR := tests
OUT := clox
CHECK := $(TESTDIR)/check

MAINFILE := src/main.c
SRCFILES := $(shell find $(SRCDIR) -type f -name "*.c" -not -name "main.c")
OBJFILES := $(SRCFILES:$(SRCDIR)/%.c=$(BUILDDIR)/%.o)
TESTFILES := $(shell find $(TESTDIR) -type f -name "*.c")
TESTOBJFILES := $(TESTFILES:$(TESTDIR)/%.c=$(TESTDIR)/%.o)


WARNINGS := -Wall -Wextra -Wshadow -Wpointer-arith -Wcast-align \
			-Wwrite-strings -Wmissing-declarations -Wredundant-decls \
			-Wnested-externs -Winline -Wuninitialized -Wconversion \
			-Wstrict-prototypes -Werror
CFLAGS := -std=c17 $(WARNINGS) $(CFLAGS)
TESTCFLAGS := -DDMALLOC -DDMALLOC_FUNC_CHECK $(CFLAGS)

.PHONY: clean

$(OUT): $(MAINFILE) $(OBJFILES)
	@$(CC) $(CFLAGS) $(LDFLAGS) -o $@ $(MAINFILE) $(OBJFILES)

clean:
	-@$(RM) $(OBJFILES) $(OUT) $(TESTOBJFILES) $(CHECK)
	-@$(RMDIR) $(BUILDDIR)

$(BUILDDIR):
	@$(MKDIR) $(BUILDDIR)

$(BUILDDIR)/%.o: $(SRCDIR)/%.c Makefile $(BUILDDIR)
	@$(CC) $(CFLAGS) -I$(INCLUDEDIR) -c -o $@ $<

$(TESTDIR)/%.o: $(TESTDIR)/%.c Makefile
	@$(CC) $(TESTCFLAGS) -I$(INCLUDEDIR) -c -o $@ $<

$(CHECK): $(TESTOBJFILES) $(OBJFILES)
	@$(CC) $(LDFLAGS) -lcheck -ldmalloc -o $@ $(TESTOBJFILES) $(OBJFILES)

check: $(CHECK)
	@./tests/check