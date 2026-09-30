#!/usr/bin/env node
// Read-only retrieval for learner-owned Markdown/text. No dependencies.
import { readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { resolve, relative, sep, extname } from 'node:path';
import { createHash } from 'node:crypto';

function fail(message) { throw new Error(message); }
const args = process.argv.slice(2);
const command = args.shift();
const options = {};
try {
for (let i = 0; i < args.length; i += 2) {
  if (!['--root', '--file', '--query', '--section', '--sha256'].includes(args[i]) || !args[i + 1]) fail('Unknown option or missing value');
  options[args[i].slice(2)] = args[i + 1];
}

  if (!['list', 'search', 'read'].includes(command)) fail('Usage: materials.mjs list|search|read --root <workspace> [--file <path in 资料>] [--query <literal>] [--section <start line>] [--sha256 <digest>]');
  const base = realpathSync(resolve(options.root ?? process.cwd(), '资料'));
  function safe(path) {
    const actual = realpathSync(path);
    const rel = relative(base, actual);
    if (rel === '..' || rel.startsWith('..' + sep) || resolve(actual) === resolve(base) || rel.startsWith(sep) || /^[A-Za-z]:/.test(rel)) fail('File must stay inside 资料/');
    return actual;
  }
  const supported = p => ['.md', '.txt'].includes(extname(p).toLowerCase());
  function load(path) {
    path = safe(path);
    if (!supported(path)) fail('Unsupported format: extract readable text first; PDF/image/binary is not teaching evidence');
    const bytes = readFileSync(path);
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (text.includes('\0')) fail('Binary content is not readable text');
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    const headings = [];
    let fence = null;
    if (extname(path).toLowerCase() === '.md') for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const f = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
      if (fence) {
        if (f && f[1][0] === fence.char && f[1].length >= fence.length && !f[2].trim()) fence = null;
        continue;
      }
      if (f) { fence = { char: f[1][0], length: f[1].length }; continue; }
      const atx = /^ {0,3}(#{1,6})(?:[ \t]+(.*?)|[ \t]*)$/.exec(line);
      if (atx) headings.push({ start: i + 1, level: atx[1].length, title: (atx[2] ?? '').replace(/[ \t]+#+[ \t]*$/, '') });
      else if (i > 0 && /^ {0,3}(=+|-+)[ \t]*$/.test(line) && lines[i - 1].trim() && !/^\s*[-*+>]\s/.test(lines[i - 1])) {
        headings.push({ start: i, level: line.trim()[0] === '=' ? 1 : 2, title: lines[i - 1].trim() });
      }
    }
    const sections = headings.map((h, i) => ({ ...h, end: (headings.slice(i + 1).find(n => n.level <= h.level)?.start ?? lines.length + 1) - 1 }));
    return { file: relative(base, path).split(sep).join('/'), sha256: createHash('sha256').update(bytes).digest('hex'), lines, sections };
  }
  function inventory(dir, seen = new Set()) {
    const real = realpathSync(dir);
    if (seen.has(real)) return [];
    seen.add(real);
    return readdirSync(dir).sort().flatMap(name => {
      const path = resolve(dir, name);
      let actual;
      try { actual = safe(path); } catch { return []; }
      if (statSync(actual).isDirectory()) return inventory(actual, seen);
      return [{ file: relative(base, actual).split(sep).join('/'), format: extname(actual), readableByTool: supported(actual) }];
    });
  }
  let result;
  if (command === 'list' && !options.file) result = inventory(base);
  else if (command === 'list') { const { lines, ...meta } = load(resolve(base, options.file)); result = { ...meta, lineCount: lines.length }; }
  else if (command === 'read') {
    if (!options.file) fail('read requires --file');
    const doc = load(resolve(base, options.file));
    if (options.sha256 && options.sha256 !== doc.sha256) fail('Source changed: search again before citing');
    const section = options.section ? doc.sections.find(s => String(s.start) === options.section) : { start: 1, end: doc.lines.length, title: 'Whole file' };
    if (!section) fail('Unknown section start line: list --file first');
    result = { file: doc.file, sha256: doc.sha256, ...section, text: doc.lines.slice(section.start - 1, section.end).join('\n') };
  } else {
    if (!options.query) fail('search requires --query (literal text)');
    const files = options.file ? [{ file: options.file, readableByTool: true }] : inventory(base);
    result = files.filter(f => f.readableByTool).map(f => {
      const doc = load(resolve(base, f.file));
      const matches = doc.lines.flatMap((line, i) => {
        if (!line.toLocaleLowerCase().includes(options.query.toLocaleLowerCase())) return [];
        const section = doc.sections.filter(s => s.start <= i + 1 && s.end >= i + 1).at(-1);
        return [{ line: i + 1, preview: line, sectionStart: section?.start ?? null, sectionTitle: section?.title ?? null }];
      });
      return { file: doc.file, sha256: doc.sha256, matches };
    }).filter(d => d.matches.length);
  }
  console.log(JSON.stringify(result, null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
