# StepsToGreat

[![Content check](https://github.com/wildcat430524/StepsToGreat/actions/workflows/check.yml/badge.svg)](https://github.com/wildcat430524/StepsToGreat/actions/workflows/check.yml)
[![License: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](./LICENSE)
[![Docs: CC BY 4.0](https://img.shields.io/badge/docs-CC%20BY%204.0-lightgrey.svg)](./LICENSE-DOCS)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

**Open this folder and you get a one-on-one tutor.**

A Markdown teaching protocol for an AI tool that can read and write local files and follow the rules:
it establishes your needs, opens each new block with a concrete situation and one easy question,
then explains, practises, grades, and saves progress so you can resume later.

**This update: easier starts and visible achievement.** Goals become small, achievable steps. The module mastery bar is
separate from the current skill list; tick only from evidence, give specific feedback promptly, and clearly close each small goal.

> **Two boundaries up front**: ① you need an AI tool that can **read and write local files** — its installation, accounts, and costs are decided by its provider, not this project; ② the reports and tests below check **process and tool behaviour**, and **do not prove real learner gains**.
>
> **In depth** (full rationale, measured evidence, dialogue walkthrough, every mechanic, FAQ): [`docs/readme-details.en.md`](./docs/readme-details.en.md)

[简体中文](./README.md) | English

**Jump to**

[Start](#start) · [Learning view](#learning-view-two-separate-layers) · [Core rules](#core-rules-at-a-glance) · [Install](#install) · [Your own material](#teach-from-your-own-material) · [Skill version](#two-shells-one-protocol) · [FAQ](#faq) · [Deeper](#going-deeper)

---

## Start

**No long document to read first, and no rule count to memorise.** Three steps:

| # | Do this | What happens |
|---|---|---|
| **1** | Open this folder in an AI tool with local file access | Have it read the root `AGENTS.md` |
| **2** | Say: `Please read AGENTS.md first. I want to learn <X>, my goal is <Y>, and I have <Z> minutes a day.` | Missing needs are gathered together; known facts are not re-asked |
| **3** | Answer the first small question in its situation | One sentence, judgement, or step; when stuck it shrinks, with no need to install software or write a whole exercise |

From then on you only ever do two things: **answer the current question**, and **say "done"**.

> **You can answer in chat.** Once formal learning begins, the tutor files your original words **unchanged** into the answer document, then re-reads before assessing; answering directly in the document also works.
> Stuck? [Troubleshooting decision tree](./教程/界面示意图.md#9-遇到问题先看这张图)｜Tool setup? [Five steps](#install)

---

## Learning view: two separate layers

Every block opens with a two-layer view before teaching starts. The **module mastery bar** tracks how many knowledge units
are formally mastered in the module; the **current small goal** tracks what you specifically learned in this block —
calculated separately, so the list can be fully ticked while the bar stays put.

This is a **fictional illustration** (not a real assessment record) showing the state after a small goal is complete:

**Python lists · module mastery**

`▰▰▱▱▱▱▱▱▱▱` **1/4** knowledge units mastered

**Small goal｜Append an item to an existing list**

- [x] Explain that **`append`** adds a single element to the end of a list
- [x] Tell **appending** apart from **overwriting**, knowing existing elements stay
- [x] Independently call **`append`** to add an item and verify the list changed

> **Complete** | You can now append an item to an existing list without rewriting it. You may stop here.

*Evidence: module - meet-lists final re-assessment; skills - current formal assessments. The adding unit is not yet fully mastered, so module progress remains 1/4.*

Three rules worth remembering:

- **Tick only from evidence**: introduction performance is recorded as "preliminary observation"; answering under a hint is labelled, and independent skill items stay unticked.
- **Prompt, specific feedback**: each substantive step first names what you just did independently and what it changed, before correcting or handing over the next step.
- **A natural stopping point**: completing a small goal says plainly "you can now …", without attaching the next block's mandatory questions.

Full criteria: [Small-goal progress](./协议/06_小目标进度.md) and [Conversational introduction](./协议/05_对话导入.md).

---

## Core rules at a glance

| Rule | In one line |
|---|---|
| **Three dimensions** | ① concept / ② logic / ③ form — advance only when **all applicable dimensions pass**; n/a ones are marked `— n/a` |
| **1–3 questions per round** | The next round comes only after this one passes — **never the whole lesson's questions at once** |
| **Re-read before assessing** | "Done" → the tutor **re-reads the answer document**; judging from conversation memory is forbidden |
| **Fix small, guide big** | Typos/syntax are fixed for you with the three-part explanation; conceptual or logical errors are guided so you derive them |
| **Verdict mnemonic** | said it wrong → ①; thought it wrong → ②; wrote it wrong → ③ |
| **Feynman diagnostic** | Once at the end of a big module, at most once per lesson; say you'd rather not and it switches to ordinary questions |
| **State in three places** | 🚦 handoff status / 📊 mastery table / ⏳ to-do table — never duplicated |

> Full mechanics, where the three status sections came from, and the Feynman hard limits: [core mechanics in full](./docs/readme-details.en.md#core-mechanics-in-full).

---

## Install

**The teaching protocol itself needs no runtime**: Node, npm, and the retrieval scripts are all **optional**. All you need is an AI tool that can read and write local files.

- [ ] **1. Install an AI tool** — e.g. [Trae](https://www.trae.cn) or any tool you already use that supports file access (accounts and plans follow the tool's own documentation)
- [ ] **2. Open the folder** — `File → Open Folder` → select `StepsToGreat` (**the folder itself, not a file inside it**)
- [ ] **3. Trae users: flip one switch** — `Settings → Rules → Import settings → turn on "Include AGENTS.md in context"`
- [ ] **4. Say the first sentence** — `I'm the student. Please read AGENTS.md first, then begin.`
- [ ] **5. Answer the first small question** — there is no rule-count test to pass first

> If you need to troubleshoot loading, you can ask it to recite the hard-rule count (currently **12**) — but that is only a troubleshooting clue and **does not prove the rules are live**; prefer checking file-read traces and actual output.
> 📖 [Five-minute setup](./教程/01-five-minute-setup.en.md)｜🧰 [Per-tool guides](./教程/02-agent-setup-guide.en.md)｜🖼 [UI mockups](./教程/ui-mockups.en.md)｜📋 [Compatibility matrix](./docs/AGENT-COMPAT.md)
> Upgrading the framework or migrating a profile: [`docs/UPGRADE.md`](./docs/UPGRADE.md).

---

## Teach from your own material

**This is the most common way to use it**: drop the book or material into [`资料/`](./资料/), say "I want to properly learn this",
and the AI splits it into lessons, explains, sets questions, grades, and keeps your progress.

The tutor must **locate the section first, then read it in full** (including conditions and exceptions), and cite it as
"from `<file>`, section N", optionally with line numbers and a version fingerprint.
**Unreadable content is not evidence**: scans and encrypted files need OCR or text extraction first, and when something can't
be read the tutor **stops** and says what's missing instead of guessing. With no textbook supplied, the tutor works from
**verifiable primary sources** and records them in the lesson document.

| Format | Support |
|---|---|
| `.md` `.txt` | ✅ Best |
| `.pdf` (text-based) | ✅ Good (scans need OCR) |
| `.docx` `.pptx` | ⚠️ Mediocre — save as `.md` instead |
| Images / video | ⚠️ Tool-dependent; for video, supply subtitles or notes |

> One item at a time, append-only, always sourced: [`资料/README.md`](./资料/README.md)｜Retrieval and citation method: [`docs/material-retrieval.md`](./docs/material-retrieval.md)

---

## Two shells, one protocol

| | **StepsToGreat** (this repo) | [Steps2Great-skill](https://github.com/wildcat430524/Steps2Great-skill) |
|---|---|---|
| Form | A folder — open it and it's your tutor | An Agent Skill installed into a skills-capable client |
| Install | **No project runtime needed**; an AI client is still required | One line: `npx skills add wildcat430524/Steps2Great-skill` |
| Trigger | `AGENTS.md` + auto-generated per-tool pointers | Frontmatter `description` (bilingual trigger words) |
| Data | Your folder | Your workspace — both plain Markdown, **mutually resumable** |

Both are **the same teaching protocol**: change a rule here and the skill picks it up with
`node _build/sync-from-upstream.mjs` (`SKILL.md` is a hand-written entry point, maintained separately).

> Want "install once, use everywhere"? Use the [skill version](https://github.com/wildcat430524/Steps2Great-skill).
> Everyday self-study with the least fuss? Use this repo.

---

## FAQ

**Will switching AI tools lose my records?**
No. Everything is plain Markdown under `我的学习/`. Switch tools → open the same folder → say "continue".

**Does it cost money?**
The protocol itself is free, plain Markdown. Sign-in, free quotas, and costs for AI tools are decided by their providers and can change over time.

**Must I write answers into the document?**
No. You can **answer in chat**; the tutor appends your original words **unchanged** to the answer document and then re-reads before assessing. Anything not written to disk isn't guaranteed to carry across sessions.

**Will the AI make up what's in the book?**
Teaching from memory is forbidden (hard rule 8): content comes either from files you put in `资料/` or from a specific, verifiable primary source, cited down to the section.

**Can I study several subjects at once?**
Yes, but **only one "current subject" at a time** — finish the current round before switching. See [`协议/03_落档事件表.md`](./协议/03_落档事件表.md).

**Can I change the rules?**
Yes — write them into [`我的学习/我的规则.md`](./我的学习/我的规则.md): the overlay, highest priority, no framework edits needed.

> More (privacy and uploads, offline use, subject packs, wrong grading, state validation): [full FAQ](./docs/readme-details.en.md#full-faq)

---

## Going deeper

| To learn about | Read |
|---|---|
| **The expanded README** (rationale / evidence / walkthrough / full FAQ) | [`docs/readme-details.en.md`](./docs/readme-details.en.md) |
| The single contract (where the AI starts) | [`AGENTS.md`](./AGENTS.md) |
| The single source of truth for teaching rules | [`协议/00_导师协议.md`](./协议/00_导师协议.md) |
| How each block is introduced / bar and list criteria | [`协议/05_对话导入.md`](./协议/05_对话导入.md)｜[`协议/06_小目标进度.md`](./协议/06_小目标进度.md) |
| The state machine and its 12 invariants | [`协议/04_状态机.md`](./协议/04_状态机.md) |
| **Why it's designed this way** | [`教程/03-design-notes.en.md`](./教程/03-design-notes.en.md)｜[`docs/adr/`](./docs/adr/) (10 ADRs) |
| **Where the rules' evidence comes from** | [`docs/simulations/`](./docs/simulations/)｜[`docs/weak-model/`](./docs/weak-model/)｜[`docs/E2E-RUN-REPORT.md`](./docs/E2E-RUN-REPORT.md) |
| How the behaviour evaluation runs and where its limits are | [`docs/behavior-evaluation.md`](./docs/behavior-evaluation.md) |
| How the regression cases are written | [`tests/README.md`](./tests/README.md) |
| Glossary | [`CONTEXT.md`](./CONTEXT.md) |
| Layout / framework–data separation | [Details § Layout](./docs/readme-details.en.md#layout) |

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
