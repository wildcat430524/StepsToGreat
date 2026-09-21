#!/usr/bin/env node
/**
 * setup-agents.mjs —— 为所有主流 AI Agent 生成「入口跳板文件」
 *
 * 为什么需要它：
 *   不同 AI 工具认不同的规则文件名（CLAUDE.md / CODEBUDDY.md / GEMINI.md / .trae/rules …）。
 *   本项目只维护**一份真相** —— `AGENTS.md`；其余文件全部由本脚本生成，内容都是
 *   「读 AGENTS.md 并严格遵循」+ 该工具特有的注意事项。
 *
 * 用法：
 *   node _tools/setup-agents.mjs          # 生成 / 覆盖全部跳板文件
 *   node _tools/setup-agents.mjs --check  # 只检查，不写入（CI 用）
 *
 * 新增工具时：在 TARGETS 里加一条即可，不要再手写文件。
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK_ONLY = process.argv.includes('--check');

/** 契约文件，其余一切跳板都指向它 */
const CONTRACT = 'AGENTS.md';

/** 每个跳板的中文提示语（工具读得懂中文，也读得懂英文；这里用中文，与本项目主语言一致） */
const pointer = (toolName, extra = '') => `# ${toolName} · 请先读 ${CONTRACT}

> 本文件是**自动生成的跳板**，不要手工修改。
> **真相在项目根目录的 \`${CONTRACT}\`**（本文件所在的子目录层级不影响：请回到仓库根目录读它）。
> 重新生成：\`node _tools/setup-agents.mjs\`

**你现在要做的事：**

1. 打开并**完整阅读**仓库根目录的 \`${CONTRACT}\`。
2. 严格遵循它里面的全部规则：接手顺序、硬规则、评估口径、落档纪律。
3. 需要细节时，按 \`${CONTRACT}\` 的指引继续读：
   - \`协议/00_导师协议.md\` —— 教学规则的唯一出处
   - \`协议/01_摸底剧本.md\` —— 学生第一次使用时的摸底流程
   - \`协议/02_新课模板.md\` —— 发新课的固定模板
   - \`协议/03_落档事件表.md\` —— 什么时候写哪个文件
   - \`学科包/README.md\` —— 该用哪套评估维度
   - \`我的学习/00-学习档案.md\` —— 学生现在学到哪（顶部 🚦 交接状态）

**一句话**：你是导师，用户是学生。按他自己的目标一对一教他，三维评估全 ✅ 才推进下一课。
${extra}
---

*This file is an auto-generated pointer. The single source of truth is \`${CONTRACT}\` at the repository root — go back to the root and read it fully, then follow it strictly.*
`;

/** 跳板清单：path = 相对路径，body = 文件内容 */
const TARGETS = [
  // ── 通用标准（最先） ──────────────────────────────────────────
  {
    path: 'AGENTS.md',
    skip: true, // 这是真相本身，不生成
  },

  // ── Anthropic / Claude Code ───────────────────────────────────
  {
    path: 'CLAUDE.md',
    body: pointer('Claude Code', `
> **Claude Code 注意**：如果你读到了 \`CLAUDE.md\`，说明本目录同时存在 \`AGENTS.md\`。
> Claude Code 默认**只在没有 \`CLAUDE.md\` 时才读 \`AGENTS.md\`** —— 所以这个文件存在的意义，
> 就是把你**引到** \`AGENTS.md\`。请以 \`AGENTS.md\` 为准，不要只读本文件就开工。
> 另外请读 \`AGENTS.md\` 的第 2 节「硬规则」——其中「改文件前必须先读」对你尤其重要。
`),
  },

  // ── 腾讯 CodeBuddy / WorkBuddy ────────────────────────────────
  {
    path: 'CODEBUDDY.md',
    body: pointer('腾讯 CodeBuddy / WorkBuddy', `
> **CodeBuddy 注意**：CodeBuddy 的规则文档写明「**当项目根目录存在 \`AGENTS.md\` 而不存在
> \`CODEBUDDY.md\` 时**，才会自动加载 \`AGENTS.md\`」—— 即 \`CODEBUDDY.md\` 优先。
> 本项目**故意**保留这个文件，就是为了让 CodeBuddy 也能被正确引导。
> WorkBuddy 办公端没有 \`AGENTS.md\` 的规则承诺，**只认这个文件**，所以请务必读完它再读 \`AGENTS.md\`。
`),
  },

  // ── Google Gemini CLI / Antigravity ───────────────────────────
  {
    path: 'GEMINI.md',
    body: pointer('Gemini CLI / Antigravity', `
> **Gemini CLI 注意**：你默认读 \`GEMINI.md\`，不自动读 \`AGENTS.md\`。
> 若想改用统一契约，可在设置里把 \`context.fileName\` 配置为 \`AGENTS.md\`；
> 不做配置也没关系 —— 按本文件指引去读 \`AGENTS.md\` 即可。
> **Antigravity** 的规则目录是 \`.agents/rules/\`（已一并生成），同样指向 \`AGENTS.md\`。
`),
  },

  // ── 阿里 Qwen Code ────────────────────────────────────────────
  {
    path: 'QWEN.md',
    body: pointer('Qwen Code'),
  },

  // ── Aider ────────────────────────────────────────────────────
  {
    path: 'CONVENTIONS.md',
    body: pointer('Aider', `
> **Aider 注意**：Aider 默认读 \`CONVENTIONS.md\`。
> 若想让 Aider 直接读 \`AGENTS.md\`，在 \`.aider.conf.yml\` 里写 \`read: AGENTS.md\` 即可。
`),
  },

  // ── Warp ─────────────────────────────────────────────────────
  {
    path: 'WARP.md',
    body: pointer('Warp'),
  },

  // ── goose ────────────────────────────────────────────────────
  {
    path: '.goosehints',
    body: pointer('goose'),
  },

  // ── Zed ──────────────────────────────────────────────────────
  {
    path: '.rules',
    body: pointer('Zed'),
  },

  // ── Cursor ───────────────────────────────────────────────────
  {
    path: '.cursor/rules/00-steps-to-great.mdc',
    body: `---
description: StepsToGreat 导师协议 —— 项目唯一契约入口
alwaysApply: true
---

${pointer('Cursor')}`,
  },

  // ── Trae ─────────────────────────────────────────────────────
  {
    path: '.trae/rules/00-steps-to-great.md',
    body: `---
description: StepsToGreat 导师协议 —— 项目唯一契约入口
alwaysApply: true
---

${pointer('Trae', `
> **Trae 注意（关键）**：Trae **默认不会读 \`AGENTS.md\`**，需要手动打开开关：
> **设置（齿轮）> 规则 > 导入设置 > 打开「将 AGENTS.md 包含在上下文中」**。
> 这个文件（\`.trae/rules/\`）是 Trae 原生格式，**alwaysApply: true** 会自动生效 ——
> 即使学生忘了打开那个开关，你也能通过本文件被引导到 \`AGENTS.md\`。
> 若用的是 TraeWork：AGENTS.md 支持**仅桌面版**。
`)}`,
  },

  // ── GitHub Copilot ───────────────────────────────────────────
  {
    path: '.github/copilot-instructions.md',
    body: pointer('GitHub Copilot', `
> **Copilot 注意**：VS Code / CLI / cloud agent 都支持 \`AGENTS.md\`（嵌套为实验特性）。
> 但 **Chat 网页版不支持** —— 网页版用户请手动把 \`AGENTS.md\` 内容粘贴进对话。
`),
  },

  // ── Windsurf / Devin ─────────────────────────────────────────
  {
    path: '.windsurf/rules/00-steps-to-great.md',
    body: `---
trigger: always_on
description: StepsToGreat 导师协议入口
---

${pointer('Windsurf / Devin')}`,
  },

  // ── Kiro ─────────────────────────────────────────────────────
  {
    path: '.kiro/steering/00-steps-to-great.md',
    body: `---
inclusion: always
---

${pointer('Kiro')}`,
  },

  // ── Continue ─────────────────────────────────────────────────
  {
    path: '.continue/rules/00-steps-to-great.md',
    body: pointer('Continue', `
> **Continue 注意**：Continue 官方通篇未提 \`AGENTS.md\`，只认 \`.continue/rules/\`。
> 所以这个文件对它是**唯一入口**，请务必读完再去读 \`AGENTS.md\`。
`),
  },

  // ── Cline ────────────────────────────────────────────────────
  {
    path: '.clinerules/00-steps-to-great.md',
    body: pointer('Cline'),
  },

  // ── Roo Code ─────────────────────────────────────────────────
  {
    path: '.roo/rules/00-steps-to-great.md',
    body: pointer('Roo Code'),
  },

  // ── Kilo Code ────────────────────────────────────────────────
  {
    path: '.kilocode/rules/00-steps-to-great.md',
    body: pointer('Kilo Code', `
> **Kilo Code 注意**：官方明示 Auto Free 免费通道会记录 prompt/output，
> 「不要提交个人或机密数据」。本项目的学习资料属个人内容，请提示学生注意。
`),
  },

  // ── Qoder（阿里） ─────────────────────────────────────────────
  {
    path: '.qoder/rules/00-steps-to-great.md',
    body: pointer('Qoder', `
> **Qoder 注意**：Qoder 原生兼容 \`AGENTS.md\`（零配置）。
> 本文件是冗余保险 —— 当学生在设置里禁用了 \`AGENTS.md\` 读取时兜底。
`),
  },

  // ── Google Antigravity ───────────────────────────────────────
  {
    path: '.agents/rules/00-steps-to-great.md',
    body: pointer('Antigravity'),
  },

  // ── JetBrains Junie ──────────────────────────────────────────
  {
    path: '.junie/guidelines.md',
    body: pointer('JetBrains Junie'),
  },

  // ── JetBrains AI Assistant ───────────────────────────────────
  {
    path: '.aiassistant/rules/00-steps-to-great.md',
    body: pointer('JetBrains AI Assistant'),
  },

  // ── Amazon Q Developer ───────────────────────────────────────
  {
    path: '.amazonq/rules/00-steps-to-great.md',
    body: pointer('Amazon Q Developer'),
  },

  // ── Augment ──────────────────────────────────────────────────
  {
    path: '.augment/rules/00-steps-to-great.md',
    body: pointer('Augment'),
  },

  // ── Codex（OpenAI）───────────────────────────────────────────
  {
    path: '.codex/README.md',
    body: pointer('OpenAI Codex CLI', `
> **Codex 注意**：Codex 是 \`AGENTS.md\` 标准的**发起方之一**，原生零配置读取根目录 \`AGENTS.md\`，
> 且支持嵌套 \`AGENTS.md\`（就近生效）。**你不需要本文件** —— 它只是为了让目录结构自解释而存在。
`),
  },

  // ── DSH（DeepSeek Harness）───────────────────────────────────
  {
    path: '.dsh/README.md',
    body: pointer('DSH（DeepSeek Harness）', `
> **DSH 注意**：DSH 通过内置的 \`dsh-agent-instructions\` 插件**原生读取根目录 \`AGENTS.md\`**（默认候选还包括
> \`CLAUDE.md\`；\`AGENTS.local.md\` / \`CLAUDE.local.md\` 是本地叠加层），会话首次请求时自动注入，
> **零配置**。默认预算 65,536 字节（\`maxBytes\`），本项目远小于此。
> **你不需要本文件** —— 它只是为了让目录结构自解释而存在。
> 文档：https://www.npmjs.com/package/@deepseek-ai/dsh-agent-instructions
`),
  },
];

/** 兼容性矩阵，写进 docs/AGENT-COMPAT.md */
const MATRIX = [
  ['工具', '规则文件', '是否原生读 AGENTS.md', '需要学生手动做什么'],
  ['---', '---', '---', '---'],
  ['OpenAI Codex CLI', 'AGENTS.md', '✅ 标准发起方，零配置', '无'],
  ['**DSH（DeepSeek Harness）**', 'AGENTS.md（+ CLAUDE.md；`AGENTS.local.md` 为本地叠加）', '✅ 原生（`dsh-agent-instructions` 插件自动注入），零配置', '无（预算默认 65,536 字节；不扫子目录）'],
  ['**ZCode（智谱 Z.ai）**', 'AGENTS.md（工作区 + `~/.zcode/AGENTS.md`）', '✅ 原生，零配置', '无（不读 CLAUDE.md；**不扫子目录**，规则只放根目录）'],
  ['Cursor', 'AGENTS.md / .cursor/rules', '✅ 零配置', '无'],
  ['Qoder（阿里）', 'AGENTS.md / .qoder/rules', '✅ 零配置', '无'],
  ['Cline / Roo / Kilo', 'AGENTS.md / .clinerules / .roo / .kilocode', '✅', '无'],
  ['Zed', 'AGENTS.md / .rules', '✅（主指令文件）', '无'],
  ['opencode / goose / Amp / Warp', 'AGENTS.md / .goosehints / WARP.md', '✅', '无'],
  ['GitHub Copilot', '.github/copilot-instructions.md / AGENTS.md', '✅（VS Code/CLI/cloud）', '**网页版 Chat 不支持**，需手动粘贴'],
  ['Windsurf / Devin', '.windsurf/rules / AGENTS.md', '✅', '无'],
  ['Kiro', '.kiro/steering / AGENTS.md', '✅', '需 AWS Builder ID 登录'],
  ['Augment / Junie / Amazon Q', 'AGENTS.md / 各自目录', '✅', '无'],
  ['**Trae**', '.trae/rules / AGENTS.md', '⚠️ 认，但**默认关着**', '**设置 > 规则 > 导入设置 > 打开「将 AGENTS.md 包含在上下文中」**'],
  ['**Claude Code**', 'CLAUDE.md / AGENTS.md', '⚠️ 默认只在没有 CLAUDE.md 时才读', '本仓库已放 CLAUDE.md 跳板；或删掉它让 AGENTS.md 生效'],
  ['**腾讯 CodeBuddy / WorkBuddy**', 'CODEBUDDY.md / AGENTS.md', '⚠️ CODEBUDDY.md 优先', '本仓库已放 CODEBUDDY.md 跳板，无需操作'],
  ['**Gemini CLI**', 'GEMINI.md', '❌ 不原生读', '可配 context.fileName=AGENTS.md；或按 GEMINI.md 跳板走'],
  ['Antigravity', '.agents/rules/', '❌ 不原生读', '本仓库已放 .agents/rules 跳板'],
  ['Continue', '.continue/rules/', '❌ 不原生读', '本仓库已放 .continue/rules 跳板'],
  ['Aider', 'CONVENTIONS.md', '❌ 不原生读', '或在 .aider.conf.yml 写 read: AGENTS.md'],
  ['Qwen Code', 'QWEN.md', '❌ 不原生读', '本仓库已放 QWEN.md 跳板'],
];

const matrixMd = `# AI 工具兼容性矩阵

> **本文件由 \`_tools/setup-agents.mjs\` 生成**，不要手工修改。
> 重新生成：\`node _tools/setup-agents.mjs\`

## 核心设计

本项目**只维护一份真相** —— 根目录的 [\`AGENTS.md\`](../AGENTS.md)。
其余所有工具专属文件都是**自动生成的跳板**，内容只有一句：「去读 AGENTS.md，并严格遵循」。

好处：规则永不漂移；换工具不用改规则；新增工具只改一个脚本。

## 矩阵

| ${MATRIX[0].join(' | ')} |
|${MATRIX[1].map(() => '---').join('|')}|
${MATRIX.slice(2).map((r) => `| ${r.join(' | ')} |`).join('\n')}

## 一键生成

\`\`\`bash
node _tools/setup-agents.mjs          # 生成 / 覆盖全部跳板文件
node _tools/setup-agents.mjs --check  # 只检查是否齐全（CI 用）
\`\`\`

## 新增一个工具

编辑 \`_tools/setup-agents.mjs\` 的 \`TARGETS\` 数组，加一条：

\`\`\`js
{
  path: '.newtool/rules/00-steps-to-great.md',
  body: pointer('NewTool'),
}
\`\`\`

然后重跑脚本。**不要手写跳板文件**，否则下次生成会被覆盖。
`;

// ─────────────────────────────────────────────────────────────

function ensureDir(file) {
  const d = dirname(join(ROOT, file));
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

let written = 0;
let missing = [];
let drifted = [];

for (const t of TARGETS) {
  if (t.skip) continue;
  const abs = join(ROOT, t.path);
  const body = t.body.endsWith('\n') ? t.body : t.body + '\n';

  if (CHECK_ONLY) {
    if (!existsSync(abs)) {
      missing.push(t.path);
    } else if (readFileSync(abs, 'utf8') !== body) {
      drifted.push(t.path);
    }
    continue;
  }

  ensureDir(t.path);
  writeFileSync(abs, body, 'utf8');
  written++;
  console.log(`  ✅ ${t.path}`);
}

// 兼容性矩阵
{
  const abs = join(ROOT, 'docs/AGENT-COMPAT.md');
  if (CHECK_ONLY) {
    if (!existsSync(abs)) missing.push('docs/AGENT-COMPAT.md');
  } else {
    ensureDir('docs/AGENT-COMPAT.md');
    writeFileSync(abs, matrixMd, 'utf8');
    written++;
    console.log('  ✅ docs/AGENT-COMPAT.md');
  }
}

if (CHECK_ONLY) {
  if (missing.length === 0 && drifted.length === 0) {
    console.log(`✅ 全部跳板文件齐全且与脚本一致（${TARGETS.filter((t) => !t.skip).length + 1} 个）`);
    process.exit(0);
  }
  if (missing.length) console.error(`❌ 缺失 ${missing.length} 个：\n  ${missing.join('\n  ')}`);
  if (drifted.length) console.error(`❌ 与脚本不一致 ${drifted.length} 个（请重跑生成）：\n  ${drifted.join('\n  ')}`);
  process.exit(1);
}

console.log(`\n✅ 已生成 ${written} 个跳板文件。真相始终是 AGENTS.md。`);
console.log('   提示：换工具不需要改任何规则，只要该工具认上面任意一个文件即可。');
