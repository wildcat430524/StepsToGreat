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
import { join, dirname, relative, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const QUIET = process.argv.includes('--quiet');

/** 不检查的目录 */
const SKIP_DIRS = new Set([
  'node_modules', '.git', '资料', '.obsidian', 'dist', 'build', '.cache',
]);

/** 占位词：只保留「真的没写完」的标记；<课名>/<学科名> 是模板示意，不算 */
const PLACEHOLDER_PATTERNS = [
  /<填>/g,
  /<待填>/g,
  /<TODO>/gi,
  /lorem ipsum/gi,
];

/** 框架文件（占位词检查范围） */
const FRAMEWORK_PREFIXES = ['协议', '学科包', '教程', '_tools'];

/** 本身就是模板、允许保留占位词的文件/目录 */
const TEMPLATE_EXEMPT = ['模板/', '学科包/_自定义学科包模板.md'];

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

const files = walk(ROOT).filter((f) => extname(f) === '.md' || extname(f) === '.mdc');

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

  // ── 相对链接存在性 ─────────────────────────────────────────
  const linkRe = /\[[^\]]*\]\(([^)]+)\)/g;
  let m;
  while ((m = linkRe.exec(prose)) !== null) {
    let target = m[1].trim();
    if (!target) continue;
    if (/^(https?:|mailto:|#|tel:)/i.test(target)) continue;
    // 去掉锚点与查询
    target = target.split('#')[0].split('?')[0];
    if (!target) continue;
    // 跳过纯锚点
    if (target.startsWith('#')) continue;
    const targetAbs = join(dirname(abs), decodeURIComponent(target));
    if (!existsSync(targetAbs)) {
      problems.push(`${rp}: 坏链接 → ${target}`);
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
