# StepsToGreat

[![Content check](https://github.com/wildcat430524/StepsToGreat/actions/workflows/check.yml/badge.svg)](https://github.com/wildcat430524/StepsToGreat/actions/workflows/check.yml)
[![License: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](./LICENSE)
[![Docs: CC BY 4.0](https://img.shields.io/badge/docs-CC%20BY%204.0-lightgrey.svg)](./LICENSE-DOCS)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

**Open this folder and you get a one-on-one tutor.**

A Markdown protocol — any AI tool that opens it becomes your personal teacher:
it runs a placement test, teaches lessons, grades your work, explains *what you got wrong and why*,
then records your progress so you can pick up where you left off.

**Nothing to install for the learner.** No Node, no npm, no API key, no account.

[简体中文](./README.md) | English

**Contents**

[Start in 60 seconds](#start-in-60-seconds) ·
[Why this exists](#why-this-exists) ·
[Learning a book](#want-to-learn-a-book-or-any-material-properly-send-it-to-the-ai-it-teaches-you-step-by-step) ·
[Who it's for](#who-its-for-and-who-its-not-for) ·
[How it works](#how-it-works) ·
[Core mechanics](#core-mechanics) ·
[A full walkthrough](#a-complete-conversation-walkthrough) ·
[How these rules were verified](#how-these-rules-came-to-be-measured-not-guessed) ·
[Five-minute setup](#five-minute-setup) ·
[What you can learn](#what-you-can-learn) ·
[Learning rules](#learning-rules-make-them-yours) ·
[Supported AI tools](#supported-ai-tools) ·
[Want the skill version?](#want-install-once-use-everywhere-theres-a-skill-version) ·
[Layout](#layout) ·
[FAQ](#faq) ·
[Going deeper](#going-deeper) ·
[License](#license)

---

## Start in 60 seconds

**Don't read any further yet.** Just four things:

| # | Do this | You should see |
|---|---|---|
| **1** | Open this **folder** in an AI tool (not a file inside it) | `AGENTS.md` appears in the file tree |
| **2** | Say: `I'm the student. Read AGENTS.md first, then begin.` | The AI says it has read the protocol and recites the rule count |
| **3** | Ask it: `How many hard rules does AGENTS.md have?` | **12** = the rules are actually live |
| **4** | Just say what you want to learn | It probes your goals → placement test → lesson 1 |

> **Stuck?** [Troubleshooting decision tree](./教程/界面示意图.md#9-遇到问题先看这张图)｜**Which tool?** [Five steps](#five-minute-setup)
> **Time budget**: ~3 min to install a tool (Trae download) + ~10 min of probing/placement before lesson 1.

---

## Why this exists

AI is already good enough to teach. **What was always missing isn't content — it's someone watching you.**

| Your current situation | How StepsToGreat fixes it |
|---|---|
| You ask an AI "how do I learn Python?" — it hands you a roadmap, and then… nothing | The AI runs a placement test → finds your real level → plans the route → **ships lesson 1** |
| You finish a lesson; nobody checks whether you actually got it | Three-dimension assessment: **all ✅ before you may advance** |
| You get something wrong; the AI says "not quite" — and you still don't know where | Small mistakes are **fixed for you**, with the full "what you wrote → what's wrong and why → what I changed it to" |
| Close the chat and it forgets everything | State is written to files: **switch tools, come back a month later, keep going** |
| Switch AI tools and lose all your history | Your data is plain Markdown — **portable across any tool** |
| You own a book or a document, and quit after three pages | **Send it to the AI — it splits the material into lessons and walks you through, one at a time** |

### Versus just asking an AI

| | Just asking an AI | StepsToGreat |
|---|---|---|
| Persona | You re-explain "you're my teacher" every time | ✅ Baked into `AGENTS.md` — zero cost |
| Remembers your progress | ❌ Context only; gone when closed | ✅ Written to `我的学习/00-学习档案.md` |
| Makes you practise | ❌ Only answers when asked | ✅ Sets questions → waits for "done" → assesses |
| Points out your mistakes | ⚠️ Usually just gives the right answer | ✅ Three-part explanation, separating slips from real gaps |
| **Probes your actual needs** | ❌ You say "teach me English" and it just starts | ✅ **Keeps asking until it's sure it understands you** |
| Switching tools | ❌ History lost | ✅ Works anywhere |
| Who owns the data | The platform | ✅ Your own folder |

### How these rules came to be: measured, not guessed

**This section is where the project differs most from "yet another prompt collection."** Every rule should be traceable to the test that forced it into existence.

| # | How it was verified | What it caught | Report |
|---|---|---|---|
| **1** | **8 subject simulations** — an AI plays tutor through full teaching dialogues (real errors, repeated probing, frustration), then defects are extracted from the transcripts | All 8 subjects **needed patching**; **6 shared one core symptom** (can't decide whether an error is ② or ③) → hence the verdict mnemonic | [`docs/simulations/`](./docs/simulations/) |
| **2** | **Weak models as probes** — deliberately run at the lowest reasoning effort, because strong models **guess** their way past unclear protocol and hide the defect | Protocol itself **12/12**; plus 4 real defects (2 internal document contradictions + 2 protocol gaps) | [`docs/weak-model/WEAK-MODEL-REPORT.md`](./docs/weak-model/WEAK-MODEL-REPORT.md) |
| **3** | **End-to-end run** — the whole path: first use → placement → roadmap → lesson 1 → three rounds → lesson closed → state filed | 1 protocol gap + **1 broken-link defect in the templates that would hit every user** + 2 validator false positives | [`docs/E2E-RUN-REPORT.md`](./docs/E2E-RUN-REPORT.md) |
| **4** | **State validator** — 12 invariants checking whether your profile is self-consistent | Catches "marked mastered with no re-assessment evidence", "advanced before the previous lesson passed", "two re-assessment sections in one file" | [`协议/04_状态机.md`](./协议/04_状态机.md) + [`tests/`](./tests/) (19 regression cases) |

**Three numbers behind "adding rules ≠ adding value"**:

| Number | Meaning |
|---|---|
| **All 8 subjects needed patching** | The three-dimension **mechanism** is complete, but the **criteria** are described per dimension rather than per error |
| **133 suggestions → only 5 adopted** | The reports' value is **evidence**; rules take only what causes criteria to fight. **7 suggestions were explicitly rejected**, with reasons written down |
| **12 invariants + 19 regression cases** | "A real failure first, then a rule" — every invariant traces back to the test that exposed it |

> **The single most important finding** (from the 8 simulations):
> **The three-dimension *mechanism* is complete, but the *criteria* are described per dimension, not per error.**
> What a tutor actually needs is the reverse: **given an error, look up which dimension it belongs to.**
> Fixing that one thing was worth more than fixing all 133 suggestions — which is exactly where the verdict
> mnemonic in [`协议/00_导师协议.md`](./协议/00_导师协议.md) §3 came from.

### Why the results differ: the AI keeps probing until it truly understands you

The biggest problem with an ordinary AI isn't bad answers — it's that **it never checks whether it understood you correctly**.
You say "teach me English" and it starts teaching. Teach *whom*? For an exam or for conversation? How long can you study per day? What's your level? It knows none of this — and **it doesn't ask**.

This project writes "**probe until confirmed**" into the protocol. On first contact, the AI sounds like this:

```
You: Teach me English.

AI:  Before we start, I need to be sure I actually understand you —
     I'll keep going until I can restate your goal back to you.

     1. "Learn English" — for what exactly?
        a) An exam (CET / IELTS / grad school)
        b) Speaking and conversation
        c) Reading papers / watching shows
     2. What's your current level? Open any English article, read for 30 seconds,
        and tell me roughly how much you understood.
     3. How much time can you *reliably* invest per day? (Give the real number,
        not the ideal one — I'll plan lessons around it.)

… (you answer, and the AI restates what it understood) …

AI:  Here's the goal as I understand it —
     "Pass CET-6 within 4 months; currently ~50% reading comprehension;
      40 minutes a day, more on weekends. Prioritise reading and listening,
      sprint writing before the exam."

     Right? Correct me if anything is off. **I won't start teaching until you confirm.**
```

**The key design point**: the probing isn't small talk — it's **disambiguation**. Every answer becomes
an input to the placement test and the course route. When you later ask "why is the course ordered this way?",
the answer traces back to what you confirmed on day one.

> This probing behaviour is written into `AGENTS.md` too — **whatever AI tool you use, it will ask the same way**.

### When you haven't decided yet: let it interrogate you

Sometimes you don't want to learn a subject — you want to **think one thing through**: should we switch approaches, what is this requirement actually asking, how should this decision land.
What's missing isn't an answer; it's **someone who keeps asking until you run out of things to say**.

Pointed at a decision, the same probing machinery behaves like this:

| Rule | What it says |
|---|---|
| **Only ask what can be asked now** | Every question rests on decisions that are **already settled**; anything depending on another open question waits for a later round |
| **Whole round at once + a recommended answer** | Every question in the current frontier is listed and numbered, each with **its recommended answer** — you just say "agreed" or "change it" |
| **Your answers grow the next round** | Settled decisions push the frontier outward and unblock questions that couldn't be asked before; round after round, until **nothing is left open** |
| **It looks up facts, you make the calls** | Anything findable in the files is not put to you; only "it's your call" questions reach you |
| **Nothing happens until you confirm** | You restate the understanding, both sides agree, and only then does it start |

**Capture as you go**: the conclusions can be written straight into two documents —

① **Decision records**: one entry = context / options / what was decided / why — see [`docs/adr/`](./docs/adr/);
② a **glossary**: one word, one meaning across the project — see [`CONTEXT.md`](./CONTEXT.md).
The point is plain: **three months from now, you can still remember why you decided it that way.**

> The one-line difference: a **placement test** fixes where you start (questions, no score); an **interrogation** fixes a decision (no questions, no right answer — it's your call).

---

## Want to learn a book (or any material) properly? Send it to the AI — it teaches you step by step

**This is the most common way people use the project**: you don't need prior knowledge or an outline —
**drop the book or document in, and the AI splits it into lessons, explains, quizzes, grades, and keeps your progress.**

```
You: My material is in 资料/ — the full PDF of <BOOK>. I want to actually learn it.

AI:  (reads the files first → maps the real table of contents and content)
     Before we start, let me make sure I've truly understood you:
     1. How deep do you need to go? a) pass an exam  b) be able to use it  c) be able to teach it
     2. How long can you consistently study each day?
     3. Which chapters matter most / which can be skipped?
     (you answer → the AI restates it → you confirm)

AI: Lesson 1 · Chapter 1 <the actual section name>
    📁 Files: 我的学习/学科/<SUBJECT>/01-第1章/
    📖 Key points: … (**from <BOOK>, chapter 1 section 2**)
    ✅ Your task: round 1, 2 questions (1–3 per round)
    → you answer in 01_学生回答.md → say "done"

AI:  (re-reads your answers → three-dimension assessment → small problems fixed
     directly and explained / big ones you derive yourself) → all ✅ → files it
     → **appends round 2 / ships lesson 2**
```

**All you ever say is "done"**. Everything else — placement → the book's **real structure** split into lessons →
two documents per lesson → three-dimension assessment → filing → next lesson — is the protocol's job.

### Versus asking an AI to "summarise this book"

| | "Summarise this book for me" | StepsToGreat |
|---|---|---|
| Output | A few thousand words of summary you read and forget | **One lesson at a time**, each one making you answer |
| Verification | ❌ None | ✅ Three dimensions; all ✅ required before advancing |
| Where you stopped | One pass and it's over | **Written to `00-学习档案.md`** — close it and resume anytime |
| When you're wrong | The summary glosses over it | Small mistakes fixed + explained; big ones you derive |
| Citation | "The book mentions…" (unverifiable) | **"from `<file>` section `<specific section>`"** (checkable) |
| Halfway through | Start over by asking again | Come back a month later and say "continue" |

### How to send it (three steps)

| Step | What to do |
|---|---|
| **1. Put it in** | Copy the file into [`资料/`](./资料/) (subfolders as you like, e.g. `资料/考研数学/`). **One item at a time — don't dump ten books in** |
| **2. Say one line** | "My material is in `资料/` — I want to properly learn <BOOK>, my goal is …, I have X minutes a day" |
| **3. Start answering** | The AI probes + runs a placement test, then ships lesson 1. After that you just answer and say "done" |

| Format | Support |
|---|---|
| `.md` `.txt` | ✅ Best |
| `.pdf` (text-based) | ✅ Good (**scans need OCR**) |
| `.docx` `.pptx` | ⚠️ Mediocre — save as `.md` instead |
| Images | ⚠️ Depends on the tool's vision support |
| Video | ❌ The AI can't read it — **give subtitles or your own notes** |

> Full details and discipline (**append-only** / never committed to git / note the source): [`资料/README.md`](./资料/README.md)

### Three hard constraints (so the AI can't fob you off)

| Constraint | What it means |
|---|---|
| **Teach from the actual content** | The tutor must read your file — **no inventing chapter numbers or quotes from memory** |
| **Cite down to the section** | Every point must be traceable to "from `<file>`, section N" — if it can't, it hasn't read it |
| **No fabricated reading lists** | The project **won't** hand you unverifiable book/chapter references; with no material, it simply explains the content itself |

> 💡 **No book handy?** It still works — say "I want to learn X, my background is Y" and the tutor writes the
> content into the lesson documents itself. Same rules; `资料/` makes it **better**, not **mandatory**.

---

## Who it's for — and who it's not for

**Said up front, so you don't waste a download.**

| ✅ Good fit | ❌ Not a fit |
|---|---|
| Self-studying a skill, but always quitting halfway | Wanting ready-made course videos / textbooks — **this project ships no content** |
| Wanting someone to watch you and check your work | Wanting a "ask one question, get one answer" assistant |
| A concrete goal (an exam / a project / a weak spot) | No goal at all, just browsing |
| Willing to **write answers** (typing or on paper) | Wanting to listen passively without doing exercises |
| Studying long-term (weeks to years) | Looking up a single fact once |
| You have your own material (textbooks / past papers / notes) | Expecting the AI to invent a curriculum from memory |

> **In one line**: if what you want is *someone who sets questions, grades them, and makes you practise* — this fits.
> If what you want is *content*, go find a course. This project handles **the person watching you**.

---

## How it works

```mermaid
flowchart TD
    A["① First open<br/>AI reads AGENTS.md"] --> B["② Requirements<br/>asks you 3 questions"]
    B --> C["③ Placement test<br/>5–8 questions"]
    C --> D["④ Sets your level + plans the route"]
    D --> E["⑤ Ships lesson 1"]
    E --> F["⑥ You answer"]
    F --> G["⑦ You say 'done'"]
    G --> H["⑧ AI re-reads the files<br/>never from memory"]
    H --> I["⑨ Assesses all three dimensions<br/>every question in one pass"]
    I --> J{"All ✅ ?"}
    J -->|"No"| K["Small: fixed directly + explained<br/>Big: you derive it yourself"]
    K --> G
    J -->|"Yes"| L["⑩ Files the result + next lesson"]
    L --> F
```

**You only ever say two things**: the opening line, and "**done**".

### Every lesson produces two documents

**This is how the teaching model is carried** — each lesson generates two Markdown files in the folder:

```
我的学习/学科/Python/03-for循环/
├── 01_教学引导.md    ← the tutor writes: explanation + examples + questions (laid out by round)
└── 01_学生回答.md    ← you write: answer in the blank slots; two placeholders at the end for the tutor
```

| Document | Who writes it | What's inside |
|---|---|---|
| **`01_教学引导.md`** | The tutor | Why learn it → core concepts → examples → old vs new → common traps → links to prior knowledge → key points → questions (by round) |
| **`01_学生回答.md`** | **You** | This round's questions + your answers; **two placeholders at the end**: `## 最终复评结果` (per-question three-dimension table) and `## 正确答案与解析` (three-part explanations) |

**Two key conventions**:

| Convention | What it means |
|---|---|
| **The answer document is the only learning evidence** | Mastery is judged **solely by its "Final re-assessment" section** — not by what was said in chat, not by what the AI claimed |
| **Appended round by round, never all at once** | The answer document starts with **round 1's questions only** (1–3 of them); once that round is all ✅, the tutor **appends** the next round — otherwise you'd see every question up front, which defeats the whole point |

> 💡 **Why two documents instead of one chat**:
> a chat disappears when you close it; documents stay. Three months later, when you want to review
> "what did I get wrong about for loops?", open `01_学生回答.md` and you'll see your original answer,
> why it was wrong, and the fix — **instead of scrolling back through a chat log**.

---

## Core mechanics

### 1. Three dimensions — all ✅ to advance

Every topic is assessed on three **independent** dimensions — the soul of the project:

| Dimension | Programming | English | Math | Humanities |
|---|---|---|---|---|
| ① **Concept** | Do you get it | Did you understand | Are the concepts clear | Did you grasp it |
| ② **Logic** | Algorithm / edge cases | Does it express the meaning | Derivation / calculation | Does the argument hold |
| ③ **Form** | Does it compile | Grammar | Notation | Presentation |

> **All three ✅ = mastered, and only then may you advance.** Any ⚠️ means keep practising.

**Why three independent ones?** Concept alone → can talk but can't do. Logic alone → right answer, can't explain.
Form alone → pretty but wrong. Collapse them into one "overall score" and you can no longer tell
"understood but slipped" from "didn't understand at all" — and those need completely different responses.

#### Which dimension does an error belong to? — the verdict mnemonic

The hard part in practice isn't "what are the three dimensions" — it's that **given a concrete error, you can't tell which dimension it belongs to.**
In the 8 subject simulations, **6 subjects shared this exact core symptom** — and being unable to decide means **verdicts aren't reproducible**
(two tutors mark the same paper differently), while the whole "all ✅ before advancing" mechanism rests on verdicts being deterministic.

So the protocol §3 provides this mnemonic, asked in order:

| Order | Question | Dimension |
|---|---|---|
| 1 | Is what the student **said itself wrong** (concept, term, fact)? | **① Concept** |
| 2 | Concepts fine, but **the reasoning chain is broken / doesn't hold**? | **② Logic** |
| 3 | Everything above fine, it just **doesn't match the subject's formal rules**? | **③ Form** |

**Mnemonic: said it wrong → ①; thought it wrong → ②; wrote it wrong → ③.**
Hits two at once → **take the earlier one** (① > ② > ③); **Feynman questions score ① only**, the other two marked `— n/a`.
Per-subject boundary case tables live alongside each pack in `学科包/` (only the contentious ones — the full criteria aren't duplicated).

### 2. Small mistakes get fixed for you; big ones you derive yourself

Typos, single-point syntax, missing symbols — **small problems**, and the AI **fixes them directly**
so you don't burn a round-trip. **Big problems** (wrong concept, broken logic) stay Socratic — you derive
the fix, because that *is* the learning.

Here's what it actually looks like (real format):

```
You: done.

AI:  I re-read your answers (2 questions this round). Assessment:

| # | Concept | Logic   | Form    | Verdict   |
|---|---------|---------|---------|-----------|
| 1 | ✅      | — N/A   | — N/A   | pass      |
| 2 | ✅      | ⚠️      | ✅      | needs work|

## 1️⃣ Problem 2: wrong loop range

**What you wrote**
for i in range(5):
    print(i)

**What's wrong**
- range(5) yields 0,1,2,3,4 — starts at 0, stops before 5
- The task wants 1 to 5, so you lose the 5 and gain a 0
- This is Python's "inclusive start, exclusive end" convention — the classic beginner trap

**What I changed it to**
for i in range(1, 6):
    print(i)

Problem 1 was fine — you got it right. Tell me when you've fixed it, and we'll move to round 2.
```

> Note two details:
> ① "**Problem 1 was fine — you got it right**" — the protocol requires saying so explicitly,
> otherwise the student assumes silence means something is wrong.
> ② "**we'll move to round 2**" — a round is only 1–3 questions, and the next round comes only when this one is all ✅.

### 3. State lives in exactly three places

| Location | Answers |
|---|---|
| 🚦 Handoff Status | What lesson are we on now |
| 📊 Mastery Table | What counts as truly mastered |
| ⏳ To-do Table | What's pending |

So you can **close it and come back any time** and pick up where you left off.

**Why exactly three places?** Because writing the same progress fact in five places means
**the next reader can't tell which one is authoritative**. That isn't a theoretical worry —
a weak model **really did** write two "final re-assessment" sections in one answer document
(one filled in, one still a blank placeholder), and the validator of the day couldn't catch it
(it only looked at the first section, and passed it because that one was filled).
Invariant I11 exists specifically to catch "the same information written in more than one place".

> **How do you check the state hasn't gone crooked?** Run `node _tools/validate-state.mjs` — it checks your
> profile against the **12 invariants** in [`协议/04_状态机.md`](./协议/04_状态机.md).
> Every one of those invariants was **dug out of a real failure**: I11 from the weak-model slip above;
> I2/I6/I7/I8/I10/I12 from a self-audit that found six places where a document could "pass by formatting alone".
> The 19 regression cases live in [`tests/`](./tests/).

### 4. The Feynman technique: can't explain it = don't really know it

**The most dangerous thing isn't "not knowing" — it's "thinking you know".**

Ordinary questions can be beaten by pattern-matching, memorising templates, or sheer familiarity — **getting it right doesn't mean you understood it**.
So the tutor will **occasionally** ask you to explain a concept **in words a layperson would understand**:

```
AI: You may not use these words: <closure>, <scope>, <reference>

    Explain, in a way your mum could follow: why does this function "remember"
    the variable outside it? 3–5 sentences is enough.

You: (explains…)

AI: Your "backpack you carry around" analogy is good — the backpack holds
    the variables it remembers. But you stumbled on "the backpack updates itself",
    and that's exactly the crux. Just re-explain that part; no need to redo the whole thing.
```

**Why it beats an ordinary question**:

| Ordinary question | Feynman question |
|---|---|
| Can be beaten by formulas, templates, familiarity | You must build the sentences yourself — no shortcuts |
| Correct ≠ understood | **Can't explain it = definitely didn't understand it** (almost never a false positive) |
| Tests "can you do it" | Tests "**do you actually get it**" |

**The frequency is adaptive — it won't pester you**:

| More likely to be asked | Can be skipped |
|---|---|
| Abstract concepts, principles, easily-confused ideas | Pure operations, memorisation material |
| You're new to the field / explained poorly before | You already apply it fluently / explained well before |
| **End of a major module** (e.g. "OOP is done") | Mid-module, progressing smoothly |

**Hard limits** (written into the protocol to prevent overuse):

- ✅ End of a major module → **one is mandatory**; any single concept is asked **at most twice**
- ❌ **Not every lesson**; never two Feynman questions in consecutive rounds
- ✅ If you say "I'd rather not explain — just test me" → the tutor **respects that** and switches to ordinary questions
- ✅ A Feynman question **only scores conceptual understanding**, and that round **contains only that one question** (it takes much longer than an ordinary one)

> Each subject pack has its own section on this — the constraints differ:
> programming **bans writing code**, science **bans writing formulas**, humanities **must give concrete examples**, exam prep **uses it sparingly**.

---

## A complete conversation walkthrough

> ⚠️ **Note**: the walkthrough below is a **scenario reconstruction** — derived step by step from this
> project's protocol, realistic and faithful to how it behaves, but **not** a verbatim transcript
> (this project collects no user conversations). It shows what the dialogue looks like once the protocol is running.
>
> Scenario: a Python beginner whose goal is "write scripts to process Excel", from first opening the folder
> to passing lesson 3, with a one-week gap in between.

### Day 1 · First open

**You**:
```
I'm the student. Please read AGENTS.md first, then begin.
```

**AI**:
```
I've read AGENTS.md and the protocol. Your learning profile is still empty, so let's start with requirements.

Three questions (answer them in one go):
1. Why Python? → I want to automate Excel; it's for work
2. Have you done this before? → Never touched it
3. What do you want to be able to do? → Write scripts that batch-edit Excel

Then I'll run a placement test (5–8 questions, but sent in a few rounds — not dumped on you at once).
```

**You**:
```
1 for work 2 never 3 batch edit excel
```

**AI**:
```
Noted. Placement, round 1 — 2 questions:

**Question 1**: What's the difference between `print("hi")` and `x = 1`?

**Question 2**: Write one line that adds `3` and `5` and prints the result.

(Hint: if you don't remember the syntax for Q2, just write the part you know.)
```

> 💡 **Note**: the placement test follows the same "1–3 questions per round" rule — no 8-question dump.

### Placement result (middle steps omitted)

**AI**:
```
✅ Result: your level is L1, absolute beginner.

   - Already have: Excel familiarity, you know what a cell is
   - Need to build: variables, loops, file I/O
   - Start at: lesson 1, "Variables and Data Types"
   - Estimated 8 lessons to reach "write a script that batch-edits Excel"

Written to 我的学习/学科/Python/00-摸底测试.md, and the first 5 lessons are planned.
Ready to start lesson 1?
```

### Lesson 3 · one typical round

**AI** (ships the lesson):
```
**Next: #3 for loops and range()** (you'll need this to process every row of Excel)

### 📁 Where the files are
- Teaching guide: 我的学习/学科/Python/03-for循环/01_教学引导.md
- Answer document: 我的学习/学科/Python/03-for循环/01_学生回答.md

### 📖 This lesson's key points
1. What a for loop iterates over
2. range()'s inclusive-start, exclusive-end rule
3. Using the loop variable
4. When *not* to use for
5. The infinite-loop trap

### ✅ Your task
Read the guide, answer **round 1's 2 questions** in the answer document, then say "done".
```

**You** (answering in `01_学生回答.md`):
```python
# Round 1 · Q1: Which numbers does range(3) print? Why?
# A: 0 1 2, because range starts at 0

# Round 1 · Q2: Write code that prints 1 to 5
for i in range(5):
    print(i)
```

**You**:
```
done
```

**AI**:
```
I re-read your answer document (2 questions this round):

| # | Concept | Logic   | Form    | Verdict   |
|---|---------|---------|---------|-----------|
| 1 | ✅      | — N/A   | — N/A   | pass      |
| 2 | ✅      | ❌      | ✅      | needs work|

---

## 1️⃣ Problem 2: wrong loop range

**What you wrote**
for i in range(5):
    print(i)

**What's wrong**
- range(5) yields 0,1,2,3,4 — starts at 0, stops before 5
- The task wants 1 to 5; your output is 0 to 4 — **missing the 5, extra the 0**
- This is Python's "inclusive start, exclusive end" convention — the classic beginner trap

**What I changed it to**
for i in range(1, 6):
    print(i)

---

Question 1 was right — "range starts at 0" is the key insight.

Fix Q2 and tell me, and we'll go to round 2.
```

> 💡 Three protocol rules on display:
> **① assess every question of the round in one pass** (no drip-feeding)｜**② small problems are fixed for you** (no wasted round-trip)｜**③ the three-part explanation** (what you wrote → why it's wrong → what I changed it to)

### Big problems get guidance, not a fix

Round 2 asks you to "print the even numbers from 1 to 10". You write:

```python
for i in range(1, 11):
    print(i)
```

**AI**:
```
## 1️⃣ Problem 3: the even-number check is missing

This one is different from the last — that was a **syntax** problem (I fixed it directly).
This is a **logic** problem, and you need to work it out yourself.

Your code prints every number from 1 to 10, but the task only wants the **even** ones.

Don't write code yet. Answer me this:

> **If you had to say out loud what makes a number "even", what would you say?**

(If you're stuck, here's a hint: what operator in Python gives you a remainder?)
```

**You**:
```
remainder when divided by 2 is 0
```

**AI**:
```
Exactly. Now what does that look like as code?

(Hint: `%` for remainder, `==` for equality, `if` to choose — you need all three)
```

**You**:
```python
for i in range(1, 11):
    if i % 2 == 0:
        print(i)
```

**AI**:
```
✅ Correct. And you derived it yourself — that sticks far better than being told.

Both questions of this round now pass.
```

> 💡 **This is the line between "fix it" and "guide it"**:
> syntax wrong → fixed for you (saves you a round); logic wrong → you must think it through (that *is* the learning).

### Filing + next lesson

**AI**:
```
#3 for loops and range() closed ✅
**Re-assessment**: concept, logic, form all passed.
This round found 2 issues: 1 fixed directly, 1 you derived yourself.

Updated:
- 01_学生回答.md → Final re-assessment + Correct answers & analysis
- 00-学习档案.md → 📊 Mastery table gained "for loops and range()" + 🚦 Handoff Status

---

**Next: #4 while loops and break** (some cases can't be written with for — like "keep reading until the file ends")

### 📖 This lesson's key points
1. The essential difference between while and for
2. When you *must* use while
3. How break / continue work
4. Avoiding infinite loops
5. Nested loops

### ✅ Your task
Answer round 1's 2 questions, then say "done".

> ⏳ Review reminder (non-blocking): you've mastered 3 topics — before the next lesson I'll ask 1 synthesis question.
```

### Day 7 · one Feynman question (the loops module is done)

> The "loops" module just finished (for / while / break / nesting). Per the protocol,
> **the end of a major module always triggers one Feynman question** — and that round
> **contains only that one question**.

**AI**:
```
The loops module is done. This round has just 1 question, and it isn't an ordinary one — it's a **Feynman question**.

You may not use these words: <loop>, <iterate>, <traverse>, <range>

**Explain, in a way your mum could follow: why does a computer need a "do something repeatedly" feature?**

3–5 sentences is enough. Analogies and everyday examples are welcome.

> This isn't an exam. Struggling is normal — struggling is exactly the signal that there's a gap here, which is what we want to find.
```

**You**:
```
It's like laundry. You don't wash each piece by hand — you throw the whole pile
into the machine, set a program, and it spins on its own. A computer's the same:
you don't write the same code a hundred times, you just tell it "for this whole
pile of things, do the same action to each one".
```

**AI**:
```
✅ Explained clearly. And better than I expected.

**What's good about it**: your "washing machine" analogy is very accurate — it captures two things at once:
① you don't repeat the labour (that's writing the code once instead of a hundred times)
② you have to "set the program" first (that's what goes inside the loop body)

**One thing that could be more precise**: you said "it spins on its own" — but a computer is far more rigid than a washing machine. It will **never come up with the number of spins by itself**; you must state that number in advance. That's exactly what the next lesson (while) fixes.

Filed to the profile: `for loops and range()` note = ✅ and can explain it Feynman-style
```

> 💡 Note the three things this feedback does:
> **① names specifically what was good** (the analogy captured two things at once) — not a lazy "good job"
> **② points out one thing that could be more precise**, and **leans into the next lesson** (while exists precisely because the count isn't always fixed)
> **③ files the Feynman evidence into the profile** — stronger proof of mastery than merely getting questions right

### Day 10 · back after a week away

**You** (new session, different AI tool):
```
continue
```

**AI**:
```
I read the 🚦 Handoff Status in 我的学习/00-学习档案.md:

- You're studying **Python** (goal: write scripts that batch-process Excel)
- Current lesson: **#4 while loops and break**
- Progress: lesson published, answer document empty, waiting on you
- Pending: ⏳ Spaced review #1 (the 3-topic trigger has been hit)
- First step on taking over: do the spaced review, then lesson #4

Shall we do that review question now? (1 question covering variables / data types / for loops)
```

> 💡 **This is why state is written to disk**: different tool, a week later, and the AI still knows exactly where you are.
> Because the state lives in **files**, not in the chat.

---

### What this walkthrough demonstrates

| Mechanism | Where it appears |
|---|---|
| Requirements → placement → starting level | Day 1 |
| **Only 1–3 questions per round** | Placement and every lesson |
| Three-dimension assessment (all questions of the round, one pass) | Lesson 3 |
| **Small problems fixed directly + three-part explanation** | Problem 2 (syntax) |
| **Big problems guided, you derive it** | Problem 3 (logic) |
| **Feynman question (end of a major module, only 1 question)** | Day 7 |
| Explicitly saying "the questions I didn't change were fine" | "Question 1 was right" |
| Two documents per lesson (teaching + answer) | Every lesson |
| Filing (answer doc + three places in the profile) | After each lesson passes |
| **Switch tools / come back a week later and resume** | Day 10 |

> Want to verify these mechanisms are actually written into the protocol? See
> [`协议/00_导师协议.en.md`](./协议/00_导师协议.en.md) (three-dimension assessment, direct-fix protocol, 1–3 questions per round, Feynman technique)
> and [`AGENTS.md`](./AGENTS.md) (12 hard rules). **The dialogue is the protocol's output, not decoration.**

---

## Five-minute setup

### The learner installs nothing

| | |
|---|---|
| ❌ No Node.js / npm | The protocol is plain Markdown — no build step |
| ❌ No Git | Downloading a ZIP works just as well |
| ❌ No API key | The recommended tools ship with a free tier |
| ❌ No sign-up for this project | No server, no account, no subscription |
| ✅ All you need | One AI tool that can open a folder |

### Five steps

- [ ] **1. Install an AI tool** — recommended: [Trae](https://www.trae.cn): free, Chinese UI, graphical, no API key

  Open the site → download for Windows → install → log in with phone / WeChat

  Alternatives: **ZCode** (Z.ai — reads `AGENTS.md` natively, zero config), **CodeBuddy** (Tencent), **Qoder** (Alibaba), **Cursor**

- [ ] **2. Open the folder** — `File → Open Folder` → select `StepsToGreat`

  > ⚠️ Open the **folder itself**, not a file inside it. Get this wrong and the AI can't read the rules — everything downstream fails.

- [ ] **3. Trae users: flip one switch** — `Settings (gear) → Rules → Import settings → turn on "Include AGENTS.md in context"`

  > **90% of people miss this.** Most other tools need no configuration.

- [ ] **4. Say the first sentence**

  ```
  I'm the student. Please read AGENTS.md first, then begin.
  ```

- [ ] **5. Verify it worked** — ask it:

  ```
  Recite the "Hard rules" section of AGENTS.md — how many are there?
  ```

  The correct answer is **9**. Can't answer → go back to steps 2 and 3.

📖 Full tutorial: [`教程/01-five-minute-setup.en.md`](./教程/01-five-minute-setup.en.md)
🖼 UI mockups (plain text, no screenshots): [`教程/ui-mockups.en.md`](./教程/ui-mockups.en.md)
🔍 Stuck? [§9 troubleshooting decision tree](./教程/ui-mockups.en.md#9-when-something-breaks-start-with-this-diagram)

---

## What you can learn

| Type | Examples |
|---|---|
| Programming | Python, Java, frontend, algorithms, SQL |
| Languages | English, Japanese, IELTS/TOEFL |
| Humanities | History, politics, philosophy, law |
| Sciences | Math, physics, chemistry, biology |
| Exam prep | Grad school entrance, civil service, certifications |
| **Anything else** | The AI generates a subject pack on the spot (music, fitness, writing…) |

Five subject packs are built in ([programming](./学科包/编程.en.md) / [language](./学科包/语言.en.md) / [humanities](./学科包/文科.en.md) / [science](./学科包/理科.en.md) / [exam prep](./学科包/考试.en.md)).

**No match?** The AI generates one from [`_自定义学科包模板.md`](./学科包/_自定义学科包模板.md) —
the crux is two questions: **in this subject, what is a "structural error" (must lose points), and what is a "slip" (no penalty)?**

Answer those two and *any* skill becomes assessable — guitar, fitness, drawing, writing, software operation.

---

## Learning rules (make them yours)

The framework ships with default teaching rules, but **the rules are not hard-coded** — you can change all of them.

**How?** Three ways, pick any:

| Way | What to do |
|---|---|
| **Edit directly** | Edit [`我的学习/我的规则.md`](./我的学习/我的规则.md) |
| **Just say it** | Tell the tutor "only 1 question per round from now on" → it writes it in for you |
| **Change nothing** | Keep every default — that works too |

### What you can change

| Setting | Default | Example |
|---|---|---|
| **Questions per round** | 1–3 | "only 1 per round, I'm slow" |
| **Questions per lesson** | ~5 | "3 is enough for one lesson" |
| **Correction style** | Explain the principle first | "just give me the right answer" |
| **Direct-fix scope** | Slips/syntax fixed for you; concepts guided | "fix everything for me" |
| **Teaching language** | Follows the student | "always Chinese" |
| **Tone / emoji** | Patient, restrained | "no emoji" |
| **Personal preferences** | none | "I hate walls of text, keep it under 200 words" |
| **Goal & time constraints** | none | "max 30 minutes a day" |

### Why the rules are editable but the framework files are not

| File | Editable? | Why |
|---|---|---|
| [`我的学习/我的规则.md`](./我的学习/我的规则.md) | ✅ **Anything** | It's your rules, highest priority, `git pull` never touches it |
| `协议/` `学科包/` `模板/` `_tools/` | ❌ Read-only | The framework itself. Editing it collides with updates and **lets the rules drift** |

**The design principle**: the right place to change rules is an **overlay**, not the source.
Your rules live in their own file with higher priority than the defaults — so you get complete freedom
*and* you can still `git pull` framework updates at any time.

### Rule priority

On conflict, the higher one wins:

```
1. 我的学习/我的规则.md        ← your rules, highest
2. what you say in the moment
3. 我的学习/00-学习档案.md 🚦   ← current progress (state)
4. 协议/00_导师协议.md          ← framework defaults
5. 学科包/<subject>.md          ← subject assessment criteria
```

> **One suggestion**: keep the `all three dimensions ✅ to advance` rule.
> It's the core mechanism — change it to "close enough" and the project degrades into an ordinary chat assistant.
> That's your call, of course; just know the cost.

---

## Supported AI tools

**25+ tools** (currently 25 pointer files + 1 source of truth, covering 28+ tools), via "one contract + auto-generated pointers":

```
your tool → the file it reads (CLAUDE.md / CODEBUDDY.md / .trae/rules / GEMINI.md …)
        → all point to → AGENTS.md (single source of truth)
```

Change a rule in exactly one place (`AGENTS.md`); the other 25 pointer files are script-generated — **they can never drift**.

| Works out of the box | Needs one switch | Pointer provided |
|---|---|---|
| Codex · Cursor · Qoder · ZCode · **DSH** · Cline · Roo · Kilo · Zed · goose · Warp · Windsurf · Kiro · Augment · Junie · Amazon Q | **Trae** (in settings) | Claude Code · CodeBuddy · WorkBuddy · Gemini CLI · Continue · Antigravity · Qwen Code · Aider |

📋 Full matrix (with each tool's exact behaviour): [`docs/AGENT-COMPAT.md`](./docs/AGENT-COMPAT.md)

---

## Want "install once, use everywhere"? There's a skill version

This repo is the **folder** form: open the folder in an AI tool and it becomes your tutor. That's the lowest-friction path — nothing to install.

But the folder form has three hard limits, **all caused by the form, not the protocol**:

| Folder-form limit | What it looks like |
|---|---|
| Rules **travel with the repo** | A new project means dropping the folder in again |
| Triggering depends on **whether the tool reads `AGENTS.md`** | 25 pointer files covering 28+ tools, still maintained one by one |
| Content **drifts when hand-copied** | Change a rule, forget a copy |

**The same protocol also ships as a skill**: [**Steps2Great-skill**](https://github.com/wildcat430524/Steps2Great-skill) —
install it once into your skills directory and every project and session can trigger it.

| | **StepsToGreat** (this repo) | [Steps2Great-skill](https://github.com/wildcat430524/Steps2Great-skill) |
|---|---|---|
| Form | A folder (open it and it's your tutor) | An Agent Skill (install into any skills-capable client) |
| Install | **Nothing to install** | One line: `npx skills add wildcat430524/Steps2Great-skill` |
| Trigger | `AGENTS.md` + 25 per-tool pointers | Frontmatter `description` (bilingual trigger words) |
| Content | The repo itself | **Mirrors** this repo + a hand-written `SKILL.md` |
| Best for | "One folder carries everything"; reading all the design docs | "Install once, use everywhere"; distributing / sharing with a team |
| Data | Your folder | Your workspace — **both plain Markdown, mutually resumable** |

**They are two shells around one protocol**: change a teaching rule here, and the skill syncs it via
`node _build/sync-from-upstream.mjs` — nothing hand-copied, so nothing drifts.

> **Which to pick**: everyday self-study, least fuss → use **this repo** (open the folder and go).
> Already living in Claude Code / Cursor / Codex and want "install once, works everywhere" →
> use the **[skill version](https://github.com/wildcat430524/Steps2Great-skill)**.
> You can use both; your records are plain Markdown, so you can switch shells and keep learning.

---

## Layout

```
StepsToGreat/
├── AGENTS.md                    ← the single contract (AI starts here; all 25 pointers target it)
├── AGENTS.en.md                 ← English version
├── CONTEXT.md                   ← glossary (keeps terms from blurring)
├── 协议/                         ← teaching rules: 3-dimension assessment + verdict mnemonic / direct-fix / placement / filing / **state machine**
├── 学科包/                       ← per-subject assessment criteria + boundary case tables
├── 模板/                         ← blank templates
├── 示例/                         ← 5-minute demo of the whole loop
├── 教程/                         ← setup / per-tool guides / UI mockups / design notes
├── _tools/                       ← pointer generator + content checks + mermaid check + **state validation (12 invariants)**
├── tests/                        ← regression fixtures for state validation (19 deliberately broken profiles + expected verdicts)
│   └── fixtures/                 ← each = one broken profile + expected.json
├── docs/                         ← compatibility matrix + E2E report + weak-model report + 9 ADRs
│   ├── simulations/              ← 8 subject simulations (where the protocol improvements came from)
│   └── weak-model/               ← the weak-model-as-probe report and raw self-reports
├── 我的学习/                     ← [YOUR DATA] everything is recorded here
│   ├── 00-学习档案.md            ← overall progress state (only 🚦 / 📊 / ⏳ are maintained)
│   └── 我的规则.md               ← [YOUR RULES] highest priority, edit freely
└── 资料/                         ← [YOUR MATERIAL] the AI reads this
```

**Framework and data are separated**: `我的学习/` and `资料/` are git-ignored
(the starting profile and your rules file are kept) —
updating the framework (`git pull`) will **never** overwrite your records or your edited rules.

---

## FAQ

**Will switching AI tools lose my records?**
No. Everything is plain Markdown under `我的学习/`. Switch tools → open the same folder → say "continue".

**Does it cost money?**
The protocol is free. Most AI tools have free tiers (Trae CN: 500 credits/month). The protocol is plain Markdown — no server, no account, no subscription.

**Do I need to be technical?**
No. Opening a folder and typing is enough. **The learner installs no Node / npm / Git.**

**Can I throw a whole book at it and study that?**
Yes — that's the most common way to use it. Put the book in `资料/`, say "I want to properly learn this",
and the tutor first probes your goal and available time, then splits the book by its **actual chapters** into
one lesson at a time. Each lesson ends in questions; you answer and say "done"; all three dimensions must be ✅
before the next lesson ships. Progress is written to disk, so if you don't finish, just say "continue" next time.
See [Want to learn a book (or any material) properly?](#want-to-learn-a-book-or-any-material-properly-send-it-to-the-ai-it-teaches-you-step-by-step).

**Will the AI make up what's in the book?**
No — teaching from memory is forbidden (`AGENTS.md` hard rule 8): content must come either from the files you put
in `资料/` or from a specific, verifiable primary source, and citations must go down to "which file, which section".
**It will never hand you a reading list you can't check.**

**Will my material be uploaded?**
Some tools do (Trae temporarily uploads for indexing; CodeBuddy's personal edition goes through Tencent Cloud).
**For sensitive material, use a tool that supports local models** (Zed / goose + Ollama).

**What if the AI grades me wrong?**
Say so, with your reasoning. The protocol **explicitly lets you challenge it** — if you disagree with the placement result, you win.

**Can I study several subjects at once?**
Yes. One directory per subject under `我的学习/学科/<subject>/`, with `00-学习档案.md` covering the whole.

**Can I use it offline?**
The protocol itself is fully offline. The *tutor* is an AI, so it needs a model — run a local one (Ollama) and nothing ever leaves your machine.

**How do I contribute a subject pack?**
Copy [`学科包/_自定义学科包模板.md`](./学科包/_自定义学科包模板.md), fill in 7 parts. **Most needed: music, fitness, drawing, writing, software operation.**

**Why three dimensions? Can't I just collapse them into one score?**
No — that throws away the project's most important signal. Keeping them separate is what lets you tell
"**understood but slipped**" from "**didn't understand at all**". The first is fixed for you on the spot;
the second needs Socratic guidance. Collapsed into one score, both look like "60 marks" — yet they call for opposite responses.

**What if I can't tell which dimension an error belongs to?**
Use the mnemonic in [`协议/00_导师协议.md`](./协议/00_导师协议.md) §3:
**said it wrong → ①; thought it wrong → ②; wrote it wrong → ③**, and if it hits two, take the earlier one.
That mnemonic is a direct product of the 8 subject simulations — 6 subjects' core symptom was exactly "can't decide".

**The rules are editable — so could I change "all ✅ to advance" into "close enough"?**
Technically yes (write it in `我的学习/我的规则.md`; it has the highest priority).
But **doing so demotes the project to an ordinary chat assistant** — that rule is the core mechanism, not an optional extra.
It's your call; the cost is stated up front.

**How do I know the protocol was actually followed?**
Run the state validator, which checks your profile against the 12 invariants in [`协议/04_状态机.md`](./协议/04_状态机.md):

```bash
node _tools/validate-state.mjs --root .            # validate your workspace
npm run verify                                     # run every framework check (5 checkers)
```

It catches "marked mastered with no re-assessment evidence", "advanced before the previous lesson passed",
"two re-assessment sections in one file". CI runs it on every push.

**How do I know these rules actually work rather than being armchair theory?**
Four kinds of measured evidence, all in the repo: 8 subject simulations, weak models as probes,
an end-to-end run, and a state validator with 19 regression cases.
See [how these rules came to be](#how-these-rules-came-to-be-measured-not-guessed).

**My tool can't open a folder (e.g. a web chat) — what now?**
Try the [skill version](https://github.com/wildcat430524/Steps2Great-skill) — it targets clients that support Agent Skills.
If that client doesn't support skills either, you can only paste `AGENTS.md` into the conversation by hand
(which loses the two biggest advantages: on-demand reading and state filed to disk).

---

## Going deeper

| To learn about | Read |
|---|---|
| How to use it | [`教程/01-five-minute-setup.en.md`](./教程/01-five-minute-setup.en.md) |
| Per-tool setup | [`教程/02-agent-setup-guide.en.md`](./教程/02-agent-setup-guide.en.md) |
| What the UI looks like | [`教程/ui-mockups.en.md`](./教程/ui-mockups.en.md) |
| **Why it's designed this way** | [`教程/03-design-notes.en.md`](./教程/03-design-notes.en.md) |
| The trade-offs behind each decision | [`docs/adr/`](./docs/adr/) (9 ADRs) |
| **Where the rules' evidence comes from** | [`docs/simulations/`](./docs/simulations/) (8 simulations)｜[`docs/weak-model/`](./docs/weak-model/) (weak-model probe)｜[`docs/E2E-RUN-REPORT.md`](./docs/E2E-RUN-REPORT.md) |
| Tool compatibility matrix | [`docs/AGENT-COMPAT.md`](./docs/AGENT-COMPAT.md) |
| **Upgrading the framework / migrating a profile** | [`docs/UPGRADE.md`](./docs/UPGRADE.md) |
| How to place and cite material | [`资料/README.md`](./资料/README.md) |
| Validation criteria (the 12 invariants) | [`协议/04_状态机.md`](./协议/04_状态机.md) |
| How the regression cases are written | [`tests/README.md`](./tests/README.md) |
| Glossary | [`CONTEXT.md`](./CONTEXT.md) |
| Change the rules | [`我的学习/我的规则.md`](./我的学习/我的规则.md) |
| **Install once, use everywhere** | [Steps2Great-skill](https://github.com/wildcat430524/Steps2Great-skill) (the skill shell of this same protocol) |

---

## License

| Part | License |
|---|---|
| **Code** (`_tools/`) | [MIT](./LICENSE) |
| **Docs** (protocol, subject packs, tutorials, templates) | [CC BY 4.0](./LICENSE-DOCS) |

Please keep attribution when republishing teaching material.

---

**Start now** → open your AI tool and say:

```
I'm the student. Please read AGENTS.md first, then begin.
```
