# CA4E Book Authoring Style Guide (STYLE.md)

This document defines the **house style**, **author directives**, and **LLM collaboration rules**
for the *Computer Architecture for Everybody (CA4E)* book.

The goal is to preserve a strong narrative through-line **while augmenting it with worked examples,
figures, and code explanations** suitable for a technical textbook.

---

## 1. Voice and Tone

**Audience**
- Intelligent, curious readers
- Little or no formal computer architecture background
- Comfortable with programming concepts, but not hardware jargon

**Voice**
- Friendly, calm, confident
- Instructor-at-the-whiteboard, not academic paper
- Slightly playful is OK; never snarky or cute

**Tone**
- Explanatory, not persuasive
- Concrete before abstract
- Slow down around diagrams and code

**Avoid**
- Marketing language
- Overly formal academic phrasing
- Long philosophical digressions during worked examples

---

## 2. Overall Structure Philosophy

The book alternates between two modes:

1. **Conceptual Narrative**
   - Smooth, essay-like exposition
   - Big ideas, history, motivation, mental models

2. **Worked Examples**
   - Figures, diagrams, layouts, code, emulators
   - Careful step-by-step explanation
   - Explicit guidance on how to *read* artifacts

---

## 3. Worked Example Pattern (Canonical)

Worked examples should generally follow this structure:

1. **Setup**
   - What this example is
   - Why it exists
   - What question it answers

2. **Artifact**
   - Figure, diagram, code listing, or emulator screenshot
   - Clear caption

3. **Guided Walkthrough**
   - Explain the artifact top-to-bottom or left-to-right
   - Describe *why* each part exists
   - Narrate behavior or execution where relevant

4. **Takeaway**
   - 2–3 sentences connecting back to the big idea
   - What the reader should now notice or understand

---

## 4. Figure Explanations

When explaining figures:

- Assume the reader is seeing it for the first time
- Explicitly name components and regions
- Use phrases like:
  - “Notice that…"
  - “At this point…"
  - “This part exists because…”

If labels exist (A, B, C):
- Refer to them explicitly
- Keep explanations spatial, not abstract

Do **not** assume prior visual literacy.

---

## 5. Code Walkthroughs

Code explanations should:

- Narrate execution, not restate syntax
- Explain what changes in:
  - Registers
  - Memory
  - Control flow
- Focus only on *important* lines

Prefer:
- “When this instruction runs…”
- “At the end of the loop…”
- “The invariant here is…”

Avoid:
- Line-by-line commentary on trivial syntax
- Language reference–style explanations

---

## 6. Historical Asides

Historical material should:

- Be clearly marked as an aside
- Support understanding of modern systems
- Stay concise

History is used to explain *why things look the way they do today*,
not for completeness.

---

## 7. Common Misconceptions

When included:

- Present the tempting wrong idea first
- Explain why it seems reasonable
- Then correct it clearly

Never shame the reader.
Use mistakes as learning tools.

---

## 8. ChatGPT / LLM Author Directives

Author-only instructions to the LLM are embedded directly in Markdown.

### Canonical Directive Block

Use fenced code blocks with the language tag `chatgpt`:

```markdown
```chatgpt
FIGURE EXPLANATION
Write a worked-example explanation for the figure above.
Walk the reader through it step by step.
Focus on intuition, not equations.
```
```

### Rules for Directive Blocks

- Content inside `chatgpt` blocks is **NOT book text**
- The LLM should:
  - Generate only the missing prose
  - Never include the directive itself in output
  - Never rewrite existing text unless explicitly told

### Common Directive Types

- FIGURE EXPLANATION
- CODE WALKTHROUGH
- WORKED EXAMPLE
- HISTORICAL ASIDE
- COMMON MISCONCEPTION
- WHY THIS MATTERS

The first line acts as a **mode switch**.

---

## 9. Guardrails for LLM Use (Especially in Cursor)

When invoking an LLM:

Always include at least one of:
- “Do not modify existing text.”
- “Only add new text at the indicated location.”
- “Return Markdown only.”

For safety, prefer **append-only** behavior.

---

## 10. Consistency Over Perfection

- Slight repetition is acceptable
- Clarity beats elegance
- Teach the reader *how to see*, not just *what is true*

This book optimizes for learning, not compression.

---

**End of STYLE.md**
