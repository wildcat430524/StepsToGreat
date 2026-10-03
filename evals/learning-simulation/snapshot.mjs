#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { createHash } from 'node:crypto';
const root = resolve(process.argv[2] ?? '');
const target = resolve(process.argv[3] ?? '');
if (process.argv.length !== 4) throw new Error('Usage: node snapshot.mjs WORKSPACE OUTPUT.json');
const files = {};
function walk(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const path = resolve(dir, item.name);
    if (item.isSymbolicLink()) throw new Error('Snapshots do not follow symlinks');
    if (item.isDirectory()) walk(path);
    else if (item.isFile()) {
      const data = readFileSync(path);
      files[relative(root, path).replaceAll('\\', '/')] = {
        sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length, text: data.toString('utf8'),
      };
    }
  }
}
walk(resolve(root, '我的学习'));
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, JSON.stringify({ root, capturedAt: new Date().toISOString(), files }, null, 2) + '\n');
console.log(`Captured ${Object.keys(files).length} student files`);
