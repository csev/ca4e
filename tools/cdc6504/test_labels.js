// Test the labels demo program
const program = `LDX X, 0       ; Zero X register
loop:
TXA            ; Transfer X to accumulator
CMP ACC, 5     ; Compare accumulator to 5
BEQ end        ; Branch if equal
INX            ; Increment X
JMP loop       ; Jump to loop
end:
BRK`;

console.log("Program:");
console.log(program);
console.log("\nExpected addresses:");
console.log("0: LDX X, 0 (A2 00)");
console.log("2: loop: TXA (8A)");
console.log("3: CMP ACC, 5 (C9 05)");
console.log("5: BEQ end (F0 offset)");
console.log("7: INX (E8)");
console.log("8: JMP loop (4C 02)");
console.log("10: end: BRK (00)");
