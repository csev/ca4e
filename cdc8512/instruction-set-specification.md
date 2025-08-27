# CDC8512 8-Bit Machine Language Instruction Set Specification

## Overview

The CDC8512 is an 8-bit machine language emulator with a Harvard architecture featuring separate instruction and data memory spaces. Each instruction is encoded as an 8-bit binary pattern that specifies the operation and operands.

## Architecture

- **Instruction Memory**: 256 locations (0x00-0xFF) for program storage
- **Data Memory**: 256 locations (0x00-0xFF) for data storage  
- **Registers**: 
  - PC (Program Counter): 8-bit instruction pointer
  - A0, A1, A2, A3: 8-bit address registers
  - X0, X1, X2, X3: 8-bit data registers
  - Comparison: 2-bit comparison status register

## Instruction Format

```

## Instruction Encoding

### Bits 8-7
- '00' - Special instructions / IO
- '01' - Single register 8-bit instructions
- '10' - Single register + immediate 16bit instructions
- '11' - Reister to register copy

### Instructions

#### Special Instructions (00xxxxxx)
- `00000000` - HALT - Stop execution
- `00000001` - PS - Print data area as zero-terminated character string on a single line
- `00001111` - DATA - When loading, the following bytes are to be copied into the data memory starting at the zero address - loading is terminated by a zero byte

#### Single Register Instructions (01xxxxxx)
- `01000rrr` - INC rrr - Increment A or X register
- `01001rrr` - DEC rrr - Decrement A or X register
- `01010rrr` - CMPZ rrr - Compare register to zero, set CMP to < = >
- `0110ddss` - ADD X[dd], X[ss] - X[dd] = X[dd] + X[ss]
- `0111ddss` - SUB X[dd], X[ss] - X[dd] = X[dd] - X[ss]

#### Immediate Instructions (10xxxxxx)
- `10000rrr` - SET rrr, imm - Set register to immediate value (16-bit instruction)
- `10001rrr` - CMP rrr, imm - Compare register to immediate, set CMP = < = > (16-bit instruction)
- `10010rrr` - ADD rrr, imm - Add immediate to register (16-bit instruction)
- `10011rrr` - SUB rrr, imm - Subtract immediate from register (16-bit instruction)
- `10100000` - JE imm - Jump if CMP == = (16-bit instruction)
- `10100001` - JL imm - Jump if CMP == < (16-bit instruction)
- `10100010` - JG imm - Jump if CMP == > (16-bit instruction)

#### Register Copy Instructions (11xxxxxx)
- `11dddsss` - MOV ddd, sss - Copy register sss to register ddd

### Register Field (bits 2-0)
- `000` - Register A0
- `001` - Register A1
- `010` - Register A2
- `011` - Register A3
- `100` - Register X0
- `101` - Register X1
- `110` - Register X2
- `111` - Register X3

## Detailed Instruction Set

SX3 A3      # Copy a register to another
SX3 42      # Set a register to an 8-bit constant (Base-10, single character or 0x hex)
INC A1      # Add 1 to a register
DEC X3      # Subtract 1 from a register
ADD X1, 42  # Add a constant to a register
SUB X3, 42  # Subtract a constant from a register
CMP X3, 42  # Compare a register to a constant and set comparison status
JP 0x12     # Jump to a label
JL 0x12     # Jump to the label if the previous comparison was "less than"
JE 0x12     # Jump to the label if the previous comparison was equal
JG 0x12     # Jump to the label if the previous comparison was "greater than"
PS          # Print data area as zero-terminated character string on a single line
HALT        # Stop Execution

## Detailed Instruction Semantics

### Special Instructions (00xxxxxx)

#### HALT (00000000)
- **Size**: 8 bits
- **Semantics**: Stop program execution
- **Assembly**: `HALT`
- **Description**: Terminates the program and halts the CPU

#### PS (00000001)
- **Size**: 8 bits
- **Semantics**: Print data memory as null-terminated string
- **Assembly**: `PS`
- **Description**: Outputs characters from data memory starting at address 0 until a null terminator (0) is encountered

#### DATA (00001111)
- **Size**: Variable (8-bit opcode + string data + null terminator)
- **Semantics**: Load string data into memory starting at address 0
- **Assembly**: `DATA 'string'`
- **Description**: During program loading, copies the specified string (including null terminator) into data memory starting at address 0. This instruction is processed during loading and does not execute during runtime.

### Single Register Instructions (01xxxxxx)

#### INC rrr (01000rrr)
- **Size**: 8 bits
- **Semantics**: reg = reg + 1
- **Assembly**: `INC reg`
- **Description**: Increments the specified register by 1. Works with both A and X registers.

#### DEC rrr (01001rrr)
- **Size**: 8 bits
- **Semantics**: reg = reg - 1
- **Assembly**: `DEC reg`
- **Description**: Decrements the specified register by 1. Works with both A and X registers.

#### CMPZ rrr (01010rrr)
- **Size**: 8 bits
- **Semantics**: CMP = (reg == 0 ? "=" : reg < 0 ? "<" : ">")
- **Assembly**: `CMPZ reg`
- **Description**: Compares the specified register to zero and sets the comparison flag accordingly

#### ADD X[dd], X[ss] (0110ddss)
- **Size**: 8 bits
- **Semantics**: X[dd] = X[dd] + X[ss]
- **Assembly**: `ADD X[dd], X[ss]`
- **Description**: Adds the value in source X register to destination X register

#### SUB X[dd], X[ss] (0111ddss)
- **Size**: 8 bits
- **Semantics**: X[dd] = X[dd] - X[ss]
- **Assembly**: `SUB X[dd], X[ss]`
- **Description**: Subtracts the value in source X register from destination X register

### Immediate Instructions (10xxxxxx)

#### SET rrr, imm (10000rrr + immediate_byte)
- **Size**: 16 bits
- **Semantics**: reg = immediate_value
- **Assembly**: `SET reg, imm`
- **Description**: Sets the specified register to the 8-bit immediate value (0-255)

#### CMP rrr, imm (10001rrr + immediate_byte)
- **Size**: 16 bits
- **Semantics**: CMP = (reg == imm ? "=" : reg < imm ? "<" : ">")
- **Assembly**: `CMP reg, imm`
- **Description**: Compares the specified register to the immediate value and sets the comparison flag

#### ADD rrr, imm (10010rrr + immediate_byte)
- **Size**: 16 bits
- **Semantics**: reg = reg + immediate_value
- **Assembly**: `ADD reg, imm`
- **Description**: Adds the immediate value to the specified register

#### SUB rrr, imm (10011rrr + immediate_byte)
- **Size**: 16 bits
- **Semantics**: reg = reg - immediate_value
- **Assembly**: `SUB reg, imm`
- **Description**: Subtracts the immediate value from the specified register

#### JE imm (10100000 + immediate_byte)
- **Size**: 16 bits
- **Semantics**: if (CMP == "=") PC = immediate_value
- **Assembly**: `JE imm`
- **Description**: Jumps to the immediate address if the comparison flag equals "="

#### JL imm (10100001 + immediate_byte)
- **Size**: 16 bits
- **Semantics**: if (CMP == "<") PC = immediate_value
- **Assembly**: `JL imm`
- **Description**: Jumps to the immediate address if the comparison flag equals "<"

#### JG imm (10100010 + immediate_byte)
- **Size**: 16 bits
- **Semantics**: if (CMP == ">") PC = immediate_value
- **Assembly**: `JG imm`
- **Description**: Jumps to the immediate address if the comparison flag equals ">"

### Register Copy Instructions (11xxxxxx)

#### MOV ddd, sss (11dddsss)
- **Size**: 8 bits
- **Semantics**: dest_reg = src_reg
- **Assembly**: `MOV dest_reg, src_reg`
- **Description**: Copies the value from source register to destination register. Works with both A and X registers.

### Comparison Flag (CMP)
The comparison flag is a 2-bit register that can hold three values:
- `"<"` - Less than
- `"="` - Equal
- `">"` - Greater than

The comparison flag is set by CMP and CMPZ instructions and used by conditional jump instructions.

## Program Example: "Hello"

Assembly
```
SET X2, 72    ; Set X2 to ASCII 'H' (72)
SET A2, 0     ; Set A2 to memory address 0
SET X2, 101   ; Set X2 to ASCII 'e' (101)
INC A2        ; Increment A2 to address 1
SET X2, 108   ; Set X2 to ASCII 'l' (108)
INC A2        ; Increment A2 to address 2
INC A2        ; Increment A2 to address 3 (second 'l' already in X2)
SET X2, 111   ; Set X2 to ASCII 'o' (111)
INC A2        ; Increment A2 to address 4
PS            ; Print string from memory
HALT          ; Stop execution
```

Binary
```
Address | Binary          | Assembly              | Description
--------|-----------------|----------------------|------------
0x00    | 10000110        | SET X2, 72           | Set X2 to 'H' (72)
0x01    | 01001000        | (72)                 | Immediate value: 72
0x02    | 10000010        | SET A2, 0            | Set A2 to 0 (memory address)
0x03    | 00000000        | (0)                  | Immediate value: 0
0x04    | 10000110        | SET X2, 101          | Set X2 to 'e' (101)
0x05    | 01100101        | (101)                | Immediate value: 101
0x06    | 01000010        | INC A2               | Increment A2 to 1
0x07    | 10000110        | SET X2, 108          | Set X2 to 'l' (108)
0x08    | 01101100        | (108)                | Immediate value: 108
0x09    | 01000010        | INC A2               | Increment A2 to 2
0x0A    | 01000010        | INC A2               | Increment A2 to 3 (second 'l')
0x0B    | 10000110        | SET X2, 111          | Set X2 to 'o' (111)
0x0C    | 01101111        | (111)                | Immediate value: 111
0x0D    | 01000010        | INC A2               | Increment A2 to 4
0x0E    | 00000001        | PS                   | Print string
0x0F    | 00000000        | HALT                 | Stop execution
```

## Program Example: "Hello World" Demonstating the data segment

Assembly
```
PS            ; Print string from memory
HALT          ; Stop execution
DATA  'Hello World!'
```

Binary
```
Address | Binary          | Assembly              | Description
--------|-----------------|----------------------|------------
0x00    | 00000001        | PS                   | Print string from memory
0x01    | 00000000        | HALT                 | Stop execution
0x02    | 00001111        | DATA 'Hello World!'  | Data segment marker
0x03    | 01001000        | 'H' (72)             | ASCII 'H'
0x04    | 01100101        | 'e' (101)            | ASCII 'e'
0x05    | 01101100        | 'l' (108)            | ASCII 'l'
0x06    | 01101100        | 'l' (108)            | ASCII 'l'
0x07    | 01101111        | 'o' (111)            | ASCII 'o'
0x08    | 00100000        | ' ' (32)             | ASCII space
0x09    | 01010111        | 'W' (87)             | ASCII 'W'
0x0A    | 01101111        | 'o' (111)            | ASCII 'o'
0x0B    | 01110010        | 'r' (114)            | ASCII 'r'
0x0C    | 01101100        | 'l' (108)            | ASCII 'l'
0x0D    | 01100100        | 'd' (100)            | ASCII 'd'
0x0E    | 00100001        | '!' (33)             | ASCII '!'
0x0F    | 00000000        | null terminator      | End of string
```

## Implementation Notes

1. **Memory Access**: All memory operations use the address registers (A0-A3) as pointers
2. **Immediate Values**: Extended to 8 bits (0-255) for immediate instructions using 16-bit format
3. **Comparison Logic**: Single comparison flag updated by CMP instruction
4. **Program Counter**: Automatically increments by instruction size (1 or 2 bytes) after each instruction (except jumps)
5. **Register Operations**: All arithmetic operations are 8-bit with no overflow handling
6. **I/O Operations**: Print operations output to console/display
7. **Reset Behavior**: Clears all memory to 0, sets all registers to 0, PC = 0

## Error Handling

- **Invalid Opcodes**: Unused opcode combinations should be treated as NOP
- **Memory Bounds**: Memory access beyond 0xFF should wrap around
- **Register Overflow**: 8-bit arithmetic operations wrap around (no overflow flag)
- **Invalid Jumps**: Jump addresses beyond instruction memory should wrap around

This specification provides a complete foundation for implementing the CDC8512 8-bit machine language emulator with clear bit patterns and semantic definitions for each instruction.
