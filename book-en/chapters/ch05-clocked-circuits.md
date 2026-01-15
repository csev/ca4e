# Clocked Circuits: Coordinating Computation Over Time

\index{clocked circuits}
\index{clock}
\index{propagation delay}

Combinational logic circuits, such as adders and logic gates, produce outputs that depend
only on their current inputs. However, physical circuits do not update instantaneously.
Signals require time to propagate through transistors and wires before stabilizing at
their final values. As circuits grow larger and more complex, this delay becomes
increasingly important.
\index{combinational circuits}

To build reliable systems, digital computers introduce a coordinating signal called a **clock**\index{clock}. The clock defines discrete moments when values are allowed to change, allowing computation to proceed in synchronized steps rather than continuously drifting through intermediate states.

---

## Propagation Delay and Circuit Length

When an input changes, it takes time for the effects of that change to travel through the
circuit. Each transistor introduces a small delay, and long paths through many devices
accumulate larger delays.

For example:

- a simple gate settles quickly - a multi-bit adder takes longer - a multiplier or complex
control path may take much longer

If outputs are observed before signals have fully settled, incorrect values may be captured. Circuit designers therefore identify the **slowest path** through a system, known as the critical path\index{critical path}, and ensure that enough time passes before results are used.

![Signal propagation through chained logic elements](images/ch05-propagation-delay.png)

---

## Clock Rate and System Timing

The clock rate of a processor specifies how often values are allowed to be updated. Each
clock cycle provides time for signals to propagate and stabilize before being stored.
\index{clock rate}

The maximum clock frequency is limited by:

- the physical length of signal paths - the number of transistors in the longest logical
path - the switching speed of the transistors - the size of the chip itself

Once the slowest element of the arithmetic and logic unit (ALU) is identified, the clock
must be slow enough to accommodate that delay. Faster clocks allow more operations per
second, but only if circuits can reliably settle within each cycle.
\index{ALU}

![Clock waveform showing discrete sampling points](images/ch05-clock-waveform.png)

---

## Separating Computation from Storage

To coordinate circuits, designers separate systems into two major categories:

- **combinational circuits**\index{combinational circuits}, which compute continuously
- **clocked storage elements**\index{clocked storage}, which update only on clock events

Adders and logic gates belong to the first category. Latches and registers belong to the
second.

During most of the clock cycle, combinational circuits compute based on stable stored
inputs. At the clock edge, new values are captured into storage elements, and the next
cycle of computation begins.

This separation prevents unstable intermediate values from propagating into stored state.

---

## Combining Adders, Registers, and Clocks

Consider a simple system that adds two numbers and stores the result:

- a register holds the current value - an adder computes a new value - a clock controls
when the register updates

While the clock is low, the register holds its value and the adder continuously computes
the sum based on that value. When the clock goes high, the computed sum is captured into
the register. The next cycle begins with a new stable value.

![Adder feeding a register under clock control](images/ch05-adder-register.png)

This structure is repeated throughout processors to create step-by-step execution.

---

## Building a Counter

By feeding the output of a register back into one input of an adder and fixing the other
input to the value one, a counting circuit can be created.
\index{counter}

Each clock cycle:

1. the adder computes current value plus one 2. the register stores the new value 3. the
process repeats

After reaching the maximum representable value, the counter overflows and wraps back to
zero.

![Counter built from adder and register](images/ch05-counter.png)

This simple structure forms the basis of timers, program counters, and many sequencing
mechanisms inside computers.
\index{Program Counter}

---

## From Hardware to Instructions

So far, all behavior has been determined by fixed wiring. To build programmable machines, behavior must be controlled by **instructions**\index{instructions} rather than physical switches.

An instruction is a pattern of bits that specifies which operations should occur during a
clock cycle. Instead of permanently connecting wires to force an action, instruction bits
enable or disable parts of the circuit dynamically.

This is achieved through **control logic**\index{control logic} that interprets instruction bits and routes signals accordingly.

---

## A Two-Instruction CPU

A minimal processor can be built using:

- a small register - an adder - control gates - a clock

Suppose the machine supports two instructions:

- **0** — clear the register
- **1** — add one to the register

Instruction bits are connected to control gates that determine whether the adder output or
zero is fed into the register. On each clock cycle, the selected value is stored.

![Tiny CPU datapath with instruction-controlled inputs](images/ch05-tiny-cpu.png)

Although extremely simple, this system demonstrates the core idea of programmable
behavior: control signals modify data paths on each cycle.

---

## Why Memory Is Required

Manual instruction selection is not sufficient for general computation. Real programs
require sequences of many instructions executed automatically.

To support this, computers store instructions in memory and retrieve them one by one during execution. This leads to the **fetch–decode–execute cycle**\index{fetch-decode-execute cycle}:

1. fetch instruction from memory 2. decode instruction bits into control signals 3.
execute operation 4. repeat

This loop continues as long as the program runs.

![Fetch-decode-execute cycle diagram](images/ch05-fde-cycle.png)

---

## Program Counter and Instruction Register

Two special registers manage instruction sequencing:

- the **Program Counter (PC)**\index{Program Counter} stores the address of the next instruction
- the **Current Instruction Register (CIR)**\index{Current Instruction Register} holds the instruction being executed

On each cycle, the PC advances, memory is accessed, and the CIR loads the next
instruction. Decoder circuits then examine the instruction bits and activate the
appropriate control signals for the ALU and registers.
\index{decoder}

![PC and CIR interaction with memory and control logic](images/ch05-pc-cir.png)

---

## Decoding Instructions with Gates

Instruction decoding is performed using combinations of logic gates called **decoders**\index{decoder}. A decoder converts bit patterns into individual control lines.

For example, if an instruction has three bits, a decoder can generate eight distinct
control signals, one for each possible instruction value. These signals activate specific
parts of the circuit for each instruction type.

![Binary decoder activating control lines](images/ch05-decoder.png)

This mechanism allows compact binary instructions to control large physical systems.

---

## Abstraction Through Repetition

Although real processors contain billions of transistors, they are composed of repeated
versions of the same fundamental structures:

- adders - registers - multiplexers - decoders

Complex behavior emerges from organized combinations of simple components operating under
synchronized timing.

This layered abstraction allows designers to reason about machines in terms of data paths
and control flows rather than individual transistors.

---

## Summary: Time Makes Programs Possible

Clocked circuits introduce controlled timing into digital systems, allowing stable
computation to occur in discrete steps. By separating combinational logic from storage and
coordinating updates with a clock, reliable large-scale systems become possible.

Control logic and instruction decoding transform fixed circuits into programmable
machines. Registers, adders, and decoders cooperate to execute instruction sequences
automatically.

With clocked execution in place, computers can now run programs rather than merely perform
fixed calculations.

---

## What Comes Next

The next chapter examines machine language and processor architecture in more detail,
using a small but complete instruction set inspired by early microprocessors. Programs
will be written directly in machine code and executed in an emulator to reveal how
software and hardware meet at the lowest level.

