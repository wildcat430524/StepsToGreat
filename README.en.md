# StepsToGreat

> **Open this folder and you get a one-on-one tutor.**
> A Markdown protocol — any AI tool that opens it becomes your personal teacher: placement test, lessons, homework grading, progress tracking.

[简体中文](./README.md) | English

---

## What this is

**Not software. Not a course. A folder.**

Inside is nothing but Markdown: a teaching protocol plus your learning profile.
Open it with an AI tool and the AI becomes your tutor, following the protocol.

```
You:  I'm the student. Read AGENTS.md first, then start.
AI:   (reads the protocol) → asks 3 questions → placement test → sets your level → lesson 1
You:  Done.
AI:   (re-reads your answers) → assesses 3 dimensions → fixes your mistakes and explains why → files the result → next lesson
```

---

## What you can learn

| Type | Examples |
|---|---|
| Programming | Python, Java, frontend, algorithms, SQL |
| Languages | English, Japanese, IELTS/TOEFL |
| Humanities | History, politics, philosophy, law |
| Sciences | Math, physics, chemistry, biology |
| Exam prep | Grad school entrance, civil service, certifications |
| Anything else | The AI generates a subject pack on the spot (music, fitness, writing…) |

Five subject packs are built in (programming / language / humanities / science / exam prep).

---

## Five-minute setup

### 1. Install an AI tool

Recommended: **Trae** (free, Chinese UI, GUI, no API key needed) —
`https://www.trae.cn` → download for Windows → install → log in.

Alternatives: **ZCode** (Z.ai — reads AGENTS.md natively, zero config), **CodeBuddy** (Tencent), **Qoder** (Alibaba), **Cursor**.

Full comparison → [`教程/02-agent-setup-guide.en.md`](./教程/02-agent-setup-guide.en.md)

### 2. Open the folder

```
File → Open Folder → select StepsToGreat
```

> ⚠️ Open the **folder itself**, not a file inside it.

### 3. Say the first sentence

```
I'm the student. Read AGENTS.md first, then start.
```

### 4. Trae users: flip one switch (important)

```
Settings (gear) → Rules → Import Settings → enable "Include AGENTS.md in context"
```

> 90% of people miss this. Most other tools need no configuration.

### 5. Verify it worked

```
Recite the "Hard rules" section of AGENTS.md — how many rules are there?
```

The correct answer is **9**.

---

## Core mechanics

### Three dimensions · all ✅ to advance

Each topic is assessed on three **independent** dimensions:

| Dimension | Programming | English | Math | Humanities |
|---|---|---|---|---|
| ① Concept | Understanding | Comprehension | Concepts | Understanding |
| ② Logic | Algorithm/edge cases | Expressiveness | Derivation | Argumentation |
| ③ Form | Compiles | Grammar | Notation | Presentation |

**All three ✅ = mastered, and only then may you advance.** Any ⚠️ means keep practising.

### The tutor fixes small mistakes directly

Typos, single-point syntax, missing symbols — the AI **fixes them for you**, so you don't burn a round-trip. But it must explain in three parts:

```
① what you wrote → ② what's wrong and why (the principle) → ③ what I changed it to
```

Big problems (wrong concept, broken logic) stay Socratic — you derive the fix yourself.

### State lives in exactly three places

| Location | Answers |
|---|---|
| 🚦 Handoff Status | What lesson are we on now |
| 📊 Mastery Table | What counts as truly mastered |
| ⏳ To-do Table | What's pending |

So you can close it and come back any time and pick up where you left off.

---

## Supported AI tools

**25+ tools**, via "one contract + auto-generated pointers":

```
your tool → the file it reads (CLAUDE.md / CODEBUDDY.md / .trae/rules …)
        → all point to → AGENTS.md (single source of truth)
```

| Works out of the box | Needs one switch | Pointer provided |
|---|---|---|
| Codex / Cursor / Qoder / ZCode / Cline / Zed / goose / Warp / Windsurf / Kiro / Augment | **Trae** (in settings) | Claude Code / CodeBuddy / Gemini CLI / Continue / Antigravity / Qwen / Aider |

Full matrix → [`docs/AGENT-COMPAT.md`](./docs/AGENT-COMPAT.md)

---

## Layout

```
StepsToGreat/
├── AGENTS.md                    ← single contract (AI starts here)
├── AGENTS.en.md                 ← English version
├── 协议/                         ← teaching rules
├── 学科包/                       ← per-subject assessment criteria
├── 模板/                         ← blank templates
├── 示例/                         ← 5-minute demo
├── 教程/                         ← tutorials
├── _tools/                       ← quality check + pointer generator
├── docs/                         ← compatibility matrix + ADRs
├── 我的学习/                     ← [YOUR DATA] all records live here
└── 资料/                         ← [YOUR MATERIAL] the AI reads this
```

**Framework and data are separated**: `我的学习/` and `资料/` are git-ignored,
so updating the framework never overwrites your learning records.

---

## FAQ

**Will switching AI tools lose my records?**
No. Everything is plain Markdown under `我的学习/`.

**Does it cost money?**
The protocol is free. Most AI tools have free tiers (Trae CN: 500 credits/month).

**Do I need to be technical?**
No. Opening a folder and typing is enough.

**Will my material be uploaded?**
Some tools do (Trae temporarily uploads for indexing; CodeBuddy goes through Tencent Cloud).
For sensitive material, use a local-model tool (Zed / goose + Ollama).

**What if the AI grades me wrong?**
Say so, with your reasoning. The protocol lets you challenge it.

More → [`教程/01-five-minute-setup.en.md`](./教程/01-five-minute-setup.en.md)

---

## Contributing

- **Add a subject pack** (most valuable): copy `学科包/_自定义学科包模板.md`, fill in 6 parts, open a PR
- **Add an AI tool**: edit `TARGETS` in `_tools/setup-agents.mjs`, run it once, open a PR
- **Change the protocol**: open an issue first describing the problem you hit

```bash
node _tools/setup-agents.mjs   # regenerate all pointer files
node _tools/check.mjs          # content quality check
```

Design rationale → [`教程/03-design-notes.en.md`](./教程/03-design-notes.en.md)

---

## License

- **Code** (`_tools/`) → [MIT](./LICENSE)
- **Docs** (protocol, subject packs, tutorials, templates) → [CC BY 4.0](./LICENSE-DOCS)

Please keep attribution when republishing teaching material.

---

## Origin

The teaching protocol was distilled from a real 22-lesson Java self-study project (started 2026-03),
validated through Socratic guidance + mastery learning + three-dimension assessment, then generalised.

---

**Start now** → open your AI tool and say:

```
I'm the student. Read AGENTS.md first, then start.
```
