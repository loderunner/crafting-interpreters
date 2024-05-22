MKDIR := mkdir
RMDIR := rmdir

SRCDIR := src
INCLUDEDIR := src
BUILDDIR := build
OUT := clox

SRCFILES := $(shell find $(SRCDIR) -type f -name "*.c")
OBJFILES := $(SRCFILES:$(SRCDIR)/%.c=$(BUILDDIR)/%.o)

WARNINGS := -Wall -Wextra -pedantic -Wshadow -Wpointer-arith -Wcast-align \
			-Wwrite-strings -Wmissing-declarations -Wredundant-decls -Wnested-externs \
			-Winline -Wuninitialized -Wconversion -Wstrict-prototypes -Werror
CFLAGS := -std=c17 $(WARNINGS) $(CFLAGS)

.PHONY: clean

$(OUT): $(OBJFILES)
	@$(CC) $(LDFLAGS) -o $@ $(OBJFILES)

clean:
	-@$(RM) $(OBJFILES) $(OUT)
	-@$(RMDIR) $(BUILDDIR)


$(BUILDDIR):
	@$(MKDIR) $(BUILDDIR)

$(BUILDDIR)/%.o: $(SRCDIR)/%.c Makefile $(BUILDDIR)
	@$(CC) $(CFLAGS) -I$(INCLUDEDIR) -c -o $@ $<