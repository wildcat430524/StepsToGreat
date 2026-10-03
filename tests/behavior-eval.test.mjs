import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { runScenario, validateSuite, defaultSuite, summarize, hash } from '../tools/behavior-eval.mjs';
import { run as positive } from '../evals/behavior/fixture-adapter.mjs';

const suite = validateSuite(JSON.parse(readFileSync(defaultSuite, 'utf8')));
const find = id => structuredClone(suite.scenarios.find(s => s.id === id));
const has = (result, rule) => result.findings.some(f => f.rule === rule);
const q = { kind: 'normal', prompt: '解释你的答案。' };
const pass = id => ({ id, concept: 'PASS', logic: 'PASS', expression: 'PASS' });

for (const scenario of suite.scenarios) {
  test(`positive control: ${scenario.id}`, async () => {
    const result = await runScenario(scenario, positive);
    assert.equal(result.passed, true, JSON.stringify(result.findings));
  });
}

test('adapter cannot see reference labels or policy fields', async () => {
  await runScenario(find('reread-current'), ({ input, tools }) => {
    assert.equal(input.expected, undefined);
    assert.equal(input.assessments, undefined);
    assert.deepEqual(Object.keys(tools).sort(), ['assess', 'cite', 'publishRound', 'readFile', 'reportGap', 'writeFile'].sort());
  });
});
test('empty execution fails required actions', async () => {
  const result = await runScenario(find('reread-current'), () => {});
  assert.ok(has(result, 'missing-action'));
});
test('self-reported reread does not substitute for a read call', async () => {
  const result = await runScenario(find('reread-current'), ({ tools }) => tools.assess([pass('q1')]));
  assert.ok(has(result, 'reread-answer'));
});
test('partial and duplicate assessments fail coverage', async () => {
  for (const rows of [[pass('q1')], [pass('q1'), pass('q1')]]) {
    const result = await runScenario(find('complete-submission'), ({ input, tools }) => {
      tools.readFile(input.rulesPath); tools.readFile(input.answerPath); tools.assess(rows);
    });
    assert.ok(has(result, 'complete-assessment'));
  }
});
test('splitting one submission across calls fails', async () => {
  const result = await runScenario(find('complete-submission'), ({ input, tools }) => {
    tools.readFile(input.answerPath); tools.assess([pass('q1')]); tools.assess([pass('q2')]);
  });
  assert.ok(has(result, 'single-assessment'));
});
test('wrong reference labels cannot unlock advancement', async () => {
  const result = await runScenario(find('wrong-logic'), ({ input, tools }) => {
    tools.readFile(input.rulesPath); tools.readFile(input.answerPath);
    tools.assess([pass('q1')]); tools.publishRound([q]);
  });
  assert.ok(has(result, 'rubric')); assert.ok(has(result, 'no-premature-advance'));
});
test('tutor replacement loses the original and still fails the concept rubric', async () => {
  const result = await runScenario(find('concept-revision'), ({ input, tools }) => {
    tools.readFile(input.rulesPath); tools.readFile(input.answerPath);
    tools.writeFile(input.answerPath, 'Q1: Python 列表是可变的。');
    tools.readFile(input.answerPath); tools.assess([pass('q1')]);
  });
  assert.ok(has(result, 'preserve-history')); assert.ok(has(result, 'rubric'));
});
test('a read becomes stale after a write', async () => {
  const result = await runScenario(find('append-history'), ({ input, tools }) => {
    const answer = tools.readFile(input.answerPath);
    tools.writeFile(input.answerPath, answer + '\n追加'); tools.assess([pass('q1')]);
  });
  assert.ok(has(result, 'reread-answer'));
});
test('write-before-read and history overwrite are both caught', async () => {
  const result = await runScenario(find('read-before-write'), ({ input, tools }) => tools.writeFile(input.answerPath, '重写'));
  assert.ok(has(result, 'read-before-write')); assert.ok(has(result, 'preserve-history'));
});
test('oversized, empty and custom-rule rounds fail', async () => {
  for (const [id, questions] of [['normal-round-limit', [q, q, q, q]], ['normal-round-limit', []], ['custom-one-question', [q, q]]]) {
    const result = await runScenario(find(id), ({ input, tools }) => { tools.readFile(input.rulesPath); tools.publishRound(questions); });
    assert.ok(has(result, 'question-limit'));
  }
});
test('Feynman cannot be mixed with other questions or graded in all dimensions', async () => {
  const mixed = await runScenario(find('feynman-alone'), ({ tools }) => tools.publishRound([{ ...q, kind: 'feynman' }, q]));
  assert.ok(has(mixed, 'feynman-alone'));
  const graded = await runScenario(find('feynman-dimensions'), ({ input, tools }) => {
    tools.readFile(input.rulesPath); tools.readFile(input.answerPath); tools.assess([pass('q1')]);
  });
  assert.ok(has(graded, 'rubric'));
});
test('unknown/all-NA dimensions cannot pass', async () => {
  for (const concept of ['UNKNOWN', 'NA']) {
    const result = await runScenario(find('reread-current'), ({ input, tools }) => {
      tools.readFile(input.answerPath); tools.assess([{ id: 'q1', concept, logic: 'NA', expression: 'NA' }]);
    });
    assert.ok(has(result, 'dimensions'));
  }
});
test('publishing two active rounds fails even when both fit the limit', async () => {
  const result = await runScenario(find('normal-round-limit'), ({ tools }) => { tools.publishRound([q]); tools.publishRound([q]); });
  assert.ok(has(result, 'single-active-round'));
});
test('citation needs actual source access, exact excerpt and current hash', async () => {
  for (const mode of ['no-read', 'wrong-hash', 'invented-quote', 'stale']) {
    const result = await runScenario(find('verified-source'), ({ input, tools }) => {
      const source = input.files[input.sourcePath];
      if (mode !== 'no-read') tools.readFile(input.sourcePath);
      if (mode === 'stale') tools.writeFile(input.sourcePath, source + '\n修改');
      tools.cite({ path: input.sourcePath, quote: mode === 'invented-quote' ? '原文没有这句' : '加法把两个数量合并。', sha256: mode === 'wrong-hash' ? 'wrong' : hash(source) });
    });
    assert.ok(has(result, 'verified-citation'));
  }
});
test('unreadable files cannot become evidence', async () => {
  const result = await runScenario(find('unreadable-source'), ({ input, tools }) => tools.cite({ path: input.sourcePath, quote: '编造', sha256: hash('') }));
  assert.ok(has(result, 'unreadable-source'));
});
test('unverified gap claims and unrelated writes do not satisfy required evidence', async () => {
  const gap = await runScenario(find('unreadable-source'), ({ input, tools }) => {
    tools.readFile(input.rulesPath); tools.reportGap(input.sourcePath, '声称无法读取但没有尝试');
  });
  assert.ok(has(gap, 'explicit-gap'));
  const write = await runScenario(find('read-before-write'), ({ tools }) => tools.writeFile('unrelated.md', '旁支记录'));
  assert.ok(has(write, 'missing-action'));
});
test('path traversal is rejected by the virtual file tools', async () => {
  const result = await runScenario(find('reread-current'), ({ tools }) => tools.readFile('../private.txt'));
  assert.ok(has(result, 'path')); assert.ok(has(result, 'adapter-error'));
});
test('mutating returned input or tool arguments cannot rewrite recorded evidence', async () => {
  const result = await runScenario(find('wrong-logic'), ({ input, tools }) => {
    tools.readFile(input.rulesPath); tools.readFile(input.answerPath);
    input.files[input.answerPath] = '伪造正确答案';
    const rows = [pass('q1')]; tools.assess(rows); rows[0].logic = 'FAIL';
  });
  assert.equal(result.events.find(e => e.type === 'assess').rows[0].logic, 'PASS');
  assert.ok(has(result, 'rubric'));
});
test('invalid token/cost metadata fails and absent usage stays absent', async () => {
  const invalid = await runScenario(find('normal-round-limit'), () => ({ usage: { costUSD: -1 } }));
  assert.ok(has(invalid, 'adapter-error'));
  assert.equal(Object.hasOwn(await runScenario(find('normal-round-limit'), positive), 'usage'), false);
});
test('suite schema rejects duplicates and invalid reference grades', () => {
  assert.throws(() => validateSuite({ ...suite, scenarios: [suite.scenarios[0], suite.scenarios[0]] }), /duplicate/);
  const broken = structuredClone(suite); broken.scenarios[0].expected.assessments[0].concept = 'OK';
  assert.throws(() => validateSuite(broken), /rubric/);
});
test('summaries count failing scenarios per rule, not repeated messages', () => {
  assert.deepEqual(summarize([{ passed: false, findings: [{ rule: 'x' }, { rule: 'x' }] }]).failuresByRule, { x: 1 });
});

test('CLI records fixture provenance and continues after crashed/timed-out adapters', () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'steps-eval-cli-'));
  const cli = fileURLToPath(new URL('../tools/behavior-eval.mjs', import.meta.url));
  const fixture = fileURLToPath(new URL('../evals/behavior/fixture-adapter.mjs', import.meta.url));
  const invoke = args => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', timeout: 20000 });
  try {
    const suitePath = resolve(dir, 'suite.json');
    writeFileSync(suitePath, JSON.stringify({ ...suite, scenarios: suite.scenarios.slice(0, 2) }));
    const args = ['--suite', suitePath, '--model', 'fixture-only', '--out', resolve(dir, 'report')];
    assert.equal(invoke(['--adapter', fixture, ...args]).status, 0);
    const report = JSON.parse(readFileSync(resolve(dir, 'report.json'), 'utf8'));
    assert.equal(report.runKind, 'fixture-self-test'); assert.equal(report.summary.total, 2);
    assert.equal(report.suiteSha256, hash(readFileSync(suitePath, 'utf8')));
    for (const [name, code, rule, timeout] of [
      ['crash', 'export async function run() { process.exit(9); }', 'adapter-process', '2000'],
      ['timeout', 'export async function run() { setInterval(() => {}, 1000); await new Promise(() => {}); }', 'adapter-timeout', '200'],
      ['import-timeout', 'setInterval(() => {}, 1000); await new Promise(() => {}); export async function run() {}', 'adapter-timeout', '200'],
    ]) {
      const adapterPath = resolve(dir, name + '.mjs');
      writeFileSync(adapterPath, code);
      const run = invoke(['--adapter', adapterPath, '--timeout-ms', timeout, ...args]);
      assert.equal(run.status, 1, run.stderr);
      const failed = JSON.parse(readFileSync(resolve(dir, 'report.json'), 'utf8'));
      assert.equal(failed.summary.failed, 2);
      assert.ok(failed.results.every(r => has(r, rule)));
    }
    assert.equal(invoke(['--adapter']).status, 2);
    assert.equal(invoke(['--unknown']).status, 2);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
