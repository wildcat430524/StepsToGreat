import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// An optional CLI argument lets the skill test its mirrored executable too.
const cli = process.argv[2] ?? fileURLToPath(new URL('../tools/materials.mjs', import.meta.url));
const root = mkdtempSync(join(tmpdir(), 'steps-materials-'));
mkdirSync(join(root, '资料'));
const file = join(root, '资料', '教材.md');
const source = '# 教材\n## 循环\n前提\n### 例外\n必须终止\n```md\n## 假标题\n```\n## 循环\n另一个版本\n';
writeFileSync(file, source);
const call = (...args) => spawnSync(process.execPath, [cli, ...args, '--root', root], { encoding: 'utf8' });
  test('完整小节包括子节与例外，重复标题按行定位，忽略围栏标题', () => {
    const list = JSON.parse(call('list', '--file', '教材.md').stdout);
    assert.deepEqual(list.sections.map(s => s.start), [1, 2, 4, 9]);
    const doc = JSON.parse(call('read', '--file', '教材.md', '--section', '2').stdout);
    assert.equal(doc.end, 8);
    assert.ok(doc.text.includes('必须终止'));
    assert.ok(!doc.text.includes('另一个版本'));
    assert.equal(JSON.parse(call('read', '--file', '教材.md', '--section', '9').stdout).title, '循环');
  });
  test('搜索含正文与定位，未命中明确为空', () => {
    const result = JSON.parse(call('search', '--query', '终止').stdout);
    assert.equal(result[0].matches[0].sectionStart, 4);
    assert.deepEqual(JSON.parse(call('search', '--query', '不存在').stdout), []);
  });
  test('来源发生变化必须重新定位', () => {
    const before = JSON.parse(call('read', '--file', '教材.md').stdout);
    writeFileSync(file, source + '更改\n');
    const changed = call('read', '--file', '教材.md', '--sha256', before.sha256);
    assert.equal(changed.status, 1);
    assert.match(changed.stderr, /Source changed/);
    writeFileSync(file, source);
  });
  test('不可读格式与 UTF-8 错误不成为证据', () => {
    writeFileSync(join(root, '资料', '扫描.pdf'), 'fake');
    writeFileSync(join(root, '资料', '坏编码.txt'), Buffer.from([0xff]));
    assert.equal(call('read', '--file', '扫描.pdf').status, 1);
    assert.equal(call('read', '--file', '坏编码.txt').status, 1);
    assert.equal(JSON.parse(call('list').stdout).find(f => f.file === '扫描.pdf').readableByTool, false);
  });
  test('普通文本与 setext 标题可读', () => {
    writeFileSync(join(root, '资料', '笔记.txt'), '无标题的文本');
    writeFileSync(join(root, '资料', '标题.md'), '标题\n====\n原文\n下一节\n----\n备注');
    assert.equal(JSON.parse(call('read', '--file', '笔记.txt').stdout).text, '无标题的文本');
    assert.deepEqual(JSON.parse(call('list', '--file', '标题.md').stdout).sections.map(s => s.start), [1, 4]);
  });
  test('路径越界与指向外部的链接拒绝读取', () => {
    const outside = join(root, '外部.md');
    writeFileSync(outside, '不该读取');
    assert.equal(call('read', '--file', '../外部.md').status, 1);
    try { symlinkSync(outside, join(root, '资料', '链接.md')); }
    catch (error) { if (error.code === 'EPERM') return; throw error; }
    assert.equal(call('read', '--file', '链接.md').status, 1);
    assert.ok(!JSON.parse(call('list').stdout).some(f => f.file === '链接.md'));
  });
after(() => rmSync(root, { recursive: true, force: true }));
