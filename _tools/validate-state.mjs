#!/usr/bin/env node
/**
 * validate-state.mjs —— 学习状态校验器
 *
 * 查什么：`我的学习/00-学习档案.md` 的三处状态（🚦 交接 / 📊 掌握 / ⏳ 待办）
 * 是否**自洽**、**有证据**、**没提前推进**。
 *
 * 判定口径 = `协议/04_状态机.md` 第 4 节的 10 条不变式（I1–I10）。
 * 工具只校验「自洽性与证据」，不校验「教学质量」（见状态机第 6 节边界）。
 *
 * 用法：
 *   node _tools/validate-state.mjs                        # 校验本仓库 我的学习/
 *   node _tools/validate-state.mjs --root <目录>           # 校验任意学习目录
 *   node _tools/validate-state.mjs --fixtures tests/fixtures  # 跑回归测试集
 *   node _tools/validate-state.mjs --json                 # 机器可读输出
 *   node _tools/validate-state.mjs --quiet                # 只输出问题
 *
 * 退出码：0 = 全过 / 1 = 违反不变式 / 2 = 用法错误或读不到档案
 *
 * 纪律：本脚本**只读**，绝不写任何文件。
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, resolve, sep, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..');

/** 本工具能安全校验的最高协议版本（I12 版本握手）。
 *  档案声明的版本高于它 → 报错（工具不认识新口径，不能假装校验通过）。
 *  低于它 → 只给提示，不阻塞（旧档案照常可用，升级步骤见 docs/UPGRADE.md）。 */
const SUPPORTED_PROTOCOL_VERSION = 1;

// ── 参数 ─────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const QUIET = argv.includes('--quiet');
const JSON_OUT = argv.includes('--json');

function argValue(name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

const FIXTURES = argValue('--fixtures');
const ROOT = argValue('--root');

if (argv.includes('--help') || argv.includes('-h')) {
  console.log(`用法：
  node _tools/validate-state.mjs                          校验本仓库 我的学习/
  node _tools/validate-state.mjs --root <目录>             校验任意学习目录
  node _tools/validate-state.mjs --fixtures <目录>         跑回归测试集
  node _tools/validate-state.mjs --json                   机器可读输出
  node _tools/validate-state.mjs --quiet                  只输出问题

判定口径见 协议/04_状态机.md 第 4 节（不变式 I1–I10）。`);
  process.exit(0);
}

// ── 学习档案解析 ─────────────────────────────────────────────

const PROFILE_REL = join('我的学习', '00-学习档案.md');

/** 空模板标记：出现即视为尚未开始（I2）
 *  只认「尚未开始」。
 *  ⚠️ 光有标记还不够 —— 「尚未开始」在**已开课的档案**里也可能被合法提到
 *  （更新日志、备注、历史区都会写「X 尚未开始」）。
 *  只按关键词判定，会让一份真实档案被误判成空模板，从而**静默跳过全部检查**。
 *  所以 isBlank 还要求：🚦 / 📊 / 📚 三处状态区**都还没填真实值**（见 detectBlank）。
 */
const BLANK_MARKERS = ['尚未开始'];

/** 空模板的结构判据：这三个状态区都必须仍是占位/未填。
 *  只要有一处填了真实值（学科名、课次、路径、掌握行），就不是空模板。 */
function detectBlank(p) {
  if (!BLANK_MARKERS.some((m) => p.raw.includes(m))) return false;

  // 📋 学生信息：当前学科 / 目标 仍然是占位
  const subject = tableValue(p.info, '当前学科');
  const goal = tableValue(p.info, '目标');
  const infoFilled = !isPlaceholder(subject) || !isPlaceholder(goal);

  // 🚦 交接状态：当前学科 / 当前课次 / 教学文档 / 回答文档 任一填了真值
  const handoffFilled = ['当前学科', '当前课次', '教学文档', '回答文档']
    .map((k) => tableValue(p.handoff, k))
    .some((v) => !isPlaceholder(v));

  // 📊 掌握表：有没有非占位的知识点行
  const masteryRows = parseTable(p.mastery).rows
    .filter((r) => !isPlaceholder(r[0] || '')).length > 0;

  // 📚 课次索引：有没有形如 #N 的真实课次行
  const indexRows = /^\s*\|\s*`?#\d+/m.test(p.index);

  return !(infoFilled || handoffFilled || masteryRows || indexRows);
}

/** 占位符：字段值等于这些时视为「没填」 */
const PLACEHOLDER_VALUES = new Set([
  '', '—', '-', '--', '<路径>', '<学科名>', '<课名>', '<yyyy-mm-dd>',
  '<知识点>', '<填>', '<事项>', '（尚未开始）', '（暂无）', '（尚未进行）',
]);

function isPlaceholder(v) {
  if (v === undefined || v === null) return true;
  const t = String(v).trim();
  if (PLACEHOLDER_VALUES.has(t)) return true;
  // 「—」或「–」开头 = 占位约定（常见写法：`—（#2 尚未发布）`、`— 不适用`）。
  // 破折号开头在语义上就是「不填/不适用」，不应当作路径去解析。
  if (/^[—–-]/.test(t)) return true;
  if (/^`.+`$/.test(t) && /^`<[^>]*>`$/.test(t)) return true; // `<xxx>`
  if (/^<.*>$/.test(t)) return true;
  return false;
}

/** 去掉 markdown 装饰与反引号，取出裸值 */
function clean(v) {
  if (v === undefined) return '';
  return String(v)
    .replace(/`/g, '')
    .replace(/\*\*/g, '')
    .trim();
}

/** 从「| **key** | value |」形态的表行里取值 */
function tableValue(block, key) {
  const re = new RegExp(`^\\|\\s*\\*{0,2}${key}\\*{0,2}\\s*\\|\\s*(.*?)\\s*\\|\\s*$`, 'm');
  const m = re.exec(block);
  return m ? clean(m[1]) : undefined;
}

/** 切出某个二级标题下的正文（到下一个同级/更高级标题为止） */
function section(text, headingRe) {
  const lines = text.split('\n');
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (headingRe.test(lines[i])) { start = i + 1; break; }
  }
  if (start < 0) return '';
  const out = [];
  for (let i = start; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) break;
    out.push(lines[i]);
  }
  return out.join('\n');
}

/** 提取 markdown 表格的数据行（跳过分隔行与表头） */
function tableRows(block) {
  const rows = [];
  for (const line of block.split('\n')) {
    if (!/^\s*\|/.test(line)) continue;
    if (/^\s*\|[\s:|-]+\|\s*$/.test(line)) continue; // 分隔行
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (!cells.length) continue;
    rows.push(cells);
  }
  return rows;
}

/** 把表格体切成「表头 + 数据行」——第一行是表头 */
function parseTable(block) {
  const rows = tableRows(block);
  if (!rows.length) return { header: [], rows: [] };
  return { header: rows[0], rows: rows.slice(1) };
}

// ── 校验核心 ─────────────────────────────────────────────────

function parseProfile(text) {
  const p = {
    raw: text,
    isBlank: false,
    info: section(text, /^##\s*📋/),
    handoff: section(text, /^##\s*🚦/),
    mastery: section(text, /^##\s*📊/),
    todo: section(text, /^##\s*⏳/),
    index: section(text, /^##\s*📚/),
  };
  p.isBlank = detectBlank(p);
  return p;
}

/** 严格日历校验：格式对 + 真实存在的日期（挡掉 2026-02-31 / 2026-13-01） */
function isValidDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

/** 「日期」格子容错：允许 `2026-09-03`，也允许前后带少量说明（取第一个日期串）。
 *  但取出来的那个必须通过严格日历校验。 */
function extractDate(cell) {
  const m = /(\d{4})-(\d{2})-(\d{2})/.exec(String(cell || ''));
  return m ? m[0] : undefined;
}

/** 从「1.0」「v1」「协议版本 1」这类写法里取出数字版本号 */
function extractVersion(cell) {
  const m = /(\d+(?:\.\d+)?)/.exec(String(cell || ''));
  return m ? m[1] : '';
}

/** 「最终复评结果」是否已填写（不是空占位）。
 *
 *  这是本项目最重要的一条证据（I6）。宽松判定 = 可以伪造掌握，
 *  所以这里要求**三件东西同时成立**：
 *    ① 有「复评日期」，且是真实存在的日期；
 *    ② 有「最终结论」，且不是空话（要说出结论本身）；
 *    ③ 有**有效复评表**：至少 1 个题目行，且该行的适用维度都有明确取值。
 */
function hasFinalVerdict(answerText) {
  const m = /^##\s*最终复评结果\s*$/m.exec(answerText);
  if (!m) return { filled: false, reason: '没有「最终复评结果」小节' };
  const after = answerText.slice(m.index + m[0].length);
  const next = after.search(/^##\s/m);
  const body = (next >= 0 ? after.slice(0, next) : after).trim();
  if (!body) return { filled: false, reason: '「最终复评结果」小节是空的' };
  if (/（.*由导师填写）|（待填）|<yyyy-mm-dd>/.test(body)) {
    return { filled: false, reason: '「最终复评结果」仍是占位内容' };
  }

  // ① 复评日期（容忍 **加粗** 与 `代码` 包裹）
  const dateCell = /复评日期[*`]{0,2}\s*[:：]?\s*[*`]{0,2}\s*([^\n]+)/.exec(body);
  const date = extractDate(dateCell ? dateCell[1] : '');
  if (!date) {
    return { filled: false, reason: '「最终复评结果」缺真实日期的「复评日期」' };
  }
  if (!isValidDate(date)) {
    return { filled: false, reason: `「最终复评结果」的复评日期不是真实日期 → ${date}` };
  }

  // ② 最终结论：必须真的给出结论（不能只有标题或「待确认」）
  const concl = /最终结论[*`]{0,2}\s*[:：]\s*(.+)/.exec(body);
  if (!concl) {
    return { filled: false, reason: '「最终复评结果」缺「最终结论」' };
  }
  const conclText = concl[1].replace(/[*`]/g, '').trim();
  if (!conclText || /^(待确认|待定|待填|TODO)/i.test(conclText)) {
    return { filled: false, reason: '「最终复评结果」的「最终结论」还是空话（待确认/待定）' };
  }

  // ③ 有效复评表
  const v = verdictTable(body);
  if (!v.hasRows) {
    return { filled: false, reason: '「最终复评结果」里没有复评表（或表里没有题目行）' };
  }
  if (!v.dims.length) {
    return { filled: false, reason: '复评表里找不到任何评估维度列（模板表头：概念理解/逻辑正确/规范维度）' };
  }
  return { filled: true, body };
}

/**
 * 解析复评表，返回维度列与题目行。
 *
 * 为什么要求「必须认出维度列」：
 * 旧实现认不出维度时会把中间列**全部当成维度**，于是空表、错表头都能混过 I7
 * （状态自洽性检查形同虚设）。宁可报「认不出表头」也不要放过一个假掌握。
 */
function verdictTable(body) {
  const { header, rows } = parseTable(body);
  if (!header.length) return { hasRows: false, dims: [], rows: [] };
  const dims = [];
  header.forEach((h, i) => {
    if (/概念|逻辑|规范|语法|表达|推导|表述|答题|维度|理解|计算/.test(h)) dims.push(i);
  });
  // 题目行：第 0 列看起来像题号（数字 / 第 N 题 / 问题 N）
  const dataRows = rows.filter((r) => {
    const first = (r[0] || '').trim();
    if (!first) return false;
    if (/^(题号|题|编号)$/.test(first)) return false;
    return /\d/.test(first) || /第\s*\d+\s*题/.test(first);
  });
  return { hasRows: dataRows.length > 0, dims, rows: dataRows };
}

/** 复评表里是否有非 ✅ 的适用维度 */
function verdictHasFailure(body) {
  const { dims, rows } = verdictTable(body);
  if (!rows.length) return { any: false, detail: '' };
  const bad = [];
  for (const r of rows) {
    for (const i of dims) {
      const cell = (r[i] || '').trim();
      if (!cell) continue; // 空单元格由调用方的「取值必须明确」规则处理
      if (/不适用|N\/A|^—|^-{2}/.test(cell)) continue;
      if (!cell.includes('✅')) bad.push(`${r[0] || '?'}: ${dimLabel(i)}=${cell}`);
    }
  }
  return { any: bad.length > 0, detail: bad.join(', ') };

  function dimLabel(i) {
    return `第 ${i + 1} 列`;
  }
}

/** 复评表里是否有「该填却没填」的适用维度格。
 *  I7 查的是「填了但不是 ✅」；空格式属于「没填完」，同样不能算掌握证据。 */
function verdictIncomplete(body) {
  const { dims, rows } = verdictTable(body);
  const empty = [];
  for (const r of rows) {
    for (const i of dims) {
      if (!(r[i] || '').trim()) empty.push(`${r[0] || '?'} 第 ${i + 1} 列`);
    }
  }
  return { any: empty.length > 0, detail: empty.join(', ') };
}

/**
 * I11：回答文档里「最终复评结果」/「正确答案与解析」各只能出现一次，
 * 且不得残留模板自带的空占位块。
 *
 * 为什么需要：`模板/学生回答模板.md` 末尾预置了两个占位小节。
 * 弱模型实测（GLM-5.3-Flash low）在文档中间正确写出了最终复评，
 * 但**忘了删掉模板自带的空占位块** → 同一份文档出现两份「最终复评结果」
 * （一份已填、一份说「待导师填写」）。接手的人会看到互相矛盾的两个复评区，
 * 正对应本项目最忌讳的「同一信息写多处 → 不敢确定哪份准」。
 * 现有 I6 只找第一个小节，填了就通过，**抓不到这种情况**。
 */
function checkDuplicateSections(answerText) {
  const issues = [];
  for (const name of ['最终复评结果', '正确答案与解析']) {
    const re = new RegExp(`^##\\s*${name}\\s*$`, 'gm');
    const count = (answerText.match(re) || []).length;
    if (count > 1) {
      issues.push(`「${name}」小节出现 ${count} 次（应只 1 次）`);
    }
  }
  // 残留模板占位文本
  if (/（整课所有轮次通过后由导师填写）|（评估完成后由导师填写）/.test(answerText)) {
    issues.push('残留模板占位块「（整课所有轮次通过后由导师填写）」');
  }
  return issues;
}

function validate(rootDir) {
  const problems = []; // 违反不变式（硬错误）
  const warnings = []; // 提示（不改也能跑）
  const infos = [];

  const profileAbs = join(rootDir, PROFILE_REL);
  if (!existsSync(profileAbs)) {
    return {
      status: 'SKIPPED',
      problems,
      warnings,
      infos: [`没有学习档案（${PROFILE_REL}）—— 尚未开始使用，跳过状态校验。`],
    };
  }

  // 档案里的相对链接是**相对于档案自己所在目录**写的（即 我的学习/），
  // 与 check.mjs 第 277 行的口径一致：`../协议/xx.md` → <root>/协议/xx.md
  const BASE_DIR = dirname(profileAbs);

  const text = readFileSync(profileAbs, 'utf8');
  const p = parseProfile(text);

  // ── I1：五个区块齐全 ──────────────────────────────────────
  const required = [
    ['📋 学生信息', p.info],
    ['🚦 当前交接状态', p.handoff],
    ['📊 掌握表', p.mastery],
    ['⏳ 待办表', p.todo],
    ['📚 课次索引', p.index],
  ];
  const missing = required.filter(([, body]) => !body.trim()).map(([n]) => n);
  if (missing.length) {
    problems.push(`[I1] 学习档案缺区块：${missing.join(' / ')} —— 接手时读不到状态`);
  }

  // ── I2：空模板直接跳过 ────────────────────────────────────
  if (p.isBlank) {
    infos.push('档案是空模板（含「（尚未开始）」）→ 状态 = NEW，跳过后续检查。');
    return { status: 'BLANK', problems, warnings, infos };
  }

  // ── 解析 🚦 ───────────────────────────────────────────────
  const curLessonRaw = tableValue(p.handoff, '当前课次');
  const teachDoc = tableValue(p.handoff, '教学文档');
  const answerDoc = tableValue(p.handoff, '回答文档');
  const curSubject = tableValue(p.handoff, '当前学科');

  const curLessonNum = (() => {
    const m = /#(\d+)/.exec(curLessonRaw || '');
    return m ? Number(m[1]) : undefined;
  })();

  /** 🚦 当前课次的学科前缀（多学科并行时写 `Python #2`）。
   *  没写前缀时返回 undefined —— 此时 I9 退回「全局比较」的旧口径。 */
  const curLessonSubject = (() => {
    const t = clean(curLessonRaw || '');
    const m = /#\s*\d+/.exec(t);
    if (!m) return undefined;
    const prefix = t.slice(0, m.index).replace(/[`*|\s]+/g, '').trim();
    return prefix || undefined;
  })();

  const resolveRel = (v) => {
    if (isPlaceholder(v)) return undefined;
    const cleaned = clean(v).split('#')[0].trim();
    if (!cleaned) return undefined;
    return resolveAny(cleaned);
  };

  /** 证据文件必须落在被校验的根目录内。
   *  不设这条边界时，`../../别人的档案.md` 这种路径只要真实存在就会被当成
   *  有效证据 —— 校验的是 A 目录，采信的是 B 目录的文件，完整性直接失效。 */
  const insideRoot = (abs) => {
    const r = relative(rootDir, abs);
    return r !== '' && !r.startsWith('..') && !isAbsolute(r);
  };

  /** 宽容解析：档案里的相对链接可能相对于「档案所在目录」或「项目根目录」写。
   *  两个候选依次试，都不存在则返回「相对档案目录」的那个（报错信息更好读）。
   *  越出 rootDir 的候选一律视为不存在（记录到越界清单，由 I3/I6 报出）。 */
  const escaped = [];
  const resolveAny = (rel) => {
    const a = resolve(BASE_DIR, rel);
    if (existsSync(a) && insideRoot(a)) return a;
    const b = resolve(rootDir, rel);
    if (existsSync(b) && insideRoot(b)) return b;
    if (existsSync(a) && !insideRoot(a)) escaped.push(rel);
    return a;
  };

  // ── I3：🚦 里的文档路径必须存在 ───────────────────────────
  for (const [label, val] of [['教学文档', teachDoc], ['回答文档', answerDoc]]) {
    if (val === undefined) continue;
    if (isPlaceholder(val)) {
      warnings.push(`[I3] 🚦 的 ${label} 仍是占位值「${val}」—— 若已开课，请填真实路径`);
      continue;
    }
    const abs = resolveRel(val);
    if (!abs || !existsSync(abs) || !insideRoot(abs)) {
      problems.push(`[I3] 🚦 的 ${label} 指向不存在的文件（或越出学习目录）→ ${clean(val)}`);
    }
  }

  // ── 解析 📚 课次索引 ──────────────────────────────────────
  const idxTable = parseTable(p.index);
  const idxCol = (name) => idxTable.header.findIndex((h) => h.includes(name));
  const cLesson = idxCol('课次');
  const cTopic = idxCol('知识点');
  const cTeach = idxCol('教学文档');
  const cAnswer = idxCol('回答文档');

  /** 多学科并行时，课次号必须带学科前缀（`Python #2` / `英语 #1`）——
   *  否则各学科的 #1、#2 会撞号，比较「课次大小」完全没有意义。
   *  这里把课次拆成 {subject, num}，让 I9 只在**同一学科内**比较先后。 */
  const parseLessonCell = (cell) => {
    const t = clean(cell || '');
    const numM = /#\s*(\d+)/.exec(t);
    if (!numM) return undefined;
    const subject = t.slice(0, numM.index).replace(/[`*|\s]+/g, '').trim();
    return { subject: subject || undefined, num: Number(numM[1]) };
  };

  const lessons = []; // {subject, num, topic, teach, answer}
  for (const r of idxTable.rows) {
    const parsed = parseLessonCell(r[cLesson]);
    if (!parsed) continue;
    lessons.push({
      subject: parsed.subject,
      num: parsed.num,
      topic: clean(r[cTopic] || ''),
      teach: clean(r[cTeach] || ''),
      answer: clean(r[cAnswer] || ''),
    });
  }

  /** 从单元格里抽出 markdown 链接目标。
   *  支持三种真实写法：
   *    ① 无空格：`[x](学科/Python/01_学生回答.md)`
   *    ② 含空格：`[x](<学科/我 的课/01_学生回答.md>)` 或 `[x](学科/我 的课/1.md)`
   *    ③ 带锚点/查询：`[x](a.md#最终复评结果)`
   *  旧实现用 `[^)\s]+`，遇到含空格的文件名会**只取到一半** → 误报「文件不存在」。 */
  const mdLinkTarget = (s) => {
    const m = /\[[^\]]*\]\(\s*(<[^>]*>|[^)]+?)\s*\)/.exec(s);
    if (!m) return undefined;
    let t = m[1].trim();
    if (t.startsWith('<') && t.endsWith('>')) t = t.slice(1, -1);
    return t.split('#')[0].split('?')[0].trim() || undefined;
  };

  // ── I4：📚 索引路径存在 ───────────────────────────────────
  for (const l of lessons) {
    for (const [label, raw] of [['教学文档', l.teach], ['回答文档', l.answer]]) {
      if (isPlaceholder(raw)) continue;
      const linked = mdLinkTarget(raw) || (/^\S+$/.test(raw) ? raw.split('#')[0] : undefined);
      if (!linked) {
        // 既不是链接、也不是裸路径 —— 可能只是「文档已建」之类的说明，跳过
        continue;
      }
      const target = linked;
      const abs = resolveAny(target);
      if (!existsSync(abs) || !insideRoot(abs)) {
        problems.push(`[I4] 📚 课次 #${l.num} 的${label}指向不存在的文件 → ${target}`);
      }
    }
  }

  // ── 解析 📊 掌握表 ────────────────────────────────────────
  const masTable = parseTable(p.mastery);
  const mCol = (name) => masTable.header.findIndex((h) => h.includes(name));
  const mTopic = mCol('知识点');
  const mStatus = mCol('状态');
  const mDate = mCol('评估日期');
  const mNote = mCol('备注');

  const mastery = masTable.rows
    .filter((r) => (r[mTopic] || '') && !isPlaceholder(r[mTopic]))
    .map((r) => ({
      topic: clean(r[mTopic]),
      status: clean(r[mStatus] || ''),
      date: clean(r[mDate] || ''),
      note: clean(r[mNote] || ''),
    }));

  const isMastered = (s) => /✅/.test(s) && /已掌握|掌握/.test(s);

  // 找某知识点在 📚 里对应的回答文档路径
  const answerDocFor = (topic) => {
    // 1) 优先按课次编号匹配（📊 的备注里常带 #N）
    const byNum = /#(\d+)/.exec(topic);
    if (byNum) {
      const n = Number(byNum[1]);
      // 知识点里写了学科前缀（`Python #1 …`）→ 精确匹配同学科；
      // 否则若全库只有一个该编号，也能唯一确定。
      const prefixed = lessons.filter((x) => x.num === n);
      const l = prefixed.length === 1
        ? prefixed[0]
        : prefixed.find((x) => x.subject && topic.includes(x.subject));
      if (l) return l.answer;
    }
    // 2) 按知识点名近似匹配
    const hit = lessons.find((x) => x.topic && (x.topic.includes(topic.slice(0, 6)) || topic.includes(x.topic.slice(0, 6))));
    return hit ? hit.answer : undefined;
  };

  /** 从表格单元格里取出「证据文件路径」。
   *  宽容三种真实写法：
   *    ① markdown 链接 `[x](路径)`
   *    ② 裸路径 `学科/xx/01_学生回答.md`
   *    ③ 路径 + 说明 `学科/xx/01_学生回答.md；首次 1 处概念错误…`
   *  ③ 是关键：备注列常把「证据入口」和「一句结论」写在同格里，
   *  不切开就会把整串当成路径 → 误报 I6。故按常见分隔符取第一段，
   *  且要求它像路径（含 `/` 或以 `.md` 结尾）。 */
  const linkTarget = (cell) => {
    if (!cell) return undefined;
    const m = mdLinkTarget(cell);
    const raw = m || cell.split(/[；;，,\s]/)[0];
    const cleaned = raw.split('#')[0].split('?')[0].trim();
    if (!cleaned) return undefined;
    if (!m && !/\/|\.md$/i.test(cleaned)) return undefined; // 不像路径就不当路径
    return cleaned || undefined;
  };

  // ── I6 / I7 / I8：掌握声明必须有证据 ──────────────────────
  let masteredCount = 0;
  for (const m of mastery) {
    if (!isMastered(m.status)) continue;
    masteredCount++;

    // I8：评估日期必须是真实日期（格式对 + 日历上真的存在）
    const mDateOnly = extractDate(m.date);
    if (!mDateOnly) {
      problems.push(`[I8] 📊「${m.topic}」标为已掌握，但评估日期不是真实日期 → 「${m.date}」`);
    } else if (!isValidDate(mDateOnly)) {
      problems.push(`[I8] 📊「${m.topic}」标为已掌握，但评估日期不是有效日期（日历上不存在）→ 「${mDateOnly}」`);
    }

    // I6：必须找得到回答文档，且其中「最终复评结果」已填写
    const relAnswer = linkTarget(m.note) || linkTarget(answerDocFor(m.topic) || '');
    if (!relAnswer) {
      problems.push(`[I6] 📊「${m.topic}」标为已掌握，但在 📚 索引里找不到对应的回答文档（备注需给出证据入口）`);
      continue;
    }
    const abs = resolveAny(relAnswer);
    if (!existsSync(abs) || !insideRoot(abs)) {
      problems.push(`[I6] 📊「${m.topic}」标为已掌握，但证据文件不存在（或越出学习目录）→ ${relAnswer}`);
      continue;
    }
    const answerText = readFileSync(abs, 'utf8');
    const v = hasFinalVerdict(answerText);
    if (!v.filled) {
      problems.push(`[I6] 📊「${m.topic}」标为已掌握，但 ${relAnswer} 里${v.reason} —— 掌握缺少证据`);
      continue;
    }
    // I11：重复小节 / 残留模板占位
    const dups = checkDuplicateSections(answerText);
    if (dups.length) {
      problems.push(`[I11] ${relAnswer}：${dups.join('；')} —— 同一信息写多处，接手时不敢确定哪份准`);
    }
    // I7：复评表里适用维度须全 ✅；空格子属于「没填完」，也不构成掌握证据
    const inc = verdictIncomplete(v.body);
    if (inc.any) {
      problems.push(`[I7] 📊「${m.topic}」标为已掌握，但复评表的适用维度有空白格（${inc.detail}）—— 状态自相矛盾`);
    }
    const f = verdictHasFailure(v.body);
    if (f.any) {
      problems.push(`[I7] 📊「${m.topic}」标为已掌握，但复评表里有非 ✅ 的适用维度（${f.detail}）—— 状态自相矛盾`);
    }
  }

  // ── I9：不许提前推进 ─────────────────────────────────────
  //
  // 多学科并行时**只在同一学科内**比较课次先后：`英语 #1` 与 `Python #2`
  // 之间没有「先后推进」关系，拿全局课次号比较会误报「提前推进」。
  //   · 🚦 写了学科前缀 → 只比同前缀的课
  //   · 🚦 没写前缀（单学科用法）→ 退回全局比较，兼容旧档案
  if (curLessonNum !== undefined) {
    const sameSubject = (l) => !curLessonSubject || l.subject === curLessonSubject;
    const earlier = lessons.filter((l) => sameSubject(l) && l.num < curLessonNum);
    for (const l of earlier) {
      const m = mastery.find((x) => l.topic && (x.topic.includes(l.topic.slice(0, 6)) || l.topic.includes(x.topic.slice(0, 6))));
      if (m && /⏳|待作答|未作答/.test(m.status)) {
        const label = l.subject ? `${l.subject} #${l.num}` : `#${l.num}`;
        problems.push(
          `[I9] 提前推进：🚦 已在 #${curLessonNum}，但 📚 的 ${label}「${l.topic}」在 📊 里仍是「${m.status}」`,
        );
      }
    }
    // 当前课的编号必须出现在 📚 索引里（同前缀下匹配）
    if (!lessons.some((l) => sameSubject(l) && l.num === curLessonNum)) {
      const label = curLessonSubject ? `${curLessonSubject} #${curLessonNum}` : `#${curLessonNum}`;
      warnings.push(`[I9] 🚦 当前课次 ${label} 没有出现在 📚 课次索引里`);
    }
  }

  // ── I5：⏳ 待办表的证据入口存在 ───────────────────────────
  const todoTable = parseTable(p.todo);
  const tCol = (name) => todoTable.header.findIndex((h) => h.includes(name));
  const tItem = tCol('事项');
  const tEvidence = tCol('证据入口');
  for (const r of todoTable.rows) {
    const item = clean(r[tItem] || '');
    const ev = clean(r[tEvidence] || '');
    if (isPlaceholder(item)) continue;
    if (isPlaceholder(ev)) continue;
    const target = linkTarget(ev);
    if (!target) continue;
    const abs = resolveAny(target);
    if (!existsSync(abs) || !insideRoot(abs)) {
      problems.push(`[I5] ⏳ 待办「${item}」的证据入口指向不存在的文件 → ${target}`);
    }
  }

  // ── I10：待办表不得重复「当前正在上的课」 ─────────────────
  //
  // 只看「证据入口同时包含教学文档 + 回答文档」是不够的：真实写法还有
  //   · 只写回答文档那一个路径
  //   · 只写课名/课次（`#2 循环语句`）
  // 这些都等价于把「当前课」重复了一遍，同样会让接手的导师不确定以哪份为准。
  if (curLessonRaw && !isPlaceholder(curLessonRaw)) {
    const curTopic = clean(curLessonRaw).replace(/^#\d+\s*/, '').trim();
    const curPaths = [clean(teachDoc || ''), clean(answerDoc || '')]
      .filter((v) => v && !isPlaceholder(v))
      .map((v) => v.replace(/[`*]/g, '').trim());

    const repeatsCurrentLesson = (row) => {
      const ev = clean(row[tEvidence] || '');
      const item = clean(row[tItem] || '');
      // a) 复习/重讲语义优先豁免：
      //    「间隔复习 #1」「费曼重讲：X」的证据入口**本来就会指向当前课的回答文档**，
      //    这是挂在待办里的正常事项，不是「把当前正在上的课重复写了一遍」。
      if (/复习|回顾|重讲|重做|复评|费曼|加固|回炉/.test(item + ev)) return false;
      // b) 证据入口命中当前课的任一文档路径 —— 最强信号，一定算重复
      for (const cp of curPaths) {
        if (cp && ev.includes(cp)) return true;
      }
      // c) 提到当前课次/课名
      if (curLessonNum !== undefined && new RegExp(`#\\s*0*${curLessonNum}(?!\\d)`).test(ev || item)) return true;
      if (curTopic.length >= 2) {
        const short = curTopic.slice(0, 6);
        if (ev.includes(short) || item.includes(short)) return true;
      }
      return false;
    };

    for (const r of todoTable.rows) {
      const item = clean(r[tItem] || '');
      if (!item || isPlaceholder(item)) continue;
      if (repeatsCurrentLesson(r)) {
        problems.push(`[I10] ⏳ 待办表重复了「当前正在上的课」（${item}）—— 状态应只在 🚦 维护`);
      }
    }
  }

  // ── I12：协议版本握手 ────────────────────────────────────
  // 档案声明自己按哪个版本的协议写的。工具只认识 SUPPORTED_PROTOCOL_VERSION，
  // 遇到更高的版本必须**明确报错**，而不是继续用旧口径校验（那会给出假的安全感）。
  const pvRaw = tableValue(p.info, '协议版本') || tableValue(p.handoff, '协议版本');
  if (pvRaw && !isPlaceholder(pvRaw)) {
    const pv = Number(extractVersion(pvRaw));
    if (Number.isFinite(pv)) {
      if (pv > SUPPORTED_PROTOCOL_VERSION) {
        problems.push(
          `[I12] 档案协议版本 ${pv} 高于本工具支持的 ${SUPPORTED_PROTOCOL_VERSION} `
          + '—— 请更新 _tools（git pull），不要用旧校验器判定新档案',
        );
      } else if (pv < SUPPORTED_PROTOCOL_VERSION) {
        warnings.push(
          `[I12] 档案协议版本 ${pv} 低于当前 ${SUPPORTED_PROTOCOL_VERSION} `
          + '—— 迁移步骤见 docs/UPGRADE.md（旧档案仍可用）',
        );
      }
    }
  } else {
    infos.push(`[I12] 档案未声明「协议版本」—— 视为 ${SUPPORTED_PROTOCOL_VERSION}（模板已含该行，可顺手补上）`);
  }

  return {
    status: problems.length ? 'FAILED' : 'PASSED',
    subject: curSubject,
    currentLesson: curLessonRaw,
    masteredCount,
    problems,
    warnings,
    infos,
  };
}

// ── 回归测试集模式 ───────────────────────────────────────────

function runFixtures(dir) {
  if (!existsSync(dir)) {
    console.error(`❌ 找不到测试集目录：${dir}`);
    process.exit(2);
  }
  const cases = [];
  for (const name of readdirSync(dir)) {
    const caseDir = join(dir, name);
    if (!statSync(caseDir).isDirectory()) continue;
    const expectPath = join(caseDir, 'expected.json');
    if (!existsSync(expectPath)) continue;
    cases.push({ name, caseDir, expect: JSON.parse(readFileSync(expectPath, 'utf8')) });
  }
  if (!cases.length) {
    console.error(`❌ ${dir} 下没有找到任何带 expected.json 的用例`);
    process.exit(2);
  }

  const results = [];
  let failed = 0;
  for (const c of cases) {
    const r = validate(c.caseDir);
    const actualStatus = r.status;
    const wantStatus = c.expect.status;
    const statusOk = actualStatus === wantStatus;

    // 期望命中的不变式（如 ["I6","I7"]）必须都出现在报错里
    const wantIds = c.expect.invariants || [];
    const hitIds = new Set();
    for (const msg of r.problems) {
      const m = /^\[(I\d+)\]/.exec(msg);
      if (m) hitIds.add(m[1]);
    }
    const missingIds = wantIds.filter((id) => !hitIds.has(id));

    // 不期望出现的不变式必须**不**出现 —— 没有这条，校验器「过度报错」
    // （顺手报一堆无关错误）也会让用例变绿，测试就失去了意义。
    const forbidIds = c.expect.forbiddenInvariants || [];
    const extraIds = forbidIds.filter((id) => hitIds.has(id));

    // 期望的错误条数（可选，用于「只应报 1 条」这类强断言）
    const exactCount = c.expect.problemCount;
    const countOk = exactCount === undefined || r.problems.length === exactCount;

    const ok = statusOk && missingIds.length === 0 && extraIds.length === 0 && countOk;
    if (!ok) failed++;
    results.push({
      name: c.name, ok, actualStatus, wantStatus, missingIds, extraIds, wantIds, exactCount,
      actualCount: r.problems.length, problems: r.problems,
    });
  }

  console.log('');
  console.log(`🧪 状态校验回归测试：${cases.length} 个用例`);
  for (const r of results) {
    const mark = r.ok ? '✅' : '❌';
    console.log(`   ${mark} ${r.name}  （期望 ${r.wantStatus} / 实际 ${r.actualStatus}）`);
    if (!r.ok) {
      if (r.missingIds.length) console.log(`        未命中不变式：${r.missingIds.join(', ')}`);
      if (r.extraIds.length) console.log(`        不应出现的多余报错：${r.extraIds.join(', ')}（过度报错）`);
      if (r.exactCount !== undefined && r.exactCount !== r.actualCount) {
        console.log(`        报错条数：期望 ${r.exactCount}，实际 ${r.actualCount}`);
      }
      for (const p of r.problems) console.log(`        · ${p}`);
    }
  }
  console.log('');
  if (failed) {
    console.log(`❌ ${failed}/${cases.length} 个用例未通过。`);
    process.exit(1);
  }
  console.log(`✅ ${cases.length} 个用例全部通过。`);
  console.log('');
  process.exit(0);
}

// ── 主流程 ───────────────────────────────────────────────────

if (FIXTURES) runFixtures(resolve(process.cwd(), FIXTURES));

const targetRoot = ROOT ? resolve(process.cwd(), ROOT) : REPO_ROOT;
const result = validate(targetRoot);

if (JSON_OUT) {
  console.log(JSON.stringify({ root: targetRoot, ...result }, null, 2));
  process.exit(result.status === 'FAILED' ? 1 : 0);
}

if (!QUIET) {
  console.log('');
  console.log(`🔍 状态校验：${relative(process.cwd(), join(targetRoot, PROFILE_REL)) || PROFILE_REL}`);
}

if (result.status === 'SKIPPED') {
  console.log('ℹ️  没有学习档案 —— 跳过（尚未开始使用）。');
  console.log('');
  process.exit(0);
}

if (!QUIET) {
  if (result.status === 'BLANK') {
    console.log('   状态：NEW（空模板）');
  } else {
    console.log(`   状态：${result.status}  |  学科：${result.subject || '—'}  |  当前课次：${result.currentLesson || '—'}`);
    console.log(`   已掌握知识点：${result.masteredCount}`);
  }
  for (const i of result.infos) console.log(`   ℹ️  ${i}`);
}

if (result.warnings.length) {
  console.log(`\n⚠️  提示 ${result.warnings.length} 条：`);
  for (const w of result.warnings) console.log(`   - ${w}`);
}

if (result.problems.length) {
  console.log(`\n❌ 违反不变式 ${result.problems.length} 条（口径见 协议/04_状态机.md 第 4 节）：`);
  for (const p of result.problems) console.log(`   - ${p}`);
  console.log('');
  process.exit(1);
}

if (!QUIET) {
  if (result.status === 'BLANK') {
    console.log('✅ 空模板无需校验。开课后请重跑本命令。');
  } else {
    console.log('✅ 状态自洽：路径存在、掌握有证据、无提前推进。');
  }
  console.log('');
}
process.exit(0);
