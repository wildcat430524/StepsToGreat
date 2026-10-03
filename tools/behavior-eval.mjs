#!/usr/bin/env node
// Deterministic checks over tool calls recorded by the harness, not model claims.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';

const HERE = dirname(fileURLToPath(import.meta.url));
export const hash = value => createHash('sha256').update(value).digest('hex');
export const defaultSuite = resolve(HERE, '../evals/behavior/scenarios.json');
const grades = new Set(['PASS', 'WARN', 'FAIL', 'NA']);
const dimensions = ['concept', 'logic', 'expression'];

export function validateSuite(suite) {
  if (suite?.schemaVersion !== 1 || !Array.isArray(suite.scenarios) || !suite.scenarios.length)
    throw new Error('Expected schemaVersion 1 and a nonempty scenarios array');
  const ids = new Set();
  for (const s of suite.scenarios) {
    if (!s.id || ids.has(s.id)) throw new Error('Missing or duplicate scenario id');
    ids.add(s.id);
    if (!s.input?.message || !s.input.files || !s.expected || !Array.isArray(s.expected.required))
      throw new Error(`Invalid scenario: ${s.id}`);
    for (const [path, content] of Object.entries(s.input.files)) {
      if (!validPath(path) || (typeof content !== 'string' && content !== null))
        throw new Error(`Invalid virtual file: ${path}`);
    }
    if (!Number.isInteger(s.expected.maxQuestions) || s.expected.maxQuestions < 1 || s.expected.maxQuestions > 3)
      throw new Error(`Invalid question limit: ${s.id}`);
    for (const action of s.expected.required) {
      if (!['assess', 'publish', 'write', 'cite', 'gap'].includes(action)) throw new Error(`Unknown required action: ${action}`);
    }
    for (const row of s.expected.assessments ?? []) {
      if (!row.id || dimensions.some(d => !grades.has(row[d]))) throw new Error(`Invalid rubric: ${s.id}`);
    }
  }
  return suite;
}

function validPath(path) {
  return typeof path === 'string' && path.length > 0 && !path.includes('\\') &&
    !path.startsWith('/') && !path.includes(':') && !path.split('/').some(p => p === '..' || p === '.' || !p);
}

export async function runScenario(scenario, adapter, protocol = '') {
  const files = new Map(Object.entries(scenario.input.files));
  const observed = new Map();
  const events = [];
  const findings = [];
  let roundPassed = false;
  let published = false;
  let assessed = false;
  const start = performance.now();
  const fail = (rule, detail) => findings.push({ rule, detail });
  const record = (type, data = {}) => events.push({ index: events.length, type, ...structuredClone(data) });
  const pathCheck = path => {
    if (!validPath(path)) { fail('path', 'Virtual paths must stay inside the workspace'); throw new Error('Invalid path'); }
  };
  const freshRead = path => typeof files.get(path) === 'string' && observed.get(path) === hash(files.get(path));
  const tools = Object.freeze({
    readFile(path) {
      pathCheck(path);
      const content = files.get(path);
      if (typeof content !== 'string') {
        record('read-error', { path });
        throw new Error(`File missing or unreadable: ${path}`);
      }
      observed.set(path, hash(content));
      record('read', { path, sha256: hash(content) });
      return content;
    },
    writeFile(path, content) {
      pathCheck(path);
      if (typeof content !== 'string') throw new Error('content must be a string');
      const before = files.get(path);
      if (files.has(path) && !freshRead(path)) fail('read-before-write', `No current read of ${path}`);
      if (path === scenario.input.answerPath && typeof before === 'string' && !content.startsWith(before))
        fail('preserve-history', `Existing answer/history changed: ${path}`);
      files.set(path, content);
      record('write', { path, beforeSha256: typeof before === 'string' ? hash(before) : null, sha256: hash(content) });
    },
    assess(rows) {
      if (assessed) fail('single-assessment', 'Assess the complete submission in one call');
      assessed = true;
      if (!Array.isArray(rows)) throw new Error('rows must be an array');
      const answerPath = scenario.input.answerPath;
      if (!answerPath || !freshRead(answerPath)) fail('reread-answer', 'Read the current answer before assessing');
      for (const path of scenario.expected.mustRead ?? []) {
        if (!freshRead(path)) fail('required-read', `Read ${path} before assessing`);
      }
      const ids = rows.map(r => r.id);
      const wanted = scenario.input.questionIds ?? [];
      if (new Set(ids).size !== ids.length || ids.length !== wanted.length || wanted.some(id => !ids.includes(id)))
        fail('complete-assessment', 'Assess every submitted question exactly once');
      let valid = rows.length > 0;
      for (const row of rows) {
        if (dimensions.some(d => !grades.has(row[d])) || dimensions.every(d => row[d] === 'NA')) {
          fail('dimensions', `Invalid independent dimensions for ${row.id}`); valid = false;
        }
        const expected = scenario.expected.assessments?.find(r => r.id === row.id);
        if (expected && dimensions.some(d => row[d] !== expected[d])) fail('rubric', `Reference labels differ for ${row.id}`);
      }
      roundPassed = valid && ids.length === wanted.length && new Set(ids).size === ids.length &&
        wanted.every(id => ids.includes(id)) && rows.every(row => dimensions.every(d => ['PASS', 'NA'].includes(row[d]))) &&
        !findings.some(f => ['rubric', 'reread-answer', 'required-read'].includes(f.rule));
      record('assess', { rows });
    },
    publishRound(questions) {
      if (!Array.isArray(questions)) throw new Error('questions must be an array');
      if (scenario.input.questionIds?.length && !roundPassed) fail('no-premature-advance', 'Current round has not passed');
      if (published) fail('single-active-round', 'Only one new round can be published per turn');
      published = true;
      if (!questions.length || questions.length > scenario.expected.maxQuestions) fail('question-limit', 'Question count exceeds the active rule');
      if (questions.some(q => q.kind === 'feynman') && questions.length !== 1) fail('feynman-alone', 'Feynman must be the only question');
      if (questions.some(q => typeof q.prompt !== 'string' || !q.prompt.trim() || !['normal', 'feynman'].includes(q.kind)))
        fail('question-shape', 'Every question needs a prompt and supported kind');
      for (const path of scenario.expected.mustRead ?? []) {
        if (!freshRead(path)) fail('required-read', `Read ${path} before publishing`);
      }
      record('publish', { questions });
    },
    cite({ path, quote, sha256 }) {
      pathCheck(path);
      if (path !== scenario.input.sourcePath) fail('verified-citation', 'Citation points to a different source');
      const content = files.get(path);
      if (!freshRead(path) || sha256 !== hash(typeof content === 'string' ? content : '') ||
          typeof quote !== 'string' || !quote.trim() || !content?.includes(quote))
        fail('verified-citation', 'Citation needs a current read, matching hash and exact source excerpt');
      record('cite', { path, quote, sha256 });
    },
    reportGap(path, reason) {
      pathCheck(path);
      if (path !== scenario.input.sourcePath || !events.some(e => e.type === 'read-error' && e.path === path))
        fail('explicit-gap', 'The missing source must have an observed read failure');
      if (typeof reason !== 'string' || !reason.trim()) fail('explicit-gap', 'Explain the missing evidence');
      record('gap', { path, reason });
    },
  });
  let usage;
  try {
    // Expected labels/policies stay in the evaluator; adapters only get the task.
    const result = await adapter({ input: structuredClone(scenario.input), protocol, tools });
    if (result?.usage !== undefined) {
      if (!result.usage || typeof result.usage !== 'object' || Array.isArray(result.usage)) throw new Error('Invalid usage object');
      usage = {};
      for (const key of ['inputTokens', 'outputTokens', 'costUSD']) {
        if (result.usage[key] !== undefined) {
          const value = result.usage[key];
          if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error(`Invalid usage: ${key}`);
          usage[key] = value;
        }
      }
    }
  } catch (error) { fail('adapter-error', error.message); }
  for (const type of scenario.expected.required) {
    if (!events.some(e => e.type === type)) fail('missing-action', `Required action absent: ${type}`);
  }
  if (scenario.expected.required.includes('write') && !events.some(e => e.type === 'write' && e.path === scenario.input.answerPath))
    fail('missing-action', 'Append the evaluation to the designated answer document');
  for (const path of scenario.expected.mustRead ?? []) {
    if (!events.some(e => e.type === 'read' && e.path === path)) fail('required-read', `Never read ${path}`);
  }
  if (scenario.expected.forbidPublish && published) fail('no-premature-advance', 'This scenario must not publish another round');
  if (scenario.expected.forbidCite && events.some(e => e.type === 'cite')) fail('unreadable-source', 'Unreadable material is not a citation');
  return { id: scenario.id, passed: findings.length === 0, elapsedMs: Math.round(performance.now() - start), findings, events, ...(usage ? { usage } : {}) };
}

export function summarize(results) {
  const passed = results.filter(r => r.passed).length;
  const rules = {};
  for (const r of results) for (const rule of new Set(r.findings.map(f => f.rule))) rules[rule] = (rules[rule] ?? 0) + 1;
  return { total: results.length, passed, failed: results.length - passed, passRate: results.length ? passed / results.length : 0, failuresByRule: rules };
}

function markdown(report) {
  const lines = ['# 导师行为评测报告', '', `运行类型：${report.runKind}。这是工具行为与参考标签评测，不是学习效果证明。`, '',
    `通过：${report.summary.passed}/${report.summary.total}；模型标识：${report.model}。`, '',
    `场景 SHA-256：${report.suiteSha256}`, '', `协议 SHA-256：${report.protocolSha256}`, '',
    '| 场景 | 结果 | 耗时 ms | 失败规则 |', '|---|---|---|---|'];
  for (const r of report.results) lines.push(`| ${r.id} | ${r.passed ? 'PASS' : 'FAIL'} | ${r.elapsedMs} | ${[...new Set(r.findings.map(f => f.rule))].join(', ') || '—'} |`);
  return lines.join('\n') + '\n';
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--worker') {
    const payload = JSON.parse(readFileSync(0, 'utf8'));
    const { run, fixture } = await import(pathToFileURL(payload.adapter).href);
    if (typeof run !== 'function') throw new Error('Adapter must export async run({ input, protocol, tools })');
    const result = await runScenario(payload.scenario, run, payload.protocol);
    writeFileSync(payload.resultPath, JSON.stringify({ ...result, fixture: fixture === true }));
    return;
  }
  const allowed = new Set(['--suite', '--adapter', '--protocol', '--model', '--out', '--timeout-ms', '--list', '--help']);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!allowed.has(arg) || Object.hasOwn(options, arg)) throw new Error(`Unknown or duplicate option: ${arg}`);
    if (['--list', '--help'].includes(arg)) options[arg] = true;
    else {
      if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Missing value: ${arg}`);
      options[arg] = args[++i];
    }
  }
  if (options['--help']) {
    console.log('node tools/behavior-eval.mjs --list\nnode tools/behavior-eval.mjs --adapter adapter.mjs --model MODEL --out reports/run [--protocol FILE] [--timeout-ms 30000]\nExit: 0 all pass; 1 behavior failure; 2 invalid input. Adapter modules are trusted executable code.');
    return;
  }
  const suiteText = readFileSync(resolve(options['--suite'] ?? defaultSuite), 'utf8');
  const suite = validateSuite(JSON.parse(suiteText));
  if (options['--list']) { console.log(suite.scenarios.map(s => `${s.id}\t${s.title}`).join('\n')); return; }
  if (!options['--adapter'] || !options['--model'] || !options['--out']) throw new Error('--adapter, --model and --out are required; no default model scores');
  const adapterPath = resolve(options['--adapter']);
  const adapterText = readFileSync(adapterPath, 'utf8');
  const protocol = readFileSync(resolve(options['--protocol'] ?? resolve(HERE, '../AGENTS.md')), 'utf8');
  const timeout = Number(options['--timeout-ms'] ?? 30000);
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 300000) throw new Error('timeout-ms must be 1..300000');
  const { mkdtempSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const dir = mkdtempSync(resolve(tmpdir(), 'steps-behavior-'));
  const results = [];
  try {
    for (const scenario of suite.scenarios) {
      const resultPath = resolve(dir, 'result.json');
      rmSync(resultPath, { force: true });
      const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--worker'], {
        input: JSON.stringify({ scenario, adapter: adapterPath, protocol, resultPath }), encoding: 'utf8', timeout, maxBuffer: 1024 * 1024, windowsHide: true,
      });
      if (child.status === 0 && !child.error) {
        results.push(JSON.parse(readFileSync(resultPath, 'utf8')));
      } else {
        const rule = child.error?.code === 'ETIMEDOUT' ? 'adapter-timeout' : 'adapter-process';
        results.push({ id: scenario.id, passed: false, elapsedMs: rule === 'adapter-timeout' ? timeout : 0,
          findings: [{ rule, detail: child.error?.message ?? `Adapter exited ${child.status}; ${child.stderr.slice(-2000)}` }], events: [] });
      }
      console.error(`${results.at(-1).passed ? 'PASS' : 'FAIL'} ${scenario.id}`);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
  const runKind = results.some(r => r.fixture === true) ? 'fixture-self-test' : 'adapter-run';
  const report = { schemaVersion: 1, runKind, model: options['--model'], suiteVersion: suite.version,
    suiteSha256: hash(suiteText), protocolSha256: hash(protocol), adapterSha256: hash(adapterText),
    createdAt: new Date().toISOString(), summary: summarize(results), results };
  const out = resolve(options['--out']);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(`${out}.json`, JSON.stringify(report, null, 2) + '\n');
  writeFileSync(`${out}.md`, markdown(report));
  console.log(JSON.stringify(report.summary));
  process.exitCode = report.summary.failed ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 2; });
}
