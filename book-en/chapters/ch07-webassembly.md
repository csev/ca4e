# WebAssembly and Emulation: Running Real Programs in the Browser

\index{WebAssembly}\index{emulation}\index{emulator}

After building a complete mental model of how a CPU executes machine instructions, it
becomes possible to recognize the same ideas appearing in unexpected places. One of the
most surprising is the modern web browser. Today, browsers include built‑in virtual
machines capable of executing low‑level binary code safely and efficiently.

This chapter explores how emulation\index{emulation} and WebAssembly\index{WebAssembly} connect historical machine architectures to modern execution environments, and why the browser can now act as a practical platform for systems programming.

---

## From Hardware to Emulators

An emulator\index{emulator} is a program that imitates the behavior of a hardware processor. Instead of electrical signals moving through gates, software interprets instruction bytes and updates simulated registers and memory.

At a high level, an emulator performs the same steps as real hardware:

1. read the next instruction 2. decode the opcode 3. perform the operation 4. update
registers and memory 5. advance the program counter

This is the same fetch–decode–execute cycle implemented in software.

![Emulator executing instructions in software](images/ch07-emulator-loop.png)

Because modern computers are extraordinarily fast, they can often emulate older machines
faster than the original hardware ever ran.

---

## Why Emulation Is Practical Today

Early microprocessors such as the MOS 6502 contained only a few thousand transistors and
ran at clock speeds measured in megahertz. Modern processors contain billions of
transistors and operate at several gigahertz.

This enormous performance gap means that:

- JavaScript running in a browser can emulate historical CPUs in real time - graphics and
sound can be simulated accurately - entire vintage game systems can be recreated in
software

Web sites such as the Internet Archive host playable emulations of classic arcade machines
that run entirely in the browser.

![Classic game running in a browser-based emulator](images/ch07-arcade-emulator.png)

---

## The CDC6504 Emulator

The CDC6504 emulator\index{CDC6504} used in this course models a processor inspired by the MOS 6502\index{MOS 6502} instruction set with a simplified architecture. It includes:

- registers (A, X, Y, status flags) - instruction memory - data memory - branching and
arithmetic instructions

Each instruction is implemented as a small block of JavaScript that updates simulated
hardware state.

Conceptually, each opcode becomes a function that performs the same register and memory
updates that real circuitry would perform in silicon.

![Emulator showing registers, memory, and instruction pointer](images/ch07-cdc6504-ui.png)

---

## Machine Code Inside Software

When an emulator runs, machine code is not special. It is simply a sequence of numbers
stored in an array. The emulator reads these numbers and interprets them as instructions.

For example:

- a value may represent "load accumulator" - the next value may represent an address or
constant - branching instructions modify the program counter

The meaning comes entirely from how the emulator interprets the bits.

This mirrors exactly what real hardware does, except that software replaces physical
wiring.

---

## From Native CPUs to Virtual Machines

Historically, assembly language targeted specific processors:

- MOS 6502\index{MOS 6502}  
- Intel x86\index{x86}  
- ARM\index{ARM}  

Programs compiled for one architecture could not run on another without translation or
emulation.

WebAssembly changes this model by defining a portable virtual instruction set\index{virtual machine} that runs on top of browsers and other runtimes.

Instead of targeting physical hardware, compilers target a standardized virtual machine.

---

## What Is WebAssembly?

WebAssembly (WASM)\index{WebAssembly} is a low‑level, binary instruction format designed for safe and efficient execution in browsers and other environments. It is not tied to any specific physical CPU.

Key characteristics include:

- structured control flow  
- validated instruction sequences  
- sandboxed memory access\index{sandbox}  
- deterministic execution  

WASM programs cannot access files, devices, or the operating system directly. All
interaction with the outside world occurs through carefully controlled interfaces provided
by the host environment.

![WebAssembly execution sandbox inside the browser](images/ch07-wasm-sandbox.png)

---

## From C to WASM

Languages such as C and C++ can be compiled to WebAssembly using modern toolchains. The
compilation process is:

1. source code is compiled to WASM bytecode 2. the browser loads and validates the module
3. the runtime translates WASM to native machine code 4. the program executes at
near‑native speed

From the browser’s perspective, WebAssembly is just another kind of executable content,
similar to JavaScript but closer to machine operations.

---

## A WASM "Hello, World"

A minimal WebAssembly program may look like this in textual form (WAT)\index{WAT}:

```wat
(module
  (import "console" "log" (func $log (param i32 i32)))
  (memory 1)
  (data (i32.const 0) "Hello, World!")
  (func $main (result i32)
    (call $log (i32.const 0) (i32.const 13))
    (i32.const 42)
  )
  (export "main" (func $main))
)
```

This code:

- allocates memory - stores a string - calls a logging function - returns a numeric value

When compiled, it becomes a compact binary format that the browser can execute
efficiently.

![Hex dump of compiled WebAssembly module](images/ch07-wasm-hex.png)

---

## WASM Compared to Traditional Assembly

Although WebAssembly resembles assembly language, it differs in important ways:

- **Sandboxed by design** — no direct memory or OS access  
- **Safe execution model** — code is validated before running  
- **Portable bytecode** — same program runs on any platform  
- **Abstract machine** — targets a virtual stack machine  
- **Host optimization** — browsers compile and optimize at runtime  

Traditional assembly runs with full process privileges and depends entirely on the
operating system for protection. WASM embeds safety into the execution model itself.

---

## Loops, Functions, and the Stack

Like physical CPUs, WebAssembly supports:

- local variables - function calls - loops and branches - a call stack

When a function is called, parameters and return addresses are managed using stack
structures maintained by the runtime.

Even though the environment is virtual, the same concepts of control flow and memory
organization still apply.

---

## From Historical CPUs to Modern Devices

Over the last fifty years, many processor families have been developed, but two now
dominate consumer computing:

- **ARM**\index{ARM} processors, used in phones, tablets, and most laptops  
- **x86**\index{x86} processors, used in many desktop and server systems  

These architectures differ internally, but they all implement the same fundamental ideas
explored in this book: registers, memory, instructions, and controlled execution.

---

## Case Study: Apple’s CPU Transitions

Apple has moved across several processor families:

- MOS 6502 — early Apple computers - Motorola 68000 — early Macintosh systems - PowerPC —
mid‑1990s through mid‑2000s - Intel x86 — 2006 through 2020 - Apple‑designed ARM — 2020 to
present

To ease transitions, Apple built machine‑code translation systems that converted programs
from one architecture to another at launch time. This allowed users to run older software
while new native versions were developed.

These transitions demonstrate that software compatibility can be preserved even as
hardware changes dramatically.

---

## Why the 6502 Still Matters

The design philosophy of early microprocessors influenced later architectures. Engineers
who designed early ARM processors had deep experience with the 6502, and many principles
carried forward into modern instruction set design.

Although modern processors are vastly more complex, the core ideas remain recognizable.

Understanding a small historical CPU therefore provides insight into the design of modern
systems.

---

## Emulation as a Learning Tool

Emulators allow direct observation of how instructions change machine state:

- registers update - memory changes - branches alter execution flow

This visibility is rarely available on modern hardware, where pipelines and caches obscure
internal behavior.

For learning computer architecture, emulation provides clarity that real machines no
longer expose.

---

## Summary: Abstraction Without Losing Reality

WebAssembly and emulation demonstrate that low‑level computation remains relevant even in
modern software systems. Programs still execute as sequences of instructions that
manipulate memory and registers, whether those instructions are interpreted, emulated, or
executed directly in silicon.

The same architectural principles govern both historical processors and modern virtual
machines. Only the layers of abstraction have changed.

By tracing the path from physical circuits to browser‑based execution, the continuity of
computer architecture becomes clear.

---

## Closing Thoughts

Computers have evolved enormously in speed and scale, but not in fundamental design. Logic
gates became processors, processors became systems, and systems became virtual machines
running inside browsers.

Understanding how computation works at the lowest level makes it possible to see through
layers of abstraction and recognize the same mechanisms at work everywhere—from embedded
devices to cloud servers to web pages running in a browser.

This perspective provides both practical insight and a deeper appreciation for the
remarkable continuity of computing technology.
