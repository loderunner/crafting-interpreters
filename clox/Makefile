# Define directory commands as variables for better portability
MKDIR := mkdir
RMDIR := rmdir

# Define directory structure
SRCDIR := src
INCLUDEDIR := src
BUILDDIR := build
TESTDIR := tests
OUT := clox                # Main executable name
CHECK := $(TESTDIR)/check  # Test executable name

# Identify source files and define output object files
MAINFILE := src/main.c
SRCFILES := $(shell find $(SRCDIR) -type f -name "*.c" -not -name "main.c")
OBJFILES := $(SRCFILES:$(SRCDIR)/%.c=$(BUILDDIR)/%.o)
TESTFILES := $(shell find $(TESTDIR) -type f -name "*.c")
TESTOBJFILES := $(TESTFILES:$(TESTDIR)/%.c=$(TESTDIR)/%.o)

# Comprehensive set of compiler warnings to ensure high code quality
WARNINGS := -Wall -Wextra -Wshadow -Wpointer-arith -Wcast-align \
            -Wwrite-strings -Wmissing-declarations -Wredundant-decls \
            -Wnested-externs -Winline -Wuninitialized -Wconversion \
            -Wstrict-prototypes -Werror
# Standard compiler flags using C17 standard plus warnings
CFLAGS := -std=c17 $(WARNINGS) $(CFLAGS)
# Test-specific flags that enable dmalloc memory debugging
TESTCFLAGS := -DDMALLOC -DDMALLOC_FUNC_CHECK $(CFLAGS)

# Mark the 'clean' target as not representing a file
.PHONY: clean

# Main build target that creates the executable
$(OUT): $(MAINFILE) $(OBJFILES)
	@$(CC) $(CFLAGS) $(LDFLAGS) -o $@ $(MAINFILE) $(OBJFILES)

# Clean target to remove built files
clean:
	-@$(RM) $(OBJFILES) $(OUT) $(TESTOBJFILES) $(CHECK)
	-@$(RMDIR) $(BUILDDIR)

# Create the build directory if it doesn't exist
$(BUILDDIR):
	@$(MKDIR) $(BUILDDIR)

# Rule to compile source files to object files
$(BUILDDIR)/%.o: $(SRCDIR)/%.c Makefile $(BUILDDIR)
	@$(CC) $(CFLAGS) -I$(INCLUDEDIR) -c -o $@ $

# Rule to compile test files to object files
$(TESTDIR)/%.o: $(TESTDIR)/%.c Makefile
	@$(CC) $(TESTCFLAGS) -I$(INCLUDEDIR) -c -o $@ $

# Rule to build the test executable
$(CHECK): $(TESTOBJFILES) $(OBJFILES)
	@$(CC) $(LDFLAGS) -lcheck -ldmalloc -o $@ $(TESTOBJFILES) $(OBJFILES)

# Run tests
check: $(CHECK)
	@./tests/check