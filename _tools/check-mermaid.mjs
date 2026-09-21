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
 *   node _tools/check-mermaid.mjs           # 校验全部 md
 *   node _tools/check-mermaid.mjs --verbose # 逐图打印 OK
 *
 * 依赖（缺失时自动跳过，不报错，便于纯用户环境使用）：
 *   - playwright-core
 *   - 一份 mermaid 浏览器构建（render/mermaid-obsidian.min.js 或本机已有副本）
 *
 * 退出码：0 = 全过或跳过；1 = 有图渲染失败
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const VERBOSE = process.argv.includes('--verbose');
const SKIP_DIRS = new Set(['node_modules', '.git', '资料']);

/** 本机已有的依赖（开发环境）；缺失则跳过 */
const CANDIDATES = {
  playwright: [
    path.join(ROOT, 'node_modules', 'playwright-core', 'index.js'),
    'E:/playground/_diagram_upgrade/node_modules/playwright-core/index.js',
  ],
  mermaid: [
    path.join(ROOT, 'render', 'mermaid.min.js'),
    path.join(ROOT, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js'),
    'E:/playground/_diagram_upgrade/render/mermaid-obsidian.min.js',
  ],
  chromium: [
    'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe',
  ],
};

function firstExisting(list) {
  for (const p of list) if (fs.existsSync(p)) return p;
  return null;
}

const pwPath = firstExisting(CANDIDATES.playwright);
const mmPath = firstExisting(CANDIDATES.mermaid);
const crPath = firstExisting(CANDIDATES.chromium);

if (!pwPath || !mmPath || !crPath) {
  console.log('\n⚠️  缺少 mermaid 校验依赖，跳过图形校验：');
  if (!pwPath) console.log('   - playwright-core 未找到');
  if (!mmPath) console.log('   - mermaid 浏览器构建未找到');
  if (!crPath) console.log('   - 无头 Chromium 未找到');
  console.log('   这一步不是必过项（CI 里可选）。安装后可启用：');
  console.log('   npm i -D playwright-core mermaid && npx playwright install chromium\n');
  process.exit(0);
}

// playwright-core 是 CJS 包，用 createRequire 加载（ESM import 拿不到具名导出）
const require = createRequire(import.meta.url);
const { chromium } = require(pwPath);
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
