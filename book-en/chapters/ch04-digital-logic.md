# Digital Logic: Building Computation from Gates

\index{digital logic}\index{logic gates}\index{CPU}

With reliable transistors and scalable manufacturing in place, attention can shift from how devices are built to how computation itself is organized. Digital logic\index{digital logic} provides the abstraction that allows electrical behavior to be treated as mathematical structure. Voltages become symbols, wires become signals, and circuits become logical systems that can be reasoned about using rules rather than physical measurements.

This chapter introduces the logical building blocks of computers: gates\index{logic gates}, adders\index{adders}, and storage elements. These components form the foundation of processors and memory systems.

---

## Computers as Interconnected Components

Inside a computer, information moves along wires that carry electrical signals. Each
signal is interpreted as either a logical zero or one. Groups of wires connect major
subsystems such as the central processing unit, memory, and input/output devices.

![Generic computer system showing CPU, memory, and I/O](images/ch04-generic-computer.png)

Although software describes computation in abstract terms, every operation ultimately
becomes patterns of electrical signals traveling between physical components. Digital
logic provides the framework that connects these physical movements to symbolic meaning.

---

## What the CPU Does

The central processing unit (CPU)\index{CPU} executes programs by repeatedly performing a simple cycle: fetch an instruction, interpret it, and perform the required operation. The CPU is not intelligent in the human sense. It does not understand goals or meaning. Instead, it follows mechanical rules at very high speed, executing billions of operations per second in modern systems.

Programs written in high-level languages are translated into machine instructions that the
CPU can execute directly. Each instruction specifies small operations such as moving data,
performing arithmetic, or testing conditions.

At the hardware level, these operations are implemented entirely using combinations of
logic gates and storage elements.

---

## Logic Gates as Building Blocks

Logic gates accept one or more binary inputs and produce a binary output. Each gate
implements a simple logical rule.

The most common gates include:

- **NOT**, which inverts a signal  
- **AND**, which produces one only if all inputs are one  
- **OR**, which produces one if any input is one  
- **XOR**, which produces one if inputs differ  

![Truth tables and symbols for basic logic gates](images/ch04-basic-gates.png)

Although these operations are simple, they are sufficient to construct any digital
computation when combined appropriately.

---

## Representing Numbers in Binary

To perform arithmetic using logic gates, numbers must be represented using electrical signals. Humans normally use base‑10 representation\index{binary representation}, where each digit represents a power of ten. Digital systems instead use base‑2 representation\index{binary}, where each digit represents a power of two.

For example:

- The base‑10 number 6 is written as **110₂** in binary.  
- The base‑10 number 7 is written as **111₂**.  

Each bit position corresponds to a weight:

- leftmost bit → 4 - middle bit → 2 - rightmost bit → 1

Binary representation allows numerical values to be manipulated using simple logical
operations on individual bits.

![Binary place values for three-bit numbers](images/ch04-binary-place-values.png)

---

## Adding Numbers with Gates: Half Adders

The simplest arithmetic operation is addition. When adding two single bits, there are four
possible input combinations. The result must produce both a sum bit and a carry bit.

A **half adder**\index{half adder} is a circuit that adds two bits and produces:

- a **sum** output  
- a **carry** output\index{carry}  

The sum output is produced by an XOR gate, while the carry output is produced by an AND
gate.

![Half adder logic diagram and truth table](images/ch04-half-adder.png)

This circuit performs correct binary addition for single-bit values.

---

## Full Adders and Multi-Bit Addition

When adding multi-bit numbers, each bit position must also consider a carry value from the previous position. A **full adder**\index{full adder} extends the half adder by adding three inputs:

- bit A - bit B - carry‑in

It produces:

- a sum bit - a carry‑out bit

By chaining full adders together, multi-bit addition can be performed. Each stage passes
its carry output to the next stage, allowing numbers of arbitrary length to be added.

![Chained full adders forming a multi-bit adder](images/ch04-full-adder-chain.png)

In practice, processors use more sophisticated adder designs to improve speed, but the
fundamental principle remains the same.

---

## Storing Data with Feedback

Computation requires not only processing data but also remembering it. Storage is
implemented using circuits that maintain state over time.

The simplest storage element uses **feedback**\index{feedback}, where part of the output is fed back into the input of the circuit. This allows a value to persist even when the original input signal is removed.

An example is the **set-reset (SR) latch**\index{SR latch}, built from two cross‑connected NOR gates. Depending on the control inputs, the latch can store either a zero or a one.

![SR latch built from cross-coupled NOR gates](images/ch04-sr-latch.png)

Feedback loops introduce a new behavior: the circuit’s output depends not only on current
inputs, but also on past states.

---

## Clocked Storage: Gated D Latches

While simple latches can store data, processors require more controlled storage that changes only at specific times. This is achieved by introducing a clock signal\index{clock}.

A **gated D latch**\index{gated D latch} has:

- a data input (D) - a clock or control input (C)

When the clock is active, the latch copies the data input into its internal state. When
the clock is inactive, the stored value is held constant regardless of changes to the
input.

![Gated D latch timing and structure](images/ch04-gated-d-latch.png)

This behavior allows many storage elements to update in synchronized steps, forming the
basis of registers and memory systems.

---

## Registers from Multiple Latches

By grouping multiple gated D latches together, multi-bit storage units can be created. For example, three latches can store a three-bit number. Larger registers\index{registers} store entire machine words, allowing processors to hold intermediate values during computation.

Registers provide fast, temporary storage that supports arithmetic operations, branching
decisions, and data movement within the CPU.

![Three-bit register built from gated D latches](images/ch04-register.png)

These structures form the immediate working memory of the processor.

---

## Tools for Exploring Digital Logic

Modern educational tools allow digital circuits to be built and tested interactively.
Gate-level simulators can display signal flow, timing, and logical behavior, making it
easier to understand how complex systems emerge from simple components.

Some tools support layout-level construction, while others focus on abstract gate
connectivity. Both approaches reinforce the relationship between physical hardware and
logical structure.

By experimenting with gates, adders, and latches, it becomes clear that computation arises
not from individual devices but from organized patterns of interaction.

---

## Summary: From Gates to Computation

Digital logic transforms electrical behavior into mathematical structure. Logic gates
implement simple rules, adders perform arithmetic, and latches store information over
time.

By combining these components, complex machines can be built that execute programs,
manipulate data, and respond to inputs. The physical realities of electronics remain
present, but abstraction allows designers to reason about systems in logical terms.

With digital logic in place, the final step toward building a processor is introducing
coordinated timing and instruction sequencing.

---

## What Comes Next

The next chapter introduces clocked circuits and control logic. These mechanisms
coordinate when data moves and when operations occur, allowing entire programs to be
executed step by step inside the processor.
