// Scripted positive control ONLY. This is not a model/provider integration.
import { createHash } from 'node:crypto';
export const fixture = true;
export async function run({ input, tools }) {
  const rules = tools.readFile(input.rulesPath);
  if (input.task === 'review') {
    const answer = tools.readFile(input.answerPath);
    const rows = input.questionIds.map(id => ({ id, concept: answer.includes('列表是不可变') ? 'FAIL' : 'PASS',
      logic: input.feynman ? 'NA' : answer.includes('2 + 2 = 5') ? 'FAIL' : 'PASS', expression: input.feynman ? 'NA' : 'PASS' }));
    tools.assess(rows);
    if (input.archive) tools.writeFile(input.answerPath, answer + '\n本轮评估：已记录。\n');
  } else if (input.task === 'archive') {
    const answer = tools.readFile(input.answerPath);
    tools.writeFile(input.answerPath, answer + '\n导师评估记录。\n');
  } else if (input.task === 'publish') {
    const count = rules.includes('最多 1 题') || input.feynman ? 1 : 2;
    tools.publishRound(Array.from({ length: count }, () => ({ kind: input.feynman ? 'feynman' : 'normal', prompt: '请用例子说明加法。' })));
  } else if (input.task === 'source') {
    const source = tools.readFile(input.sourcePath);
    tools.cite({ path: input.sourcePath, quote: '加法把两个数量合并。', sha256: createHash('sha256').update(source).digest('hex') });
  } else if (input.task === 'gap') {
    try { tools.readFile(input.sourcePath); }
    catch { tools.reportGap(input.sourcePath, '扫描件未取得可核对的文本，需要先提取并核验原文。'); }
  }
}
