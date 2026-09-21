# AI 工具兼容性矩阵

> **本文件由 `_tools/setup-agents.mjs` 生成**，不要手工修改。
> 重新生成：`node _tools/setup-agents.mjs`

## 核心设计

本项目**只维护一份真相** —— 根目录的 [`AGENTS.md`](../AGENTS.md)。
其余所有工具专属文件都是**自动生成的跳板**，内容只有一句：「去读 AGENTS.md，并严格遵循」。

好处：规则永不漂移；换工具不用改规则；新增工具只改一个脚本。

## 矩阵

| 工具 | 规则文件 | 是否原生读 AGENTS.md | 需要学生手动做什么 |
|---|---|---|---|
| OpenAI Codex CLI | AGENTS.md | ✅ 标准发起方，零配置 | 无 |
| **DSH（DeepSeek Harness）** | AGENTS.md（+ CLAUDE.md；`AGENTS.local.md` 为本地叠加） | ✅ 原生（`dsh-agent-instructions` 插件自动注入），零配置 | 无（预算默认 65,536 字节；不扫子目录） |
| **ZCode（智谱 Z.ai）** | AGENTS.md（工作区 + `~/.zcode/AGENTS.md`） | ✅ 原生，零配置 | 无（不读 CLAUDE.md；**不扫子目录**，规则只放根目录） |
| Cursor | AGENTS.md / .cursor/rules | ✅ 零配置 | 无 |
| Qoder（阿里） | AGENTS.md / .qoder/rules | ✅ 零配置 | 无 |
| Cline / Roo / Kilo | AGENTS.md / .clinerules / .roo / .kilocode | ✅ | 无 |
| Zed | AGENTS.md / .rules | ✅（主指令文件） | 无 |
| opencode / goose / Amp / Warp | AGENTS.md / .goosehints / WARP.md | ✅ | 无 |
| GitHub Copilot | .github/copilot-instructions.md / AGENTS.md | ✅（VS Code/CLI/cloud） | **网页版 Chat 不支持**，需手动粘贴 |
| Windsurf / Devin | .windsurf/rules / AGENTS.md | ✅ | 无 |
| Kiro | .kiro/steering / AGENTS.md | ✅ | 需 AWS Builder ID 登录 |
| Augment / Junie / Amazon Q | AGENTS.md / 各自目录 | ✅ | 无 |
| **Trae** | .trae/rules / AGENTS.md | ⚠️ 认，但**默认关着** | **设置 > 规则 > 导入设置 > 打开「将 AGENTS.md 包含在上下文中」** |
| **Claude Code** | CLAUDE.md / AGENTS.md | ⚠️ 默认只在没有 CLAUDE.md 时才读 | 本仓库已放 CLAUDE.md 跳板；或删掉它让 AGENTS.md 生效 |
| **腾讯 CodeBuddy / WorkBuddy** | CODEBUDDY.md / AGENTS.md | ⚠️ CODEBUDDY.md 优先 | 本仓库已放 CODEBUDDY.md 跳板，无需操作 |
| **Gemini CLI** | GEMINI.md | ❌ 不原生读 | 可配 context.fileName=AGENTS.md；或按 GEMINI.md 跳板走 |
| Antigravity | .agents/rules/ | ❌ 不原生读 | 本仓库已放 .agents/rules 跳板 |
| Continue | .continue/rules/ | ❌ 不原生读 | 本仓库已放 .continue/rules 跳板 |
| Aider | CONVENTIONS.md | ❌ 不原生读 | 或在 .aider.conf.yml 写 read: AGENTS.md |
| Qwen Code | QWEN.md | ❌ 不原生读 | 本仓库已放 QWEN.md 跳板 |

## 一键生成

```bash
node _tools/setup-agents.mjs          # 生成 / 覆盖全部跳板文件
node _tools/setup-agents.mjs --check  # 只检查是否齐全（CI 用）
```

## 新增一个工具

编辑 `_tools/setup-agents.mjs` 的 `TARGETS` 数组，加一条：

```js
{
  path: '.newtool/rules/00-steps2great.md',
  body: pointer('NewTool'),
}
```

然后重跑脚本。**不要手写跳板文件**，否则下次生成会被覆盖。
