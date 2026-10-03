#!/usr/bin/env node
// Export tool evidence only, never model reasoning or request contexts.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as zlib from 'node:zlib';
import { createHash } from 'node:crypto';
if (process.argv.length !== 5) throw new Error('Usage: node extract-trace.mjs SESSION.zstd EXPECTED_WORKSPACE OUTPUT.json');
if (typeof zlib.zstdDecompressSync !== 'function') throw new Error('This optional DSH log extractor needs Node with built-in Zstandard (tested on Node 24)');
const bytes = readFileSync(resolve(process.argv[2]));
const rows = [];
for (let offset = 0; offset < bytes.length;) {
  const frame = zlib.zstdDecompressSync(bytes.subarray(offset), { info: true });
  if (!frame.engine.bytesWritten) throw new Error('Invalid compressed session');
  offset += frame.engine.bytesWritten;
  for (const line of frame.buffer.toString('utf8').split('\n')) if (line.trim()) rows.push(JSON.parse(line));
}
const header = rows.find(r => r.type === 'session');
if (!header || resolve(header.cwd) !== resolve(process.argv[3])) throw new Error('Session workspace does not match the explicit test workspace');
const results = new Map(rows.filter(r => r.type === 'tool/result').map(r => [r.data.message.toolCallId, r]));
const sha = text => createHash('sha256').update(text).digest('hex');
const calls = rows.filter(r => r.type === 'tool/call').map(row => {
  const { turn, step, name, callId, arguments: encoded } = row.data;
  const args = typeof encoded === 'string' ? JSON.parse(encoded) : encoded;
  const result = results.get(callId);
  const path = args.file_path ?? args.path ?? result?.data.meta?.path;
  return { seq: row.seq, time: row.time, turn, step, name, callId,
    ...(typeof path === 'string' ? { path } : {}),
    ...(args.offset !== undefined ? { offset: args.offset } : {}),
    ...(args.limit !== undefined ? { limit: args.limit } : {}),
    argumentKeys: Object.keys(args), argumentsSha256: sha(JSON.stringify(args)),
    ...(typeof args.content === 'string' ? { contentSha256: sha(args.content) } : {}),
    resultPresent: !!result, isError: result?.data.message.isError ?? null,
    ...(result?.data.meta?.totalLines !== undefined ? { totalLines: result.data.meta.totalLines, returnedLines: result.data.meta.lines } : {}),
  };
});
const turns = [...new Set(calls.map(c => c.turn))].map(turn => {
  const actions = calls.filter(c => c.turn === turn);
  const answerReads = actions.filter(c => c.name === 'read' && /01_学生回答\.md$/.test(c.path ?? '') && c.isError === false);
  const firstRead = answerReads[0];
  const firstAnswerWrite = actions.find(c => ['edit', 'write', 'multi_edit'].includes(c.name) && /01_学生回答\.md$/.test(c.path ?? ''));
  return { turn, calls: actions.length, answerReads: answerReads.map(c => c.seq),
    answerReadBeforeFirstDirectWrite: firstAnswerWrite ? !!firstRead && firstRead.seq < firstAnswerWrite.seq : null,
    note: 'Shell-based writes require separate review; these checks cover direct file tools.' };
});
writeFileSync(resolve(process.argv[4]), JSON.stringify({ sessionId: header.id, cwd: header.cwd, traceSha256: sha(bytes), calls, turns }, null, 2) + '\n');
console.log(JSON.stringify({ sessionId: header.id, turns, toolCalls: calls.length }, null, 2));
