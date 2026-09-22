# 02 · Agent Setup Guide

> This document covers how to connect **25+ AI tools**. Core conclusion: **this project maintains only one copy of the rules (`AGENTS.md`); every other file is an auto-generated pointer.**
> Use whatever tool you like — as long as it can open a folder.
> Chinese version: [`02-各工具接入指南.md`](./02-各工具接入指南.md)

---

## 0. The principle in one line

```
Your AI tool
    ↓ reads (each tool recognises a different file name)
Pointer files (CLAUDE.md / CODEBUDDY.md / .trae/rules / …)
    ↓ all point to
AGENTS.md  ← the single source of truth
    ↓ which points to
协议/00_导师协议.md + 学科包/ + 我的学习/
```

**Why it is designed this way**: if every tool kept its own full copy of the rules, one change would mean 25 changes, and drift would be inevitable.
Now changing the rules means changing only `AGENTS.md`, and the pointer files are regenerated in one command with `node _tools/setup-agents.mjs`.

---

## 1. Compatibility overview table

| Tool | Vendor | Files it recognises | Natively reads AGENTS.md | What you need to do |
|---|---|---|---|---|
| **Trae** | ByteDance | `.trae/rules/` + AGENTS.md | ⚠️ Recognises it but **off by default** | **Settings > Rules > Import settings > turn on "Include AGENTS.md in context"** |
| **ZCode** | Zhipu / Z.ai | `AGENTS.md` | ✅ Native, zero configuration | Nothing (note: it **does not scan subdirectories**, so keep rules in the root) |
| **Codex CLI** | OpenAI | `AGENTS.md` | ✅ The standard's originator | Nothing |
| **Claude Code** | Anthropic | `CLAUDE.md` | ⚠️ By default only reads it when there is no `CLAUDE.md` | A pointer is already in place, no action needed |
| **Cursor** | Anysphere | `.cursor/rules/` + AGENTS.md | ✅ Zero configuration | Nothing |
| **Tencent CodeBuddy / WorkBuddy** | Tencent | `CODEBUDDY.md` | ⚠️ `CODEBUDDY.md` takes priority | A pointer is already in place, no action needed |
| **Alibaba Qoder** | Alibaba | AGENTS.md | ✅ Zero configuration | Nothing |
| **GitHub Copilot** | GitHub | `.github/copilot-instructions.md` + AGENTS.md | ✅ (VS Code/CLI/cloud) | **The web Chat version doesn't support it**, so paste manually |
| **Gemini CLI** | Google | `GEMINI.md` | ❌ Does not read it natively | A pointer is already in place; or configure `context.fileName` |
| **Windsurf / Devin** | Cognition | `.windsurf/rules/` | ✅ | Nothing |
| **Kiro** | AWS | `.kiro/steering/` | ✅ | Requires an AWS Builder ID login |
| **Cline** | Community | `.clinerules/` + AGENTS.md | ✅ | Nothing |
| **Roo Code** | Community | `.roo/rules/` | ✅ | ⚠️ This extension is discontinued; switching to Cline is recommended |
| **Kilo Code** | Anaconda | `.kilocode/rules/` | ✅ | ⚠️ The free channel logs inputs and outputs |
| **Continue** | Cursor | `.continue/rules/` | ❌ | A pointer is already in place |
| **Antigravity** | Google | `.agents/rules/` | ❌ | A pointer is already in place |
| **Qwen Code** | Alibaba | `QWEN.md` | ❌ | A pointer is already in place |
| **Aider** | Community | `CONVENTIONS.md` | ❌ | A pointer is already in place; or write `read: AGENTS.md` in `.aider.conf.yml` |
| **Zed** | Zed | `.rules` + AGENTS.md | ✅ | Nothing |
| **goose** | Block | `.goosehints` + AGENTS.md | ✅ | Nothing |
| **Warp** | Warp | `WARP.md` | ✅ | Nothing |
| **JetBrains Junie** | JetBrains | `.junie/guidelines.md` | ✅ | Nothing |
| **Amazon Q** | AWS | `.amazonq/rules/` | ✅ | Nothing |
| **Augment** | Augment | `.augment/rules/` | ✅ | Nothing |

> Full matrix (with sources) → [`../docs/AGENT-COMPAT.md`](../docs/AGENT-COMPAT.md)

---

## 2. Top pick for non-technical users: Trae (recommended)

**Why it's recommended**: free, fully Chinese, graphical, works on Windows, needs no API key / Node.js / Git.

### Installation steps

| Step | What to do | Diagram |
|---|---|---|
| 1 | Open `https://www.trae.cn` in your browser, click "Download" | [UI mockups §1](./ui-mockups.en.md#1-download-trae-official-site) |
| 2 | Choose Windows → download the `.exe` → double-click to install, clicking "Next" all the way through | [§2](./ui-mockups.en.md#2-installation) |
| 3 | Open Trae and log in with phone number / WeChat QR code (**no credit card needed**) | [§3](./ui-mockups.en.md#3-log-in) |
| 4 | **`File → Open Folder`** → select the `StepsToGreat` **folder** (not a file!) | [§4](./ui-mockups.en.md#4-open-the-folder-the-easy-step-to-get-wrong) |
| 5 | **Settings (gear) → Rules → Import settings → turn on "Include AGENTS.md in context"** | [§5](./ui-mockups.en.md#5-flip-the-rules-switch-the-most-critical-step-90-of-people-miss-it) |
| 6 | Start a new chat and type "I'm the student. Please read AGENTS.md first, then begin." | [§6](./ui-mockups.en.md#6-say-the-first-sentence) |
| 7 | Ask it to recite the hard rules and confirm it read them (should answer **9**) | [§7](./ui-mockups.en.md#7-verify-it-really-read-them-the-only-reliable-check) |

> ⚠️ **Steps 4 and 5 are the two easiest to get wrong.** Picking a file in step 4 kills all the rules; skipping step 5 means Trae never reads `AGENTS.md`.
> This project ships an `alwaysApply: true` pointer in `.trae/rules/`, so step 5 will **probably still work** if you forget — but do it anyway.

> 💡 All UI mockups (plain text + mermaid, no screenshots) → [`ui-mockups.en.md`](./ui-mockups.en.md)

### Verifying it took effect

```
Please restate the "Hard rules" section of AGENTS.md — how many rules are there?
```

The correct answer is **9**. Can't answer → go back to steps 5 and 6.

### Free quota

| Item | Quota |
|---|---|
| China edition Free | ¥0, **500 credits** per month |
| Daily check-in | +150 |
| Monthly login | +500 |
| New user one-off | +2000 / +2000 |

⚠️ The vendor states explicitly: **free users cannot buy** extra credits, so once they run out you can only wait for next month or check in.
→ Credit-saving trick for teaching: **don't stuff 5–10 md files in at once**; let the AI `read` on demand.

---

## 3. Top pick for native zero configuration: ZCode (Zhipu)

**Why it's worth using**: it **natively reads `AGENTS.md`**, zero configuration, no switch of any kind.

| Item | Fact |
|---|---|
| Vendor | Beijing Zhipu Huazhang (Zhipu / Z.ai) |
| Form | Electron desktop app + Web + terminal CLI (`zcode`) |
| Free | The tool is free, but **you need your own API key or plan** (GLM Coding Plan / BigModel) |
| New users | **5-day trial** (quota page numbers are inconsistent: 5M/day vs 8M/day) |
| Windows | ✅ x64 / ARM64 |
| Rule file | `AGENTS.md` (workspace root + `~/.zcode/AGENTS.md`) |

### Setup steps

1. Official site `https://zcode.z.ai/` → download now → Windows x64 `.exe`
2. Double-click to install (add a whitelist entry if the firewall / antivirus blocks it)
3. First launch → log in via "Connect to use" at the bottom-left (connect Z.ai or BigModel, or enter an API key)
4. `Open Folder` → select `StepsToGreat`
5. **The rules take effect automatically**, no settings needed
6. Verify: start a new session and have it restate the hard rules

### ⚠️ Three ZCode-specific pitfalls

| Pitfall | Explanation |
|---|---|
| **Does not scan subdirectories** | It only reads the `AGENTS.md` in the workspace **root**; ones in subdirectories are ignored → this project keeps all rules in the root, so no problem |
| **100 KB truncation** | An `AGENTS.md` over 100 KB gets truncated (this project is far below that) |
| **Rule changes need a new session** | Already-started sessions don't hot-reload |

---

## 4. Other key tools

### Cursor

| Item | Content |
|---|---|
| Files it recognises | `.cursor/rules/*.mdc` (already generated) + `AGENTS.md` (zero configuration) |
| Free | Hobby tier, **no credit card needed**; the vendor only describes the quota as "Limited Agent requests" |
| Setup | Download → install → `Open Folder` → select `StepsToGreat` → usable immediately |

### Tencent CodeBuddy / WorkBuddy

| Item | Content |
|---|---|
| Files it recognises | **`CODEBUDDY.md` takes priority**; it only reads `AGENTS.md` when there is **no** `CODEBUDDY.md` in the root |
| How this project handles it | A `CODEBUDDY.md` pointer is placed **deliberately** → pointing at `AGENTS.md` |
| Free | Trial edition 500 credits/month (the vendor states it is a **limited-time free period**) |
| Setup | Download → WeChat QR-code login → open the folder → usable immediately |
| ⚠️ Privacy | Personal-edition content passes through Tencent Cloud |

### Claude Code

| Item | Content |
|---|---|
| Files it recognises | `CLAUDE.md`; **by default it only reads `AGENTS.md` when there is no `CLAUDE.md`** |
| How this project handles it | A `CLAUDE.md` pointer is placed → explicitly requiring it to read `AGENTS.md` first |
| Free | ❌ **No free tier** (Pro is about $17–20/month) |
| ⚠️ Network | Anthropic does not serve mainland China, so a proxy may be needed |

### GitHub Copilot

| Item | Content |
|---|---|
| Files it recognises | `.github/copilot-instructions.md` (already generated) + `AGENTS.md` |
| Free | Free tier; **students can apply for Copilot Pro for free** (the best value) |
| ⚠️ Limitation | **The web Chat version does not support `AGENTS.md`** → you must paste the content manually |

### Gemini CLI / Antigravity

| Item | Content |
|---|---|
| Files it recognises | `GEMINI.md` (Gemini CLI) / `.agents/rules/` (Antigravity) — **neither reads `AGENTS.md` natively** |
| How this project handles it | Both pointers are already generated |
| Alternative | Gemini CLI can be configured with `context.fileName: AGENTS.md` |
| ⚠️ Status | Gemini CLI has been superseded by Antigravity CLI (as of 2026-06-18) |

---

## 5. If you use a web-based AI (ChatGPT / Claude / Doubao / Kimi)

**Web versions cannot open a folder**, so:

1. Manually **copy and paste** the contents of `AGENTS.md` into the chat box
2. Then paste `协议/00_导师协议.md`
3. Then say "Following the protocol above, I'm the student. Begin."

**Downsides**: you have to paste again in every new conversation, and the AI can't read or write your files (you have to copy your learning records yourself).

**Advice**: use the web version only for "trying it out"; for real long-term study, use a tool that can open a folder.

---

## 6. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| AI says it can't find AGENTS.md | You opened a file, not a folder | "Open Folder" again |
| AI says it doesn't know the rules | The Trae switch isn't on | Settings > Rules > Import settings > turn on "Include AGENTS.md in context" |
| The rules the AI read are incomplete | ZCode doesn't scan subdirectories / truncates over 100 KB | Keep the rules in the root; this project already satisfies that |
| The AI changed a file but forgot it next session | The tool doesn't support persistent memory | This project persists via `我的学习/00-学习档案.md`, not via AI memory |
| The quota runs out fast | Too many files read at once | Have the AI `read` **on demand**; don't stuff 5–10 md files in at once |
| Poor performance on long Chinese documents | Free tiers are often bound to Auto / weak models | Upgrade the tier, or switch to ZCode/Cursor |

---

## 7. Will switching tools lose my records?

**No.** All your data is in `我的学习/`, as ordinary Markdown files:

```
我的学习/
├── 00-学习档案.md          ← overall state
└── 学科/<subject-name>/
    ├── 00-摸底测试.md
    ├── 00-课程路线.md
    └── 01-<lesson-name>/
        ├── 01_教学引导.md
        └── 01_学生回答.md
```

Switch to any tool → open the same folder → say "continue" → it picks up the teaching.

---

## 8. Adding a new tool yourself

If your tool isn't in the table:

1. Look up what its rule file is called (search its official docs for "rules" or "instructions")
2. Edit the `TARGETS` array in `_tools/setup-agents.mjs` and add an entry
3. Run `node _tools/setup-agents.mjs`
4. Open a PR to this project so the next person doesn't have to look it up

```js
{
  path: '.newtool/rules/00-steps-to-great.md',
  body: pointer('NewTool'),
}
```
