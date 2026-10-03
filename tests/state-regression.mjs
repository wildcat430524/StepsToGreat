#!/usr/bin/env node
/**
 * regression-state.mjs —— 状态校验器的回归测试（把弱模型实测抓到的缺陷钉住）
 *
 * 为什么不满足于「跑一次真工作区看看」：
 *   本文件的每个用例都是**弱模型真实踩出来的坑**的精简复现。
 *   有了它们，改动 validate-state.mjs 后能立刻知道有没有把已修的缺陷放回去。
 *
 * 用例一览（每个用例 = 一段造出来的档案/回答文档 + 期望的判定）：
 *   T1  I11 时序缺口：回答文档有重复小节，但 📊 是「⏳ 待作答」
 *       → 必须 FAILED（曾经 PASSED —— I11 被写在 isMastered 循环内，只有已掌握的课才查）
 *   T2  I11 基本盘：📊 标已掌握 + 重复小节 → 必须 FAILED
 *   T3  I6 备注写法：备注写 `证据：`<路径>.md`「最终复评结果」（说明）`
 *       → 必须 PASSED（必须能把路径从说明文字里抠出来；曾经误报「证据文件不存在」）
 *   T4  干净通过：合规档案 + 唯一复评区 → 必须 PASSED
 *   T5  空模板 → 必须判「空模板」（不误判为失败）
 *
 * 用法：
 *   node tests/regression-state.mjs            # 全跑
 *   node tests/regression-state.mjs --json     # 机器可读
 *   VALIDATOR_UNDER_TEST=<路径> node tests/regression-state.mjs   # 指定被测校验器
 *
 * 退出码：0 = 全部符合预期 / 1 = 有用例不符合预期
 */

import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const VALIDATOR = process.env.VALIDATOR_UNDER_TEST || join(ROOT, '_tools', 'validate-state.mjs');
const JSON_OUT = process.argv.includes('--json');
const TMP = join(HERE, '.tmp-regression');

const LESSON_REL = '我的学习/学科/Python/01-变量/01_学生回答.md';
const TEACH_REL = '我的学习/学科/Python/01-变量/01_教学引导.md';

/** 合规的回答文档：唯一复评区 + 三段式 */
const ANSWER_CLEAN = [
  '# Python | 01_学生回答',
  '',
  '## 主题：变量',
  '',
  '## 第一轮 · 问题 1',
  '**你的回答：**',
  '',
  '```',
  'x = 1',
  '```',
  '',
  '---',
  '',
  '## 最终复评结果',
  '',
  '**复评日期**：2026-09-22',
  '',
  '| 题号 | 概念理解 | 逻辑正确 | 语法可编译 | 结论 |',
  '|------|----------|----------|----------|------|',
  '| 1 | ✅ | ✅ | ✅ | 通过 |',
  '',
  '**最终结论**：变量已掌握。',
  '',
  '---',
  '',
  '## 正确答案与解析',
  '',
  '### 问题 1',
  '**你的原答案**：把 `x = 1` 写成了 `x == 1`',
  '**问题在哪里**：`==` 是比较，`=` 才是赋值，会得到布尔值而不是存下数字。',
  '**我改成**：`x = 1`',
  '',
].join('\n');

/** 重复小节 + 残留占位 —— I11 要拦的东西 */
const ANSWER_DUP = [
  ANSWER_CLEAN,
  '---',
  '',
  '## 最终复评结果',
  '（整课所有轮次通过后由导师填写）',
  '',
  '---',
  '',
  '## 正确答案与解析',
  '（评估完成后由导师填写）',
  '',
].join('\n');

/** 空模板档案（含「（尚未开始）」，校验器应判 NEW） */
const PROFILE_BLANK = [
  '# 00_学习档案（Learning Profile）',
  '',
  '## 📋 学生信息',
  '',
  '| 项目 | 内容 |',
  '|------|------|',
  '| **学习开始日期** | （尚未开始） |',
  '| **当前学科** | （尚未开始） |',
  '| **使用的学科包** | （尚未开始） |',
  '| **先前基础** | （尚未开始） |',
  '| **学习方式** | （尚未开始） |',
  '| **目标** | （尚未开始） |',
  '| **每天可投入** | （尚未开始） |',
  '',
  '## 🚦 当前交接状态',
  '',
  '| 项目 | 当前状态 |',
  '|------|----------|',
  '| **当前学科** | （尚未开始） |',
  '| **当前课次** | （尚未开始） |',
  '| **最近完成** | （尚未开始） |',
  '| **教学文档** | （尚未开始） |',
  '| **回答文档** | （尚未开始） |',
  '| **当前进度** | （尚未开始） |',
  '| **接手后的第一步** | （尚未开始） |',
  '| **推进条件** | （尚未开始） |',
  '',
  '## 📊 知识点掌握情况（权威掌握表）',
  '',
  '| 知识点 | 状态 | 评估日期 | 备注 |',
  '|--------|------|----------|------|',
  '| <知识点> | ⏳ 待作答 | <yyyy-mm-dd> | <文档已建，答案为空> |',
  '',
  '## ⏳ 待办：复评与复习（唯一待办表）',
  '',
  '| 事项 | 触发条件 | 安排 | 证据入口 | 状态 |',
  '|------|----------|------|----------|------|',
  '| <事项> | <为什么挂起> | <什么时候做> | <路径> | ⚠️ 挂起（不阻塞主线） |',
  '',
  '## 📚 课次 ↔ 文档索引',
  '',
  '| 课次 | 知识点 | 教学文档 | 回答文档 |',
  '|------|--------|----------|----------|',
  '| #1 | <知识点> | <路径> | <路径> |',
  '',
].join('\n');

/**
 * 造一份「已开课」的档案。
 * - status/note 控制 📊 那一行
 * - teach/answerDoc 覆盖 🚦 的路径写法（测「待建」这类自述）
 * - indexLesson=false 表示 📚 里不登记课次（摸底阶段就是这样：课还没排出来）
 */
function profile({ status, note, teach = TEACH_REL, answerDoc = LESSON_REL, indexLesson = true }) {
  return [
    '# 00_学习档案（Learning Profile）',
    '',
    '## 📋 学生信息',
    '',
    '| 项目 | 内容 |',
    '|------|------|',
    '| **学习开始日期** | 2026-09-22 |',
    '| **当前学科** | Python |',
    '| **使用的学科包** | 编程.md |',
    '| **先前基础** | 零基础 |',
    '| **学习方式** | Socratic 引导 + 掌握学习法 |',
    '| **目标** | 处理 Excel |',
    '| **每天可投入** | 30 分钟 |',
    '',
    '## 🚦 当前交接状态',
    '',
    '| 项目 | 当前状态 |',
    '|------|----------|',
    '| **当前学科** | Python |',
    '| **当前课次** | #1 变量 |',
    '| **最近完成** | — |',
    `| **教学文档** | ${teach} |`,
    `| **回答文档** | ${answerDoc} |`,
    '| **当前进度** | 已通过 |',
    '| **接手后的第一步** | 发下一课 |',
    '| **推进条件** | 三维全通过 |',
    '',
    '## 📊 知识点掌握情况（权威掌握表）',
    '',
    '| 知识点 | 状态 | 评估日期 | 备注 |',
    '|--------|------|----------|------|',
    `| 变量与 print | ${status} | 2026-09-22 | ${note} |`,
    '',
    '## ⏳ 待办：复评与复习（唯一待办表）',
    '',
    '| 事项 | 触发条件 | 安排 | 证据入口 | 状态 |',
    '|------|----------|------|----------|------|',
    '| — | — | — | — | — |',
    '',
    '## 📚 课次 ↔ 文档索引',
    '',
    '| 课次 | 知识点 | 教学文档 | 回答文档 |',
    '|------|--------|----------|----------|',
    ...(indexLesson ? [`| #1 | 变量与 print | ${TEACH_REL} | ${LESSON_REL} |`] : []),
    '',
  ].join('\n');
}

const CASES = [
  {
    id: 'T1',
    name: 'I11 时序缺口：重复小节 + 📊 仍是「⏳ 待作答」→ 必须 FAILED',
    why: '曾经 PASSED —— I11 写在 isMastered 循环内，未标已掌握的课从不检查',
    answer: ANSWER_DUP,
    profile: profile({ status: '⏳ 待作答', note: '文档已建，答案为空' }),
    expect: /FAILED/,
    expectMention: /\[I11\]/,
  },
  {
    id: 'T2',
    name: 'I11 基本盘：重复小节 + 📊 已掌握 → 必须 FAILED',
    why: '上游那次弱模型测试就是这个失误（写了两份互相矛盾的复评区）',
    answer: ANSWER_DUP,
    profile: profile({ status: '✅ 已掌握', note: LESSON_REL }),
    expect: /FAILED/,
    expectMention: /\[I11\]/,
  },
  {
    id: 'T3',
    name: 'I6 备注写法：带标签 + 反引号 + 后缀说明 → 必须 PASSED',
    why: '弱模型就是这样写备注的，曾被误报「证据文件不存在」',
    answer: ANSWER_CLEAN,
    profile: profile({
      status: '✅ 已掌握',
      note: '证据：`' + LESSON_REL + '`「最终复评结果」（2 处代改 + 1 次追问换 2 角度讲通）',
    }),
    expect: /PASSED/,
  },
  {
    id: 'T4',
    name: '干净通过：合规档案 + 唯一复评区 → 必须 PASSED',
    why: '基本盘：修复不能把正常情况判失败',
    answer: ANSWER_CLEAN,
    profile: profile({ status: '✅ 已掌握', note: LESSON_REL }),
    expect: /PASSED/,
  },
  {
    id: 'T5',
    name: '空模板 → 必须判「空模板」（不误判为失败）',
    why: '还没开始使用不该被判失败',
    answer: undefined,
    profile: PROFILE_BLANK,
    expect: /状态：NEW（空模板）|BLANK/,
  },
  {
    id: 'T6',
    name: '🚦 自述「待建/待发布」→ 必须是提示，不是失败',
    why: '弱模型诚实标注「文件还没建」，曾被判 I3「指向不存在的文件」—— 等于惩罚诚实',
    answer: undefined,
    profile: profile({
      status: '⏳ 待作答',
      note: '文档已建，答案为空',
      teach: '待发布（摸底通过后建 我的学习/学科/Python/01-变量/01_教学引导.md）',
      answerDoc: '我的学习/学科/Python/01-变量/01_学生回答.md（待建，学生作答后创建）',
      indexLesson: false, // 摸底阶段 📚 里还没有课次，这才是真实形态
    }),
    expect: /状态：PASSED/,
    // 同时必须给出提示，不能默默放行
    expectMention: /仍是占位值/,
  },
  {
    id: 'T7',
    name: '🚦 写了个不存在的路径但不自称「待建」→ 必须 FAILED',
    why: '放宽「待建」不能把真正忘填/写错路径的情形一起放过（防过度放宽）',
    answer: ANSWER_CLEAN,
    profile: profile({
      status: '✅ 已掌握',
      note: LESSON_REL,
      answerDoc: '我的学习/学科/Python/01-变量/根本不存在.md',
    }),
    expect: /FAILED/,
    expectMention: /\[I3\]/,
  },
];

function setup(testCase) {
  rmSync(TMP, { recursive: true, force: true });
  const lessonDir = join(TMP, '我的学习', '学科', 'Python', '01-变量');
  mkdirSync(lessonDir, { recursive: true });
  writeFileSync(join(TMP, '我的学习', '00-学习档案.md'), testCase.profile, 'utf8');
  writeFileSync(join(lessonDir, '01_教学引导.md'), '# 01 变量\n\n概念…\n', 'utf8');
  if (testCase.answer !== undefined) {
    writeFileSync(join(lessonDir, '01_学生回答.md'), testCase.answer, 'utf8');
  }
}

const results = [];
CASES.push({
  id: 'T8', name: '高于支持的协议版本必须拒绝',
  why: '镜像新协议不能让旧工具静默放行', answer: ANSWER_CLEAN,
  profile: profile({ status: '✅ 已掌握', note: LESSON_REL }).replace('## 🚦', '| **协议版本** | 2 |\n\n## 🚦'),
  expect: /FAILED/, expectMention: /\[I12\]/,
});
CASES.push({
  id: 'T9', name: '路径名称含 pending 仍必须检查文件是否存在',
  why: '待建说明不能把包含相同单词的普通文件路径当成占位', answer: ANSWER_CLEAN,
  profile: profile({ status: '✅ 已掌握', note: LESSON_REL,
    answerDoc: '我的学习/学科/Python/01-变量/pending-missing.md' }),
  expect: /FAILED/, expectMention: /\[I3\]/,
});
for (const c of CASES) {
  setup(c);
  let out = '';
  let code = 0;
  try {
    out = execFileSync(process.execPath, [VALIDATOR, '--root', TMP], { encoding: 'utf8', cwd: ROOT });
  } catch (error) {
    out = String(error.stdout ?? error.message);
    code = error.status ?? 1;
  }
  const statusOk = c.expect.test(out);
  const mentionOk = c.expectMention === undefined || c.expectMention.test(out);
  results.push({
    id: c.id,
    name: c.name,
    why: c.why,
    pass: statusOk && mentionOk,
    expected: String(c.expect),
    exit: code,
    output: out.trim(),
  });
}

rmSync(TMP, { recursive: true, force: true });

if (JSON_OUT) {
  console.log(JSON.stringify({ validator: VALIDATOR, results }, null, 2));
} else {
  console.log(`状态校验器回归测试：${CASES.length} 个用例`);
  console.log(`被测校验器：${VALIDATOR}\n`);
  for (const r of results) {
    console.log(`${r.pass ? '✅' : '❌'} ${r.id}  ${r.name}`);
    if (!r.pass) {
      console.log(`     期望匹配：${r.expected}`);
      console.log(`     为什么钉这条：${r.why}`);
      console.log('     实际输出：');
      for (const line of r.output.split('\n')) console.log('       ' + line);
    }
  }
  const failed = results.filter((r) => !r.pass).length;
  console.log(
    `\n${failed === 0 ? `✅ 全部 ${CASES.length} 个用例符合预期` : `❌ ${failed}/${CASES.length} 个用例不符合预期`}`,
  );
}

process.exit(results.some((r) => !r.pass) ? 1 : 0);
