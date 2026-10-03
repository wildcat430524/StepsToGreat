#!/usr/bin/env node
// Retain an isolated broken workspace and both validator results as evidence.
import { cpSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const runRoot = resolve(process.argv[2] ?? resolve(repo, '../s2g-learning-simulations/2026-09-30'));
const target = resolve(runRoot, 'adversarial-missing-answer');
if (existsSync(target)) throw new Error('Probe already exists; do not overwrite evidence');
mkdirSync(target);
cpSync(resolve(runRoot, 'folder/我的学习'), resolve(target, '我的学习'), { recursive: true });
const profilePath = resolve(target, '我的学习/00-学习档案.md');
// Start from the active, unmastered seed even when the live lesson has ended.
const seedPath = resolve(runRoot, 'seed-profile.md');
const profile = existsSync(seedPath) ? readFileSync(seedPath, 'utf8')
  : JSON.parse(readFileSync(resolve(runRoot, 'folder-before-01.json'), 'utf8')).files['我的学习/00-学习档案.md'].text;
writeFileSync(profilePath, profile.replace(/\| 回答文档 \|[^\n]+/, '| 回答文档 | 我的学习/学科/Python/01-列表共享与浅拷贝/不存在的回答.md |'));
const results = {};
for (const [name, validator] of Object.entries({ folder: resolve(repo, '_tools/validate-state.mjs'), skill: resolve(repo, '../Steps2Great-skill/scripts/validate-state.mjs') })) {
  const output = spawnSync(process.execPath, [validator, '--root', target, '--json'], { encoding: 'utf8' });
  results[name] = { exitCode: output.status, stdout: output.stdout, stderr: output.stderr };
}
writeFileSync(resolve(runRoot, 'validator-probe.json'), JSON.stringify({ target, injectedFault: 'Active answer path does not exist; profile retains a placeholder in the mastery table.', results }, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
