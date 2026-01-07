

    emcc hello.c -O0 -s STANDALONE_WASM -Wl,--no-entry -o hello.wasm

    wasm2wat hello.wasm -o hello.wat

    xxd -g 1 -c 16 hello.wasm > hello_wasm.txt


