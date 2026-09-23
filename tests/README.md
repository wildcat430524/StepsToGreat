# 测试集说明（State Validation Fixtures）

> 用途：证明 `_tools/validate-state.mjs` **判得对** —— 每个用例喂进一份故意构造的学习档案，断言校验器给出预期结论。
> 这就是「协议行为回归测试」：改了校验规则或协议口径，跑一遍就知道有没有判错。

---

## 怎么跑

```bash
node _tools/validate-state.mjs --fixtures tests/fixtures
# 等价于 npm run test:state
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
  "forbiddenInvariants": ["I3", "I8"],
  "problemCount": 1,
  "description": "人读的一行说明：这个用例验证什么"
}
```

| 字段 | 必填 | 含义 |
|---|---|---|
| `status` | ✅ | 期望校验器给出的总判定 |
| `invariants` | — | 期望**命中**的不变式编号（必须全部出现在报错里） |
| `forbiddenInvariants` | — | **不期望出现**的编号（出现即失败） |
| `problemCount` | — | 期望的报错**总条数**（用于「只应报 1 条」这类强断言） |
| `description` | ✅ | 这个用例在防什么错 |

> ⚠️ **为什么要有 `forbiddenInvariants`**：只断言「期望的错误出现了」是不够的 ——
> 校验器**顺手报一堆无关错误**（过度报错）同样能让用例变绿，而使用者会被假警报淹没。
> 每个 `PASSED` 用例都必须把全部不变式列进 `forbiddenInvariants`，并配 `problemCount: 0`。

---

## 用例清单（18 个）

### 正常路径

| 用例 | 期望 | 验证什么 |
|---|---|---|
| `00-valid-progress` | `PASSED` | 完全正确的档案：路径齐全、复评证据（日期/结论/维度表）俱全、无提前推进 —— 必须**一条都不报** |
| `06-between-lessons` | `PASSED` | 课间中间态（上一课已掌握、下一课未发布）+ 备注列「路径；说明」混写 |
| `12-angle-bracket-paths` | `PASSED` | Markdown 链接用尖括号包住路径（含空格路径的标准写法） |
| `05-blank-template` | `BLANK` | 真正的空模板（🚦/📊/📚 三处都未填）识别为 `NEW` |

### 证据类（本项目最严重的一类错误：谎报掌握）

| 用例 | 期望 | 验证什么 |
|---|---|---|
| `02-missing-evidence` | `FAILED` `I6` | 📊 标 ✅，但回答文档的「最终复评结果」从没填过 |
| `03-contradictory-verdict` | `FAILED` `I7` | 档案标 ✅，但复评表里逻辑维度是 ⚠️ —— 状态自相矛盾 |
| `07-duplicate-verdict` | `FAILED` `I11` | 弱模型真实犯过的错：忘了删模板自带的空占位块 → 出现两份「最终复评结果」 |
| `09-empty-verdict-table` | `FAILED` `I6` | 复评区只有「日期 + 结论」，**没有逐题三维表** —— 空口声明不能算掌握 |
| `10-invalid-date` | `FAILED` `I8` | 评估日期写 `2026-02-31`：格式合法但日历上不存在 |
| `16-current-lesson-todo-variant` | `FAILED` `I10` | 待办表重复了当前课，且**只写了一个路径**（旧实现要求两个路径同时出现，漏过） |
| `11-outside-root-path` | `FAILED` `I6` | 掌握证据用 `../../` 指到**校验根目录之外**，且那个文件内容完全合规 |
| `17-protocol-version-ahead` | `FAILED` `I12` | 档案协议版本高于工具支持版本 —— 必须拒绝，不能给假的安全感 |

### 路径类

| 用例 | 期望 | 验证什么 |
|---|---|---|
| `04-missing-doc` | `FAILED` `I3` | 🚦 的教学/回答文档指向不存在的文件 |
| `14-dead-index-link` | `FAILED` `I4` | 📚 课次索引里的回答文档是死链 |
| `15-dead-todo-evidence` | `FAILED` `I5` | ⏳ 待办的「证据入口」是死链 |
| `13-missing-section` | `FAILED` `I1` | ⏳ 待办表区块被整个删掉 —— 五个状态区块必须齐全 |

### 顺序类

| 用例 | 期望 | 验证什么 |
|---|---|---|
| `01-premature-advance` | `FAILED` `I9` | 上一课在 📊 里还是「⏳ 待作答」，却已推进到下一课 |

### ★ 最容易漏的一条 ★

| 用例 | 期望 | 验证什么 |
|---|---|---|
| `08-blank-marker-in-progress` | `PASSED` | **已开课的档案在更新日志里提到「尚未开始」**。旧实现只按关键词判空模板 → 把真实档案判成 `BLANK` → **静默跳过全部检查**。这是「假阴性」里最危险的一种：看起来全绿，实际什么都没查 |

---

## 加一个用例

1. 复制一个现有用例目录，改名成 `NN-<你在防的错>`。
2. 改 `我的学习/00-学习档案.md`（以及它引用的文件），**故意制造那一个错误**。
3. 写 `expected.json`：`invariants` 填期望命中的编号（口径见 [`../协议/04_状态机.md`](../协议/04_状态机.md) 第 4 节）；
   **把其余编号全部填进 `forbiddenInvariants`**，防止过度报错混过测试。
4. 跑：

```bash
node _tools/validate-state.mjs --fixtures tests/fixtures
```

**红 → 绿**：先让用例失败（说明校验器还抓不到），再改 `_tools/validate-state.mjs` 让它通过。
