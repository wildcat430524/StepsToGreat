# 01 · Five-Minute Setup

> Goal: go from "download this folder" to "talking with an AI tutor" in **5 minutes**.
> No programming knowledge needed, no API key needed (the recommended tools all start on a free tier).
> Chinese version: [`01-五分钟上手.md`](./01-五分钟上手.md)

---

## What you need to prepare

| Item | Requirement |
|---|---|
| Computer | Windows 10/11, macOS or Linux |
| Network | Internet access (the AI needs to be online) |
| An AI tool | See "Step 2" below; **Trae** is recommended (free, Chinese, graphical) |
| Time | 5 minutes |

**Not needed**: programming background, Git, Node.js, an API key, a credit card.

---

## Step 1 · Put this folder somewhere you can find it

Say you put it at:

```
E:\StepsToGreat
```

> 📌 **Important**: put it at a **path you can remember yourself**, not in a temp directory or your Downloads folder.
> This folder is your "learning record" — it will keep accumulating your study history.

---

## Step 2 · Install an AI tool

**Recommended order** (all free, all support Chinese, all can open a folder):

| Rank | Tool | Why it's recommended | Free situation |
|---|---|---|---|
| 🥇 | **Trae** | Chinese UI, graphical, no API key needed, works on Windows | China edition ¥0, 500 credits/month |
| 🥈 | **Tencent CodeBuddy** | Chinese, WeChat QR-code login | Trial edition 500 credits/month |
| 🥉 | **Alibaba Qoder** | Natively recognises `AGENTS.md`, zero configuration | Has a free tier |
| 4 | **Cursor** | Most mature ecosystem | Free Hobby tier |

Detailed comparison and per-tool install steps → [`02-各工具接入指南.md`](./02-各工具接入指南.md)

**Here we use Trae as the example** (because it is the only one that "hits everything"):

1. Open `https://www.trae.cn` in your browser (China edition)
2. Click "Download" → choose Windows → download the `.exe`
3. Double-click to install, clicking "Next" all the way through
4. Open Trae and log in with your phone number or WeChat QR code (**no credit card needed**)

---

## Step 3 · Open the folder (the key step)

In Trae:

```
File → Open Folder → select E:\StepsToGreat
```

> ⚠️ **Open the folder itself**, not some `.md` file inside it.
> Get this step wrong and the AI can't read the rules, and everything after it is void.

---

## Step 4 · Turn on the "read AGENTS.md" switch (Trae users must read this)

**90% of people miss this step.**

Trae **does not read** `AGENTS.md` by default; you have to turn it on manually:

```
Settings (gear icon, bottom-left) → Rules → Import settings
→ turn on "Include AGENTS.md in context"
```

> 💡 This project has already placed pointer files in `.trae/rules/` (`alwaysApply: true`),
> so **even if you forget to turn this switch on, it will most likely still work**.
> But **turning it on is recommended** — belt and braces.

**Do other tools need this step?**

| Tool | Does it need to be turned on manually |
|---|---|
| Cursor / Qoder / Codex / Cline / Zed | ❌ No, zero configuration |
| **Trae** | ✅ **Yes** (see above) |
| **Claude Code** | ⚠️ This project already has a `CLAUDE.md` pointer, no action needed |
| **Tencent CodeBuddy** | ⚠️ This project already has a `CODEBUDDY.md` pointer, no action needed |
| **Gemini CLI** | ⚠️ This project already has a `GEMINI.md` pointer, no action needed |

Full matrix → [`../docs/AGENT-COMPAT.md`](../docs/AGENT-COMPAT.md)

---

## Step 5 · Say your first sentence

In Trae's chat box, **copy this line verbatim**:

```
I'm the student. Please read AGENTS.md first, then begin.
```

**Then you will see the AI:**

1. Read `AGENTS.md`
2. Read `我的学习/00-学习档案.md` (and find it empty)
3. Ask you 3 questions: **what to learn / have you touched it before / what's your goal**
4. Take you through a placement test (5–8 questions, about 10 minutes)
5. Set the starting point, lay out the route, and publish lesson 1

---

## Step 6 · Confirm it really read the rules (important)

**How do you verify?** Just ask it:

```
Please restate the "Hard rules" section of AGENTS.md — how many rules are there?
```

- ✅ **It answers** (it should say 12 hard rules) → everything is fine, carry on
- ❌ **It can't answer / says it can't find the file** → go back to steps 3 and 4 and check

> This is the **only reliable way to verify**. Many tools have no UI for "view loaded rules",
> so making it restate them is the only way to confirm.

---

## From then on you only need two sentences

| Situation | What you say |
|---|---|
| You want to keep learning | "Continue" or "I'm ready" |
| You finished your homework | "**Done**" |

When the AI receives "done" it will automatically:
1. **Re-read** your answer document (not rely on memory)
2. Assess **all** questions **in one pass** (three dimensions: concept / logic / form)
3. If there are small problems → **fix them for you directly**, explaining "what you wrote → what was wrong → what I changed it to"
4. If everything passes → file the result + publish the next lesson

---

## FAQ

### Q: What if the AI says it can't read AGENTS.md?

Check in order:
1. Did you open a **folder** or a single file? (It must be a folder)
2. Trae users: did you turn on the switch in step 4?
3. Is `AGENTS.md` really in the folder? (In the root, not a subdirectory)
4. Try a different tool (see [`02-各工具接入指南.md`](./02-各工具接入指南.md))

### Q: Where do I put my own material?

Put it in the `资料/` directory (create one if it doesn't exist). The AI will read from there.

Supported formats: `.md` `.txt` `.pdf` are the most reliable; images require the AI to have vision capability.

### Q: If I switch tools, will I lose my learning records?

**No.** All your records live in the `我的学习/` directory as ordinary Markdown files.
Switch to any tool, open the same folder, and you can carry on learning.

### Q: Can I study several subjects at once?

Yes. Under `我的学习/学科/<subject-name>/` there is one directory per subject, and `我的学习/00-学习档案.md` manages the whole thing.

### Q: Will the AI upload my folder's contents to the internet?

**Some tools will.** Known cases:
- Trae officially acknowledges that indexing **temporarily uploads files** for embeddings
- CodeBuddy / WorkBuddy personal edition content passes through Tencent Cloud
- Kilo Code's free channel officially states it **logs** inputs and outputs

**If your material is sensitive**: use a tool that supports local models (Zed / goose / opencode + Ollama), or don't put sensitive content in.

### Q: Can I delete it after I'm done learning?

Yes. Just delete the whole folder — there is no background service, no account registration, no cloud storage (apart from the AI tool you chose).

---

## Next steps

- Want to know how to install each tool specifically → [`02-各工具接入指南.md`](./02-各工具接入指南.md)
- Want to know how this project is designed → [`03-设计说明.md`](./03-设计说明.md)
- Want to start right away → open your AI tool and say "I'm the student. Please read AGENTS.md first, then begin."
