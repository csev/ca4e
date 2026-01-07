#include <stdio.h>

int main() {
  register int xr,acc;
  char mem[6] = "Hello";

  for(xr=0;mem[xr];xr++) {
    acc = mem[xr];
    if ( (acc - 'a') < 0 ) continue;
    mem[xr] = acc - 0x20;
  }

  printf("%s\n", mem);
}
