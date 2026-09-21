# 测试集说明（State Validation Fixtures）

> 用途：证明 `_tools/validate-state.mjs` **判得对** —— 每个用例喂进一份故意构造的学习档案，断言校验器给出预期结论。
> 这就是「协议行为回归测试」：改了校验规则或协议口径，跑一遍就知道有没有判错。

---

## 怎么跑

```bash
node _tools/validate-state.mjs --fixtures tests/fixtures
```

`npm run verify` 与 CI 都会跑它。

---

## 用例结构

每个用例是一个目录：

```
tests/fixtures/<用例名>/
├── 我的学习/00-学习档案.md     ← 被校验的档案（可含学科子目录与回答文档）
├── 我的学习/学科/...           ← 需要时补上被引用的文件
└── expected.json               ← 断言
```

`expected.json`：

```json
{
  "status": "PASSED | FAILED | BLANK | SKIPPED",
  "invariants": ["I6", "I7"],
  "description": "人读的一行说明：这个用例验证什么"
}
```

| 字段 | 含义 |
|---|---|
| `status` | 期望校验器给出的总判定 |
| `invariants` | 期望**命中**的不变式编号（必须全部出现在报错里） |
| `description` | 这个用例在防什么错 |

---

## 用例清单

| 用例 | 期望 | 命中的不变式 | 验证什么 |
|---|---|---|---|
| `00-valid-progress` | `PASSED` | — | 一个完全正确的档案：路径齐全、掌握有证据、无提前推进 |
| `01-premature-advance` | `FAILED` | `I9` | 上一课在 📊 里还是「⏳ 待作答」，却已经推进到下一课 |
| `02-missing-evidence` | `FAILED` | `I6` | 📊 标 ✅ 已掌握，但回答文档没有「最终复评结果」 |
| `03-contradictory-verdict` | `FAILED` | `I7` | 档案标 ✅，但复评表里逻辑维度是 ⚠️ |
| `04-missing-doctor` | `FAILED` | `I3` | 🚦 指向的教学文档不存在（写成死路径） |
| `05-blank-template` | `BLANK` | — | 空模板必须被识别为 `NEW`，不误报 |

---

## 加一个用例

1. 复制一个现有用例目录，改名成 `NN-<你在防的错>`。
2. 改 `我的学习/00-学习档案.md`（以及它引用的文件），**故意制造那一个错误**。
3. 写 `expected.json`，`invariants` 填你期望命中的编号（口径见 [`../协议/04_状态机.md`](../协议/04_状态机.md) 第 4 节）。
4. 跑：

```bash
node _tools/validate-state.mjs --fixtures tests/fixtures
```

**红 → 绿**：先让用例失败（说明校验器还抓不到），再改 `_tools/validate-state.mjs` 让它通过。
