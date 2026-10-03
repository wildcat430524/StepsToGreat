#!/usr/bin/env node
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const runRoot = resolve(process.argv[2] ?? resolve(repo, '../s2g-learning-simulations/2026-09-30'));
const stage = process.argv[3] ?? 'current';
if (!/^[a-z0-9-]+$/.test(stage)) throw new Error('Use a simple stage name');
const manifest = JSON.parse(readFileSync(resolve(runRoot, 'manifest.json'), 'utf8'));
const sha = text => createHash('sha256').update(text).digest('hex');
const audit = { stage, workspaces: {}, protectedOriginals: {}, limits: ['Artifacts alone cannot prove rereading or tool call order.', 'Synthetic student answers do not prove learning efficacy.'] };
for (const [mode, item] of Object.entries(manifest.workspaces)) {
  const path = resolve(item.root, item.lessonPath, '01_学生回答.md');
  const text = readFileSync(path, 'utf8');
  const profile = readFileSync(resolve(item.root, '我的学习/00-学习档案.md'), 'utf8');
  const base = JSON.parse(readFileSync(resolve(runRoot, mode + '-before-01.json'), 'utf8'));
  const baseline = readFileSync(resolve(runRoot, 'seed-answer.md'), 'utf8');
  const original1 = baseline.slice(baseline.indexOf('你的回答：a 和 b'), baseline.indexOf('\n\n## 第一轮 · 问题 2'));
  const original2 = baseline.slice(baseline.indexOf("你的回答：groups 输出"), baseline.indexOf('\n\n## 最终复评结果'));
  const finalCount = [...text.matchAll(/^## 最终复评结果\s*$/gm)].length;
  const parseCount = [...text.matchAll(/^## 正确答案与解析\s*$/gm)].length;
  const rounds = [...new Set([...text.matchAll(/^## ([^\n]*轮)[^\n]*问题/gm)].map(m => m[1]))];
  const validator = mode === 'folder' ? resolve(repo, '_tools/validate-state.mjs') : resolve(repo, '../Steps2Great-skill/scripts/validate-state.mjs');
  const result = spawnSync(process.execPath, [validator, '--root', item.root, '--json'], { encoding: 'utf8' });
  audit.workspaces[mode] = {
    originalStudentAnswersPreserved: text.includes(original1) && text.includes(original2),
    seedMatchesRecordedBaseline: sha(baseline) === item.initialAnswerSha256,
    profileUnchangedSinceSeed: sha(profile) === base.files['我的学习/00-学习档案.md'].sha256,
    finalCount, parseCount, rounds,
    studentFileBytes: Buffer.byteLength(text),
    validator: { exitCode: result.status, stdout: result.stdout, stderr: result.stderr },
    tutorReplies: readdirSync(item.root).filter(name => /^导师回复-\d+\.md$/.test(name)).sort(),
  };
}
for (const [path, expected] of Object.entries(manifest.protectedFiles)) audit.protectedOriginals[path] = sha(readFileSync(path)) === expected;
writeFileSync(resolve(runRoot, 'audit-' + stage + '.json'), JSON.stringify(audit, null, 2) + '\n');
console.log(JSON.stringify(audit, null, 2));
