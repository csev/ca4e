(;

This is a simple C program:


#include <stdio.h>

int main() {
    printf("Hello world!");
}

That was compiled to wat as follows:

emcc hello.c -O0 -s STANDALONE_WASM -Wl,--no-entry -o hello.wasm
wasm2wat hello.wasm -o hello.wat

;)
