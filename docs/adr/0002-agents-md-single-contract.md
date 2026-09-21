# 0002 · `AGENTS.md` 单一契约 + 脚本生成跳板

- **状态**：已接受
- **日期**：2026-09-21
- **决策者**：项目发起人

---

## 背景

本项目要让 **25+ 个 AI 工具**都能当导师。但每个工具认的规则文件名不同：

| 工具 | 认的文件 |
|---|---|
| OpenAI Codex / Cursor / Qoder / Cline / Zed / goose / Warp / ZCode | `AGENTS.md` |
| Claude Code | `CLAUDE.md` |
| 腾讯 CodeBuddy / WorkBuddy | `CODEBUDDY.md`（且优先于 AGENTS.md） |
| Trae | `.trae/rules/`（AGENTS.md 需手动开开关） |
| Gemini CLI / Antigravity | `GEMINI.md` / `.agents/rules/` |
| Aider | `CONVENTIONS.md` |
| Qwen Code | `QWEN.md` |
| Continue | `.continue/rules/` |

约束：**规则会持续演进**（协议要改、学科包要加）。如果每个工具一份完整副本，改一处要改 25 处。

---

## 决策

**只维护一份真相 `AGENTS.md`；其余 25 个文件全部由 `_tools/setup-agents.mjs` 自动生成。**

生成的跳板文件内容统一为：

```markdown
# <工具名> · 请先读 AGENTS.md
1. 打开并完整阅读 AGENTS.md
2. 严格遵循它的规则
3. 需要细节时按它的指引继续读 协议/ 学科包/ 我的学习/
```

外加该工具**特有的注意事项**（如 Trae 要开开关、CodeBuddy 的优先级问题）。

---

## 理由

| 理由 | 说明 |
|---|---|
| **单一真相** | 改规则只改 `AGENTS.md`，不可能漂移 |
| **新增工具成本极低** | 在 `TARGETS` 数组加一条 + 重跑脚本 |
| **可校验** | `setup-agents.mjs --check` 可检测跳板是否与脚本一致；`check.mjs` 每次跑 |
| **可写工具特有提示** | 跳板不只是指针，还能携带「这个工具要开哪个开关」的提醒 |
| **对用户零负担** | 用户不需要知道哪个工具认哪个文件 |

---

## 备选方案与为何否决

| 方案 | 否决理由 |
|---|---|
| 每个工具一份完整规则副本 | 改一处要改 25 处，必然漂移；且仓库里 25 份相同内容极其臃肿 |
| 只写 `AGENTS.md`，不认的工具不管 | 大量用户（尤其中文用户用 Trae/CodeBuddy）直接用不了 |
| 用软链接 / 符号链接 | Windows 上需要管理员权限或开发者模式；普通用户跑不起来 |
| 打包成一个安装脚本，运行时注入 | 用户换工具就要重跑；且部分工具不支持运行时注入 |

---

## 已知取舍

| 取舍 | 说明 |
|---|---|
| **Claude Code 用户会经过一次跳转** | `CLAUDE.md` 存在时它不直接读 `AGENTS.md` → 跳板明确要求它先读 `AGENTS.md` |
| **Trae 仍需手动开开关** | 无法用文件绕过；跳板用 `alwaysApply: true` 兜底，但官方文档要求开开关 |
| **ZCode 不扫子目录** | 只能放根目录的 `AGENTS.md` → 本项目规则确实在根目录，无影响 |
| **生成文件不可手改** | 手改会被下次生成覆盖 → 脚本注释里明确写了「不要手工修改」 |

---

## 影响

- 新增工具 = 改 `TARGETS` 数组 + `MATRIX` 表 + 跑脚本 + 提 PR
- 每次 PR 都要跑 `node _tools/check.mjs`（它会调用 `setup-agents.mjs --check`）
- `docs/AGENT-COMPAT.md` 也是生成物，不许手改
