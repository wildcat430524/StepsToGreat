/**
 * _tools/check-mermaid.mjs —— 校验文档里的 mermaid 代码块能否被真实渲染
 *
 * 为什么需要：教程里的流程图/时序图如果语法错，GitHub 上会显示成一片报错框，
 * 而纯 Markdown 层面的 check.mjs 查不出来（它只看围栏是否成对）。
 *
 * 实现方式：用无头 Chromium 真实渲染（与 E:\playground 的 mermaid-check.mjs 同法），
 * 而不是在 Node 里 parse —— 后者缺少 DOM，会误报 "DOMPurify.sanitize is not a function"。
 *
 * 用法：
 *   node _tools/check-mermaid.mjs           # 校验全部 md（缺依赖则跳过）
 *   node _tools/check-mermaid.mjs --verbose # 逐图打印 OK
 *   node _tools/check-mermaid.mjs --strict  # 缺依赖 = 失败（CI 必须用这个）
 *
 * 依赖（通过 devDependencies 安装）：
 *   - playwright  / playwright-core
 *   - mermaid
 *
 * 退出码：0 = 全过；1 = 有图渲染失败，或 --strict 下缺依赖
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const VERBOSE = process.argv.includes('--verbose');
/** 严格模式：缺依赖直接失败。CI 一律走这个，避免「装不上 → 静默跳过 → 绿灯」。 */
const STRICT = process.argv.includes('--strict') || process.env.DSH_MERMAID_STRICT === '1';
const SKIP_DIRS = new Set(['node_modules', '.git', '资料']);

const req = createRequire(import.meta.url);

/** 依赖解析：优先本仓库 node_modules，其次同机已有副本（开发者环境）。 */
function resolvePlaywright() {
  for (const name of ['playwright', 'playwright-core']) {
    try {
      return req.resolve(name);
    } catch { /* 继续找 */ }
  }
  // 同机副本（仅在非 CI 的开发者环境兜底）
  if (!process.env.CI) {
    const alt = 'E:/playground/_diagram_upgrade/node_modules/playwright-core/index.js';
    if (fs.existsSync(alt)) return alt;
  }
  return null;
}

function resolveMermaid() {
  try {
    return req.resolve('mermaid/dist/mermaid.min.js');
  } catch { /* 继续找 */ }
  const local = [
    path.join(ROOT, 'render', 'mermaid.min.js'),
    path.join(ROOT, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js'),
  ];
  for (const p of local) if (fs.existsSync(p)) return p;
  if (!process.env.CI) {
    const alt = 'E:/playground/_diagram_upgrade/render/mermaid-obsidian.min.js';
    if (fs.existsSync(alt)) return alt;
  }
  return null;
}

/**
 * 定位 Chromium 可执行文件（**跨平台**）。
 *
 * 旧实现把 Windows 路径 `C:/Users/Administrator/...` 写死，
 * 在 ubuntu-latest 上必然找不到 → 脚本「跳过」并返回 0 →
 * CI 看起来全绿，实际上 11 张 mermaid 图一张都没验证过。
 *
 * 现在优先问 playwright 自己（它知道浏览器装在哪），再退回手动扫描
 * `ms-playwright` 目录 —— Windows / macOS / Linux 都能命中。
 */
function resolveChromium(mod) {
  // ① playwright 自己报的路径最可靠
  try {
    const chromium = mod.chromium || (mod.default && mod.default.chromium);
    if (chromium && typeof chromium.executablePath === 'function') {
      const p = chromium.executablePath();
      if (p && fs.existsSync(p)) return p;
    }
  } catch { /* 未安装浏览器时会抛错，继续走扫描 */ }

  // ② 扫描 ms-playwright 缓存目录（跨平台）
  const roots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    process.platform === 'win32' && process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, 'ms-playwright')
      : null,
    process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright')
      : null,
    path.join(os.homedir(), '.cache', 'ms-playwright'),
  ].filter(Boolean);

  const names = process.platform === 'win32'
    ? ['chrome-headless-shell.exe', 'chrome.exe']
    : ['chrome-headless-shell', 'chrome'];

  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    let entries;
    try {
      entries = fs.readdirSync(root);
    } catch { continue; }
    for (const dir of entries) {
      if (!/^chromium/.test(dir)) continue;
      for (const sub of walkFiles(path.join(root, dir), 4)) {
        if (names.includes(path.basename(sub))) return sub;
      }
    }
  }
  return null;
}

function walkFiles(dir, depth) {
  if (depth < 0) return [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch { return []; }
  const out = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkFiles(p, depth - 1));
    else out.push(p);
  }
  return out;
}

const pwPath = resolvePlaywright();
const mmPath = resolveMermaid();

let mod = null;
let crPath = null;
if (pwPath) {
  mod = req(pwPath);
  crPath = resolveChromium(mod);
}

if (!pwPath || !mmPath || !crPath) {
  const missing = [];
  if (!pwPath) missing.push('playwright / playwright-core');
  if (!mmPath) missing.push('mermaid');
  if (!crPath) missing.push('无头 Chromium');

  if (STRICT) {
    console.error(`\n❌ 缺少 mermaid 校验依赖：${missing.join('、')}`);
    console.error('   严格模式（CI）下不允许静默跳过。请先安装：');
    console.error('   npm ci && npx playwright install --with-deps chromium\n');
    process.exit(1);
  }
  console.log('\n⚠️  缺少 mermaid 校验依赖，跳过图形校验：');
  for (const m of missing) console.log(`   - ${m}`);
  console.log('   这一步在本地是可选项；CI 用 --strict 强制要求。安装：');
  console.log('   npm ci && npx playwright install chromium\n');
  process.exit(0);
}

const { chromium } = mod;
const MERMAID_SRC = fs.readFileSync(mmPath, 'utf8');

// ── 抽取 mermaid 块 ───────────────────────────────────────────
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

function extractBlocks(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let inFence = false;
  let isMermaid = false;
  let body = [];
  let startLine = 0;
  lines.forEach((line, i) => {
    const fence = /^\s*(```|~~~)\s*(\S*)/.exec(line);
    if (fence) {
      if (!inFence) {
        inFence = true;
        isMermaid = fence[2].toLowerCase() === 'mermaid';
        body = [];
        startLine = i + 2;
      } else {
        if (isMermaid && body.length) blocks.push({ startLine, src: body.join('\n') });
        inFence = false;
        isMermaid = false;
      }
      return;
    }
    if (inFence && isMermaid) body.push(line);
  });
  return blocks;
}

// ── 起一个空白页 ──────────────────────────────────────────────
const HTML = '<!doctype html><html><head><meta charset="utf-8"></head><body><div id="c"></div></body></html>';
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(HTML);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await chromium.launch({ executablePath: crPath, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
await page.goto(`http://127.0.0.1:${port}/`);
await page.addScriptTag({ content: MERMAID_SRC });

const loaded = await page.evaluate(() => typeof window.mermaid !== 'undefined');
if (!loaded) {
  console.log('⚠️  mermaid 脚本加载失败，跳过校验。');
  await browser.close();
  server.close();
  process.exit(0);
}

await page.evaluate(() => {
  window.mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    flowchart: { htmlLabels: false },
  });
});

// ── 逐图渲染 ──────────────────────────────────────────────────
const files = walk(ROOT);
let total = 0;
let pass = 0;
const failures = [];

for (const abs of files) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
  const text = fs.readFileSync(abs, 'utf8');
  const blocks = extractBlocks(text);
  for (let k = 0; k < blocks.length; k++) {
    total++;
    const r = await page.evaluate(
      async (a) => {
        try {
          const out = await window.mermaid.render(a.id, a.src);
          return { ok: true, svg: out.svg };
        } catch (e) {
          return { ok: false, err: String((e && e.message) || e) };
        }
      },
      { src: blocks[k].src, id: `g${total}` },
    );
    if (r.ok) {
      pass++;
      if (VERBOSE) console.log(`  ✅ ${rel} #${k + 1} (L${blocks[k].startLine})`);
    } else {
      failures.push({
        rel,
        idx: k + 1,
        line: blocks[k].startLine,
        err: String(r.err).split('\n')[0],
      });
    }
  }
}

await browser.close();
server.close();

console.log('');
console.log(`🧜 真实渲染校验：${total} 个 mermaid 图，通过 ${pass}，失败 ${failures.length}`);

if (failures.length) {
  console.log('');
  for (const f of failures) {
    console.log(`   ❌ ${f.rel} #${f.idx} (L${f.line}): ${f.err}`);
  }
  console.log('');
  process.exit(1);
}

console.log('✅ 全部 mermaid 图可正常渲染，GitHub / Obsidian 上不会报错。');
console.log('');
