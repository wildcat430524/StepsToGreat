import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { renderModuleProgress, parseArguments } from '../_tools/render-progress.mjs';

test('quarter, two fifths, empty, full, and tiny progress use the actual module ratio', () => {
  for (const [mastered, total, width] of [[1, 4, 50], [2, 5, 80], [0, 4, 0], [4, 4, 200], [1, 25, 8]]) {
    const svg = renderModuleProgress({ mastered, total });
    const filled = svg.match(/width="([\d.]+)" height="10" rx="5" fill="#148a80"/);
    assert.equal(Number(filled?.[1] ?? 0), width);
    assert.match(svg, new RegExp(`${mastered}/${total} units`));
    assert.match(svg, /viewBox="0 0 200 20"/);
  }
});

test('invalid or unknown mastery never creates a plausible-looking bar', () => {
  for (const [mastered, total] of [[-1, 4], [5, 4], [1, 0], [0, 0], [0.5, 4], [1, Infinity], [NaN, 4], [1, null], [1, undefined]]) {
    assert.throws(() => renderModuleProgress({ mastered, total }));
  }
});

test('a label cannot add SVG markup or scripts', () => {
  const svg = renderModuleProgress({ mastered: 1, total: 4, label: '<script>&"\'' });
  assert.match(svg, /&lt;script&gt;&amp;&quot;&apos;/);
  assert.doesNotMatch(svg, /<script>/);
});

test('CLI rejects missing, duplicate, unknown, and non-integer options', () => {
  for (const args of [[], ['--mastered', '1'], ['--wat', '1'], ['--mastered', '1', '--mastered', '2'],
    ['--mastered', '0.5', '--total', '4', '--output', 'bar.svg'],
    ['--mastered', '1', '--total', '4', '--output', 'bar.png']]) assert.throws(() => parseArguments(args));
  assert.equal(parseArguments(['--mastered', '1', '--total', '4', '--output', 'bar.svg']).total, 4);
});

test('CLI can reproduce a snapshot but will not overwrite different evidence graphics', () => {
  const root = mkdtempSync(join(tmpdir(), 's2g-progress-'));
  const output = join(root, 'assets', 'module-1-of-4.svg');
  const script = fileURLToPath(new URL('../_tools/render-progress.mjs', import.meta.url));
  const args = [script, '--mastered', '1', '--total', '4', '--output', output];
  try {
    assert.equal(spawnSync(process.execPath, args).status, 0);
    assert.match(readFileSync(output, 'utf8'), /width="50"/);
    assert.equal(spawnSync(process.execPath, args).status, 0);
    writeFileSync(output, 'preserved historical snapshot');
    assert.equal(spawnSync(process.execPath, args).status, 1);
    assert.equal(readFileSync(output, 'utf8'), 'preserved historical snapshot');
  } finally {
    assert.equal(dirname(resolve(root)), resolve(tmpdir()));
    assert.ok(basename(root).startsWith('s2g-progress-'));
    rmSync(root, { recursive: true, force: true });
  }
});
