#!/usr/bin/env node
// Seed an existing first lesson; tutor turns and student submissions are separate.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const out = resolve(process.argv[2] ?? resolve(repo, '../s2g-learning-simulations/2026-09-30'));
if (existsSync(out)) throw new Error('Use a new output directory; never overwrite an existing simulation');
mkdirSync(out, { recursive: true });
const write = (root, path, text) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, text, 'utf8'); };
const sha = text => createHash('sha256').update(text).digest('hex');
const source = `# Python 列表测试讲义

这是测试维护者撰写的简短教学材料，并非 Python 官方文档原文。
核对来源：Python Tutorial §3.1.3 Lists 与 §9.1 A Word About Names and Objects。
https://docs.python.org/3.13/tutorial/introduction.html#lists
https://docs.python.org/3/tutorial/classes.html#a-word-about-names-and-objects
核验日期：2026-09-30；例子另外在本机 Python 3.11.9 执行核对。

## 1. 名字与可变列表
赋值让名字指向对象。a = [1, 2] 后执行 b = a，不会产生第二个列表。
通过 b.append(3) 改动列表，a 也能看到 [1, 2, 3]。
重新执行 b = [9] 只改变 b 的指向，不修改 a 指向的列表。

## 2. 浅拷贝及其边界
a[:] 或 a.copy() 创建新的外层列表，里面保存的是原元素的引用。
如果 a = [["A"], ["B"]]，b = a[:]，两个外层列表不同，但 a[0] 与 b[0] 仍是同一个内层列表。
b[0].append("C") 修改共享内层列表，a 也变为 [["A", "C"], ["B"]。
b.append(["D"]) 只给 b 的外层添加元素，不给 a 的外层添加元素。
这不等于复制所有层。本文不要求学生使用尚未学习的深拷贝模块。

## 3. 修改与重新绑定
b[0] = ["X"] 只替换 b 的外层槽位，a[0] 仍指向原先内层列表。
b[0].append("X") 则修改该槽位指向的内层列表，两者操作层级不同。

## 4. 边界与表达
对空列表使用 a[:] 得到新的空列表。空列表没有第一个元素，不能直接访问 a[0]。
代码表达需要配对括号。明显缺一个右括号可局部修复并解释，不能把概念错误代答后判掌握。
用外行能懂的盒子或名单例子解释，需说明新外层和共享内层的区别。
`;
const lessonPath = '我的学习/学科/Python/01-列表共享与浅拷贝';
const guide = `# Python #1 列表共享与浅拷贝

目标：修改一份名单时，能判断是否会影响原名单；已会列表索引和 append。
依据：出自 Python列表测试讲义.md 第 1–3 节。

## 本课解释
b = a 给同一个列表另取名字。b = a[:] 建立新外层，内层对象仍可能共享。
不要把修改内层与给外层追加元素混为一谈。详见资料讲义第 2–3 节。

## 第一轮 · 问题 1
执行 a = [1, 2]; b = a; b.append(3)，写出 a 和 b 的内容，解释为什么。

## 第一轮 · 问题 2
执行以下代码，分别写出两次 print 的结果，并解释共享了什么、没有共享什么：

\`\`\`python
groups = [["A"], ["B"]]
backup = groups[:]
backup[0].append("C")
backup.append(["D"])
print(groups)
print(backup)
\`\`\`

本轮通过后才发下一轮，计划接着做操作题和一题费曼收尾。
`;
const answers = `# Python #1 学生回答

## 第一轮 · 问题 1
你的回答：a 和 b 都是 [1, 2, 3]。b = a 让两个名字指向同一个列表，append 改的是同一个列表。

## 第一轮 · 问题 2
你的回答：groups 输出 [['A'], ['B']]，backup 输出 [['A', 'C'], ['B'], ['D']]。
[:] 已经把里面的列表全部独立复制了，所以 backup 的任何修改都不会影响 groups。

## 最终复评结果
（整课所有轮次通过后由导师填写）

## 正确答案与解析
（评估完成后由导师填写）
`;
const profile = `# 学习档案

## 📋 学生信息
| 项目 | 内容 |
|---|---|
| 学习开始日期 | 2026-09-30 |
| 当前学科 | Python |
| 使用的学科包 | 编程 |
| 先前基础 | 已会列表索引和 append；浅拷贝的内层共享理解不稳 |
| 目标 | 能解释并修改名单，避免误改原数据 |
| 每天可投入 | 30 分钟 |
| 协议版本 | 1 |

## 🚦 当前交接状态
| 项目 | 当前状态 |
|---|---|
| 当前学科 | Python |
| 当前课次 | #1 列表共享与浅拷贝 |
| 最近完成 | 初始摸底（测试维护者预置，不是本次导师运行所得） |
| 教学文档 | ${lessonPath}/01_教学引导.md |
| 回答文档 | ${lessonPath}/01_学生回答.md |
| 当前进度 | 第一轮两题已提交，等待评估 |
| 接手后的第一步 | 重新读取当前回答，评估本轮两题 |
| 推进条件 | 本轮适用维度全通过才发下一轮 |

## 📊 知识点掌握情况
| 知识点 | 状态 | 评估日期 | 备注 |
|---|---|---|---|
| （尚未开始） | — | — | 本课尚未掌握 |

## ⏳ 待办：复评与复习
| 事项 | 触发条件 | 安排 | 证据入口 | 状态 |
|---|---|---|---|---|
| （暂无） | — | — | — | — |

## 📚 课次 ↔ 文档索引
| 课次 | 知识点 | 教学文档 | 回答文档 |
|---|---|---|---|
| #1 | 列表共享与浅拷贝 | ${lessonPath}/01_教学引导.md | ${lessonPath}/01_学生回答.md |

## 🕰 历史区
初始摸底：由测试维护者设定基础。尚未检验首次需求收集流程。
`;
const manifest = { date: '2026-09-30', kind: 'controlled-student-live-tutor', seed: 'existing-first-lesson', workspaces: {}, protectedFiles: {} };
for (const mode of ['folder', 'skill']) {
  const root = resolve(out, mode); mkdirSync(root);
  if (mode === 'folder') {
    for (const path of ['AGENTS.md', '协议', '学科包', '模板', '_tools', 'tools', 'docs'])
      cpSync(resolve(repo, path), resolve(root, path), { recursive: true });
  }
  const rules = readFileSync(resolve(repo, '我的学习/我的规则.md'), 'utf8');
  write(root, '我的学习/我的规则.md', rules);
  write(root, '我的学习/00-学习档案.md', profile);
  write(root, lessonPath + '/01_教学引导.md', guide);
  write(root, lessonPath + '/01_学生回答.md', answers);
  write(root, '我的学习/学科/Python/00-课程路线.md', '# Python 课程路线\n\n1. 列表共享与浅拷贝（当前）\n2. 循环处理名单（下一课）\n3. 函数处理名单\n');
  write(root, '我的学习/学科/Python/00-摸底测试.md', '# 预置摸底\n\n测试维护者设定：会列表索引与 append，尚未掌握浅拷贝内层共享。不是本次导师实际摸底所得。\n');
  write(root, '资料/Python列表测试讲义.md', source);
  write(root, '资料/索引.md', '# 资料索引\n\n| 文件 | 来源 | 可读性 | 版本 |\n|---|---|---|---|\n| Python列表测试讲义.md | 测试维护者改写，内附官方核对链接 | UTF-8 Markdown，可读 | 2026-09-30 |\n');
  manifest.workspaces[mode] = { root, lessonPath, initialAnswerSha256: sha(answers), sourceSha256: sha(source) };
}
for (const path of ['我的学习/我的规则.md', '我的学习/00-学习档案.md', 'AGENTS.md']) manifest.protectedFiles[resolve(repo, path)] = sha(readFileSync(resolve(repo, path)));
write(out, 'manifest.json', JSON.stringify(manifest, null, 2) + '\n');
write(out, 'seed-answer.md', answers);
write(out, 'seed-profile.md', profile);
console.log(JSON.stringify(manifest, null, 2));
