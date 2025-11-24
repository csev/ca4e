#include <stdio.h>

int main() {
  register char *ch;
  char mem[] = "Hello";

  for(ch=mem; *ch; ch++) {
    if ( (*ch - 'a') < 0 ) continue;
    *ch = *ch - 0x20;
  }

  printf("%s\n", mem);
}
