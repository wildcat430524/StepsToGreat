// Routing-contract regression.
//
// Purpose: the protocol entry used to duplicate rule text and force every new
// session through the full onboarding + protocol read. That cost input tokens
// on every turn, including ordinary Q&A. These checks fail when that behaviour
// comes back:
//   - the Q&A / hint / formal-submission split disappears or is weakened;
//   - the entry re-absorbs action-specific schemas that belong in 协议/;
//   - generated client pointers tell agents to read everything up front;
//   - the single-source detail (correction template, final-review table) is
//     deleted instead of kept in the protocol;
//   - the entry grows back over the default-injection budget.
// They do not pin prose beyond those contract points.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const bytes = (rel) => readFileSync(join(ROOT, rel)).length;

const entryZh = read('AGENTS.md');
const entryEn = read('AGENTS.en.md');
const protocolZh = read('协议/00_导师协议.md');
const protocolEn = read('协议/00_导师协议.en.md');
const introZh = read('协议/05_对话导入.md');
const introEn = read('协议/05_对话导入.en.md');
const progressZh = read('协议/06_小目标进度.md');
const progressEn = read('协议/06_小目标进度.en.md');
const filing = read('协议/03_落档事件表.md');
const setup = read('_tools/setup-agents.mjs');

// A budget, not a target. The 2026-11-15 baseline before this change was
// 16,543 bytes (zh) and 19,121 bytes (en), both above these caps; the change
// brings them to 13,418 / 16,498. Headroom is left for genuine additions;
// raise a cap only with a measured reason, never to let duplicated detail back in.
const ENTRY_BUDGET_BYTES = { zh: 15_000, en: 18_000 };
const PROTOCOL_DETAIL_MARKERS = [
  's2g-goal-view',
  'viewBox="0 0 200 20"',
  '| 题号 | 概念理解 | 逻辑正确 | 规范表达 | 结论 |',
  '## 1️⃣ 问题',
];

test('entry keeps the Q&A / hint / formal-submission routing contract', () => {
  for (const [lang, text, required] of [
    ['zh', entryZh, ['具体问题直答', '不判三维', '正式提交', '重读', '提示', '解释']],
    ['en', entryEn, ['Answer the question directly', 'Do not grade', 'Formal submission', 'Re-read', 'hint', 'explain']],
  ]) {
    for (const token of required) {
      assert.ok(text.includes(token), `${lang} entry lost routing token: ${token}`);
    }
    assert.match(text, /不判三维|Do not grade/, `${lang} entry must forbid grading ordinary Q&A`);
  }
});

test('entry no longer forces a full onboarding/protocol read on every turn', () => {
  assert.ok(!entryZh.includes('完整阅读'), 'zh entry must not demand fully reading a large file');
  assert.ok(!entryZh.includes('按顺序做，不许跳'), 'zh entry must not restore the rigid onboarding order');
  assert.match(entryZh, /不默认走完整流程/, 'zh entry must forbid defaulting to the full flow');

  assert.ok(!entryEn.includes('read it fully'), 'en entry must not demand fully reading a large file');
  assert.ok(!entryEn.includes('go back to the root and read it fully'), 'en entry must not restore the rigid onboarding order');
  assert.match(entryEn, /do \*\*not\*\* default to the full onboarding flow/i, 'en entry must forbid defaulting to the full flow');
});

test('entry does not duplicate action-specific formats kept in protocols', () => {
  for (const marker of PROTOCOL_DETAIL_MARKERS) {
    assert.ok(!entryZh.includes(marker), `zh entry re-absorbed protocol detail: ${marker}`);
    assert.ok(!entryEn.includes(marker), `en entry re-absorbed protocol detail: ${marker}`);
  }
});

test('protocols still hold the single detailed source for correction and final review', () => {
  assert.ok(protocolZh.includes('## 5. 代改协议'), 'zh protocol lost its correction section');
  assert.ok(protocolZh.includes('## 1️⃣ 问题'), 'zh protocol lost the three-part correction template');
  assert.ok(protocolEn.includes('## 1️⃣ 问题') || protocolEn.includes('three-part'), 'en protocol lost the correction template');
  assert.ok(filing.includes('| 题号 | 概念理解 | 逻辑正确 | 规范表达 | 结论 |'), 'filing table lost the final-review schema');
  assert.ok(protocolZh.includes('### 0.1 先分流'), 'zh protocol lost the routing preface');
  assert.ok(protocolEn.includes('### 0.1 Route the message first'), 'en protocol lost the routing preface');
  assert.match(protocolZh, /普通答疑、提示和解释不触发三维评估，也不落档/, 'zh protocol must keep Q&A out of grading and filing');
  assert.match(protocolEn, /Ordinary Q&A, hints and explanations never trigger the three dimensions and are never filed/, 'en protocol must keep Q&A out of grading and filing');
});

test('two-layer progress view is scoped to block starts and real state changes', () => {
  assert.match(introZh, /开始新块时|普通答疑、要提示或追问解释时不展示这套视图/);
  assert.match(introEn, /Starting a new block|ordinary Q&A, a hint or a clarification request do not render this view/);
  assert.match(progressZh, /不是每轮都要出现/);
  assert.match(progressEn, /not needed every round/);
});

test('entry still carries the non-negotiable teaching gates', () => {
  for (const [lang, text, required] of [
    ['zh', entryZh, ['1–3 题', '三维', '重读', '费曼', '资料/索引.md', '追加', '我的规则.md']],
    ['en', entryEn, ['1–3 questions', 'three dimensions', 're-read', 'Feynman', '资料/索引.md', 'append', '我的规则.md']],
  ]) {
    for (const token of required) {
      assert.ok(text.includes(token), `${lang} entry lost required teaching gate: ${token}`);
    }
  }
});

test('default-injected entry stays within the measured input budget', () => {
  for (const [lang, rel] of [['zh', 'AGENTS.md'], ['en', 'AGENTS.en.md']]) {
    const size = bytes(rel);
    assert.ok(size <= ENTRY_BUDGET_BYTES[lang],
      `${rel} is ${size} bytes, over the ${ENTRY_BUDGET_BYTES[lang]}-byte default-injection budget`);
  }
});

test('every generated client pointer routes instead of demanding a full read', () => {
  const targetsBlock = setup.split('const TARGETS = [')[1]?.split(/\n\];/)[0] ?? '';
  // The AGENTS.md truth entry carries `skip: true`; only real pointers are generated.
  const entries = targetsBlock.split(/\n\s*\},/);
  const paths = [];
  for (const entry of entries) {
    if (/skip:\s*true/.test(entry)) continue;
    const m = /path:\s*'([^']+)'/.exec(entry);
    if (m) paths.push(m[1]);
  }
  assert.ok(paths.length >= 20, `pointer target list unexpectedly small: ${paths.length}`);
  for (const rel of paths) {
    const text = read(rel);
    assert.ok(!text.includes('完整阅读'), `${rel} tells the agent to read files in full`);
    assert.ok(text.includes('先判断学生这条消息要做什么'), `${rel} is missing the routing instruction`);
    assert.ok(text.includes('不要') && text.includes('预读'), `${rel} is missing the do-not-pre-read instruction`);
  }
});
