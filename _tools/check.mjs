#!/usr/bin/env node
/**
 * check.mjs —— 内容质检（轻量版）
 *
 * 查什么：
 *   1. 围栏奇偶      ``` 必须成对
 *   2. 坏链接        相对链接指向的文件必须存在
 *   3. 占位词残留    框架文件里不该出现「（评估完成后由导师填写）」之外的占位
 *   4. 编码          UTF-8 无 BOM、无 U+FFFD（替换字符）
 *   5. 行尾          LF（不是 CRLF）
 *   6. 跳板文件      是否与 setup-agents.mjs 一致
 *   7. 状态一致性    学习档案里的路径是否真实存在
 *
 * 用法：
 *   node _tools/check.mjs          # 全量检查
 *   node _tools/check.mjs --quiet  # 只输出问题
 *
 * 退出码：0 = 全过；1 = 有问题
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, extname, sep, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const QUIET = process.argv.includes('--quiet');

/** 不检查的目录 */
const SKIP_DIRS = new Set([
  'node_modules', '.git', '资料', '.obsidian', 'dist', 'build', '.cache',
]);

/** 不检查的相对路径前缀 —— 测试夹具是**故意写坏**的数据（路径不存在、状态自相矛盾），
 *  用内容质检去查它们等于让测试用例自己违反规则。它们的正确性由
 *  `validate-state.mjs --fixtures` 按 expected.json 断言。 */
const SKIP_REL_PREFIXES = ['tests/fixtures'];

/** 占位词：只保留「真的没写完」的标记；<课名>/<学科名> 是模板示意，不算 */
const PLACEHOLDER_PATTERNS = [
  /<填>/g,
  /<待填>/g,
  /<TODO>/gi,
  /lorem ipsum/gi,
];

/** 图片引用：本项目约定教程不用**本地截图**（见 ADR-0006）。
 *  只禁本地/相对路径图片 —— 外部徽章（shields.io、CI badge）是实时生成的，
 *  不会过时、不需人工补拍，不属于「截图」，因此放行。 */
const IMAGE_REF_RE = /!\[[^\]]*\]\(([^)]+\.(?:png|jpe?g|gif|webp|svg))\)/gi;

/** 框架文件（占位词检查范围） */
const FRAMEWORK_PREFIXES = ['协议', '学科包', '教程', '_tools'];

/** 本身就是模板、允许保留占位词的文件/目录 */
const TEMPLATE_EXEMPT = ['模板/', '学科包/_自定义学科包模板.md'];

/**
 * 模板里的相对链接是**按「模板被复制到哪」写的**，不是按 `模板/` 目录本身写的。
 * 例：`模板/摸底测试模板.md` 的目标位置是 `我的学习/学科/<学科>/00-摸底测试.md`（3 层深），
 * 所以它写 `../../../协议/01_摸底剧本.md` —— 在 `模板/` 里当然点不开，但复制过去就对了。
 * 校验时用这个「虚拟目标目录」当基准，才能查链接是否真的正确。
 * 未列出的模板（教学引导/学生回答）嵌在 ```markdown 代码块里，本来就不参与链接校验。
 */
const TEMPLATE_VIRTUAL_BASE = {
  '摸底测试模板.md': '我的学习/学科/<学科>',
  '课程路线模板.md': '我的学习/学科/<学科>',
  '学习档案模板.md': '我的学习',
  '学生回答模板.md': '我的学习/学科/<学科>/NN-<课名>',
};

const problems = [];
const warnings = [];
let fileCount = 0;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const abs = join(dir, name);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(abs, out);
    else out.push(abs);
  }
  return out;
}

function rel(abs) {
  return relative(ROOT, abs).split(sep).join('/');
}

function isFramework(relPath) {
  return FRAMEWORK_PREFIXES.some((p) => relPath === p || relPath.startsWith(p + '/'))
    || relPath === 'README.md'
    || relPath === 'README.en.md';
}

function isTemplateExempt(relPath) {
  return TEMPLATE_EXEMPT.some((p) => relPath === p || relPath.startsWith(p));
}

/** 去掉围栏代码块内容（示例代码里的链接与占位词不算问题） */
function stripCodeFences(text) {
  const lines = text.split('\n');
  const out = [];
  let inFence = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      out.push(''); // 围栏行本身保留为空白，避免影响其他检测
      continue;
    }
    out.push(inFence ? '' : line);
  }
  return out.join('\n');
}

/**
 * 按 GitHub 风格把标题文本转成锚点 id。
 * 规则（近似 GitHub）：小写 → 去掉标点/emoji → 空格转连字符。
 * 保留中文、字母、数字、连字符、下划线。
 */
function slugify(heading) {
  return heading
    .trim()
    .toLowerCase()
    // 去掉 Markdown 行内标记
    .replace(/[`*_~[\]()]/g, '')
    // 去掉 emoji 与符号（保留中文 \u4e00-\u9fff、字母数字、空格、连字符、下划线）
    .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/** 收集一个 Markdown 文件里所有标题能生成的锚点集合 */
function collectHeadingAnchors(text) {
  const anchors = new Set();
  const lines = text.split('\n');
  let inFence = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (!m) continue;
    const slug = slugify(m[2]);
    if (slug) anchors.add(slug);
  }
  return anchors;
}

/** 锚点是否存在（先按 slug 比，再退化为大小写不敏感的原文包含判断） */
function hasHeadingAnchor(text, anchor) {
  const target = anchor.toLowerCase();
  const anchors = collectHeadingAnchors(text);
  if (anchors.has(target)) return true;
  // 退化：允许作者手写不完全规范的锚点，只要能对上标题文本
  for (const a of anchors) {
    if (a.startsWith(target) || target.startsWith(a)) return true;
  }
  return false;
}

const files = walk(ROOT)
  .filter((f) => extname(f) === '.md' || extname(f) === '.mdc')
  .filter((f) => {
    const rp = rel(f);
    return !SKIP_REL_PREFIXES.some((p) => rp === p || rp.startsWith(p + '/'));
  });

for (const abs of files) {
  const rp = rel(abs);
  let buf;
  try {
    buf = readFileSync(abs);
  } catch (e) {
    problems.push(`${rp}: 无法读取 (${e.message})`);
    continue;
  }
  fileCount++;

  // ── 编码：BOM ──────────────────────────────────────────────
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    problems.push(`${rp}: 含 UTF-8 BOM（应为无 BOM）`);
  }

  const text = buf.toString('utf8');

  // ── 编码：U+FFFD ───────────────────────────────────────────
  if (text.includes('\uFFFD')) {
    problems.push(`${rp}: 含替换字符 U+FFFD（编码损坏）`);
  }

  // ── 行尾：CRLF ─────────────────────────────────────────────
  const crlfCount = (text.match(/\r\n/g) || []).length;
  if (crlfCount > 0) {
    warnings.push(`${rp}: 含 ${crlfCount} 处 CRLF 行尾（项目约定 LF）`);
  }

  // ── 围栏奇偶 ───────────────────────────────────────────────
  const fenceLines = text.split('\n').filter((l) => /^\s*(```|~~~)/.test(l));
  if (fenceLines.length % 2 !== 0) {
    problems.push(`${rp}: 代码围栏不成对（${fenceLines.length} 个，应为偶数）`);
  }

  // 围栏内的内容不参与「占位词」与「链接」检测（示例代码里的路径不是真链接）
  const prose = stripCodeFences(text);

  // ── 占位词（仅框架文件，且非模板豁免）───────────────────────
  if (isFramework(rp) && !isTemplateExempt(rp)) {
    for (const re of PLACEHOLDER_PATTERNS) {
      const m = prose.match(re);
      if (m) {
        problems.push(`${rp}: 残留占位词 ${JSON.stringify(m[0])} ×${m.length}`);
      }
    }
  }

  // ── 本地图片引用（本项目约定：教程不用本地截图，见 ADR-0006）───
  {
    let im;
    IMAGE_REF_RE.lastIndex = 0;
    while ((im = IMAGE_REF_RE.exec(prose)) !== null) {
      const target = im[1].trim();
      // 放行外部图片（徽章等）：ADR-0006 禁的是会过时的本地截图
      if (/^(https?:)?\/\//i.test(target)) continue;
      problems.push(
        `${rp}: 引用了本地图片 ${target} —— 本项目约定教程用纯文本示意图（见 docs/adr/0006）`,
      );
    }
  }

  // ── 相对链接存在性 + 锚点校验 ───────────────────────────────
  const linkRe = /\[[^\]]*\]\(([^)]+)\)/g;
  let m;
  while ((m = linkRe.exec(prose)) !== null) {
    const raw = m[1].trim();
    if (!raw) continue;
    if (/^(https?:|mailto:|tel:)/i.test(raw)) continue;

    const hashIdx = raw.indexOf('#');
    const anchor = hashIdx >= 0 ? raw.slice(hashIdx + 1) : '';
    let target = (hashIdx >= 0 ? raw.slice(0, hashIdx) : raw).split('?')[0];
    target = target.trim();

    // 纯锚点：跳到本文件的小节
    if (!target) {
      if (anchor && !hasHeadingAnchor(text, anchor)) {
        problems.push(`${rp}: 锚点不存在 → #${anchor}`);
      }
      continue;
    }

    // 模板文件：按「复制到目标位置后」的视角解析（见 TEMPLATE_VIRTUAL_BASE）
    const virtualBase = rp.startsWith('模板/')
      ? TEMPLATE_VIRTUAL_BASE[basename(rp)]
      : undefined;
    const linkBase = virtualBase ? join(ROOT, virtualBase) : dirname(abs);

    const targetAbs = join(linkBase, decodeURIComponent(target));
    if (!existsSync(targetAbs)) {
      problems.push(`${rp}: 坏链接 → ${target}`);
      continue;
    }

    // 跨文件锚点：校验目标文件的标题能否生成该锚点
    if (anchor && extname(targetAbs) === '.md') {
      let targetText;
      try {
        targetText = readFileSync(targetAbs, 'utf8');
      } catch {
        continue;
      }
      if (!hasHeadingAnchor(targetText, anchor)) {
        problems.push(`${rp}: 锚点在目标文件中不存在 → ${target}#${anchor}`);
      }
    }
  }
}

// ── 跳板文件一致性 ───────────────────────────────────────────
try {
  const out = execFileSync(process.execPath, [join(ROOT, '_tools', 'setup-agents.mjs'), '--check'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (!QUIET) process.stdout.write('  ' + out.trim().split('\n').pop() + '\n');
} catch (e) {
  const msg = (e.stdout || '') + (e.stderr || '');
  for (const line of msg.split('\n')) {
    const t = line.trim();
    if (t.startsWith('❌')) problems.push(`跳板文件: ${t.replace(/^❌\s*/, '')}`);
  }
}

// ── 状态一致性：学习档案里的路径是否存在 ─────────────────────
const profile = join(ROOT, '我的学习', '00-学习档案.md');
if (existsSync(profile)) {
  const text = readFileSync(profile, 'utf8');
  const pathRe = /\[([^\]]*)\]\((\.\.\/[^)]+|\.\/[^)]+)\)/g;
  let m;
  while ((m = pathRe.exec(text)) !== null) {
    const target = m[2].split('#')[0];
    const abs = join(dirname(profile), decodeURIComponent(target));
    if (!existsSync(abs)) {
      // 空模板里的示例路径不算错
      warnings.push(`我的学习/00-学习档案.md: 引用路径不存在 → ${target}`);
    }
  }
}

// ── 文档里写死的数量是否与实际一致（防「改了实际但忘了改文档」）──
{
  // ADR 数量
  const adrDir = join(ROOT, 'docs', 'adr');
  const adrCount = existsSync(adrDir)
    ? readdirSync(adrDir).filter((f) => f.endsWith('.md')).length
    : 0;

  const countClaims = [
    { file: 'README.md', re: /(\d+)\s*篇架构决策记录/g, what: 'ADR 数量' },
    { file: 'README.md', re: /docs\/adr\/\)（(\d+)\s*篇）/g, what: 'ADR 数量' },
    { file: 'README.en.md', re: /(\d+)\s*ADRs/g, what: 'ADR 数量' },
  ];

  for (const claim of countClaims) {
    const abs = join(ROOT, claim.file);
    if (!existsSync(abs)) continue;
    const text = readFileSync(abs, 'utf8');
    let cm;
    while ((cm = claim.re.exec(text)) !== null) {
      const claimed = Number(cm[1]);
      if (claimed !== adrCount) {
        problems.push(
          `${claim.file}: 文档写「${claimed} 篇 ${claim.what}」，实际是 ${adrCount} 篇 —— 请同步`,
        );
      }
    }
  }

  // 跳板文件数量：以 setup-agents.mjs 的 TARGETS 实际「path:」条目为准（动态统计，不硬编码）
  {
    const setupSrc = readFileSync(join(ROOT, '_tools', 'setup-agents.mjs'), 'utf8');
    const targetsBlock = setupSrc.split('const TARGETS = [')[1]?.split(/\n\];/)[0] ?? '';
    // 每个跳板条目必有 path 字段；AGENTS.md 真相条目有 skip: true，不计入跳板数
    const pointerCount = (targetsBlock.match(/path:\s*'/g) || []).length
      - (targetsBlock.match(/skip:\s*true/g) || []).length;

    const pointerClaim = /(\d+)\s*个跳板文件/g;
    for (const f of ['README.md', 'README.en.md', 'AGENTS.md', '协议/00_导师协议.md']) {
      const abs = join(ROOT, f);
      if (!existsSync(abs)) continue;
      const text = readFileSync(abs, 'utf8');
      let pm;
      while ((pm = pointerClaim.exec(text)) !== null) {
        const claimed = Number(pm[1]);
        if (claimed !== pointerCount) {
          problems.push(`${f}: 文档写「${claimed} 个跳板文件」，实际脚本生成 ${pointerCount} 个 —— 请同步（或运行 node _tools/setup-agents.mjs）`);
        }
      }
    }
  }

  // 硬规则条数：以 AGENTS.md 的「## 2. 硬规则」小节实际编号条目数为准
  {
    const abs = join(ROOT, 'AGENTS.md');
    if (existsSync(abs)) {
      const lines = readFileSync(abs, 'utf8').split('\n');
      let inSec = false;
      let rules = 0;
      for (const l of lines) {
        if (/^##\s*2\.\s*硬规则/.test(l)) { inSec = true; continue; }
        if (inSec && /^##\s/.test(l)) break;
        if (inSec && /^\d+\.\s/.test(l)) rules++;
      }
      // 检查声称「硬规则 N 条」的地方。
      // 注意：要排除「硬规则第 N 条」这种「引用某条编号」的写法（不是声称总数）。
      for (const f of ['README.md', 'README.en.md', 'AGENTS.md', 'AGENTS.en.md', '协议/00_导师协议.md', '协议/00_导师协议.en.md', '教程/界面示意图.md', '教程/ui-mockups.en.md']) {
        const p = join(ROOT, f);
        if (!existsSync(p)) continue;
        const text = readFileSync(p, 'utf8');
        // 中文：「硬规则」共 N 条 / 硬规则 N 条（不含「第 N 条」）
        for (const re of [
          /硬规则[」\s]*(?:共\s*)?(\d+)\s*条/g,
          /(\d+)\s*条\s*硬规则/g,
          /答出\s*\*{0,2}(\d+)\s*条/g,
          /(\d+)\s*hard rules/gi,
          /hard rules[^\d]{0,4}(\d+)/gi,
          /has\s+(\d+)\s+items/gi,
          /answers?\s+\*{0,2}(\d+)/gi,
        ]) {
          let rm;
          while ((rm = re.exec(text)) !== null) {
            const claimed = Number(rm[1]);
            if (claimed !== rules) {
              problems.push(`${f}: 文档写「硬规则 ${claimed} 条」，实际是 ${rules} 条 —— 请同步`);
            }
          }
        }
      }
    }
  }
}

// ── 输出 ─────────────────────────────────────────────────────
console.log('');
console.log(`📁 检查了 ${fileCount} 个 Markdown 文件`);

if (warnings.length) {
  console.log(`\n⚠️  警告 ${warnings.length} 条：`);
  for (const w of warnings) console.log(`   - ${w}`);
}

if (problems.length) {
  console.log(`\n❌ 问题 ${problems.length} 条：`);
  for (const p of problems) console.log(`   - ${p}`);
  console.log('');
  process.exit(1);
}

console.log('\n✅ 全部通过：围栏成对、无坏链接、无占位残留、UTF-8 无 BOM、跳板文件一致。');
console.log('');
