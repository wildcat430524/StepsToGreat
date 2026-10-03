#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const escapeXml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
})[char]);

export function renderModuleProgress({ mastered, total, label }) {
  if (!Number.isSafeInteger(mastered) || !Number.isSafeInteger(total)
      || total < 1 || mastered < 0 || mastered > total) {
    throw new Error('Progress requires integer counts: 0 <= mastered <= total, total >= 1.');
  }
  const width = Number((200 * mastered / total).toFixed(3));
  const title = escapeXml(label ?? `Module mastery: ${mastered}/${total} units`);
  const fill = mastered === 0 ? ''
    : `\n  <rect x="0" y="5" width="${width}" height="10" rx="5" fill="#148a80"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="20" viewBox="0 0 200 20" role="img" aria-labelledby="progress-title">
  <title id="progress-title">${title}</title>
  <rect x="0" y="5" width="200" height="10" rx="5" fill="#dfe8e8"/>${fill}
</svg>
`;
}

export function parseArguments(args) {
  const allowed = new Set(['--mastered', '--total', '--output', '--label']);
  const values = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!allowed.has(args[i]) || args[i + 1] === undefined || args[i + 1].startsWith('--')) {
      throw new Error('Usage: render-progress.mjs --mastered K --total T --output path.svg [--label text]');
    }
    if (Object.hasOwn(values, args[i])) throw new Error(`Duplicate option: ${args[i]}`);
    values[args[i]] = args[i + 1];
  }
  if (!/^\d+$/.test(values['--mastered'] ?? '') || !/^\d+$/.test(values['--total'] ?? '')
      || !values['--output']?.toLowerCase().endsWith('.svg')) {
    throw new Error('Specify integer counts and an SVG output path. Unknown progress must not be rendered.');
  }
  return { mastered: Number(values['--mastered']), total: Number(values['--total']),
    output: resolve(values['--output']), label: values['--label'] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const options = parseArguments(process.argv.slice(2));
    const svg = renderModuleProgress(options);
    if (existsSync(options.output) && readFileSync(options.output, 'utf8') !== svg) {
      throw new Error('The output exists with different contents; use a new snapshot filename.');
    }
    mkdirSync(dirname(options.output), { recursive: true });
    writeFileSync(options.output, svg, 'utf8');
    process.stdout.write(`${options.output}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
