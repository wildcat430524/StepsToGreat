# StepsToGreat

简体中文 · [English](./README.en.md)

**打开一个文件夹，用你手头的 AI 开始一对一学习。**

告诉导师你想学什么。它从一个小问题开始，按你的回答讲解和出题，把原答、反馈与下一步保存在 Markdown 里。隔几天再回来，打开同一个文件夹说「继续」。

[开始学习](#开始) · [看一轮示例](#核心规则摘要) · [安装 Skill 版](https://github.com/wildcat430524/Steps2Great-skill)

[![内容质检](https://github.com/wildcat430524/StepsToGreat/actions/workflows/check.yml/badge.svg)](https://github.com/wildcat430524/StepsToGreat/actions/workflows/check.yml)
[![代码 MIT](https://img.shields.io/badge/代码-MIT-blue.svg)](./LICENSE)
[![文档 CC BY 4.0](https://img.shields.io/badge/文档-CC%20BY%204.0-lightgrey.svg)](./LICENSE-DOCS)

## 开始

1. 下载并解压这个项目。[下载 ZIP](https://github.com/wildcat430524/StepsToGreat/archive/refs/heads/main.zip)
2. 用能读写本地文件的 AI 客户端打开解压后的**整个文件夹**。[各工具接入](./教程/02-各工具接入指南.md)
3. 发一句你今天真想学的事。

```text
请先读 AGENTS.md。我会 Python 循环，看到负数索引就容易混淆。
我想学会读列表切片，今天有 15 分钟。
```

可以在聊天里答题，也可以把答案写进当前轮的回答文档。正式作答时，导师会保存你的原文、重读题目和答案，再给反馈。

## 核心规则摘要

**一轮对话示意**

> **导师**　有三件商品 `["牛奶", "面包", "鸡蛋"]`。只看 `items[-2:]`，你觉得会留下哪几件？
>
> **学生**　面包。-2 是倒数第二件。
>
> **导师**　你找对了起点，`-2` 指向面包。冒号后面空着，表示从起点一直取到末尾。沿着清单往后走，面包之后还有哪一件？

正式练习每轮出 1–3 题，导师一次给全本轮反馈。笔误可以直接修正并解释原因，核心概念错了就给一个针对性的提示，让你接着推。概念、逻辑、表达的适用维度都通过后才推进，原答和后续修订都留在文件里。[完整学习流程](./docs/learning-workflow.md) · [五分钟演示](./示例/演示学科/README.md)

## 学习视图：两层进度分开

模块进度记录通过最终评估的知识单元。本次清单记录当前小目标里已经用作答证据验证的技能。

**Python 列表 · 已掌握 1/4 个单元（示意）**

![Python 列表已掌握 4 个单元中的 1 个](./docs/assets/module-progress-compact-1-of-4.svg)

**小目标｜读懂负数切片**

- [x] 找到负数索引对应的起点
- [ ] 独立预测省略终点时的切片结果

小目标完成时，导师会告诉你现在能做什么并给出自然停点。[进度规则](./协议/06_小目标进度.md)

## 安装

教学协议是 Markdown。你需要一个支持本地文件读写的 AI 客户端，Node.js 仅用于可选的辅助脚本。在已有学习目录上升级，按迁移指南保留规则、档案和原答。[五分钟上手](./教程/01-五分钟上手.md) · [客户端兼容性](./docs/AGENT-COMPAT.md) · [升级指南](./docs/UPGRADE.md)

## 用你自己的资料教

把讲义或教材放进 `资料/`，告诉导师要学哪一节。导师会先读对应章节及其中的例外，再教并注明文件和小节。扫描版 PDF 建议先做 OCR。没有教材时，给导师一个可核对的一手来源。[资料说明](./资料/README.md) · [检索与引用方法](./docs/material-retrieval.md)

## 同一套协议的两个壳

| 你怎么学 | 入口 |
| --- | --- |
| 想用一个可带走的 Markdown 文件夹 | **StepsToGreat**（本仓库） |
| 想在支持 Agent Skills 的客户端里调用导师 | [Steps2Great-skill](https://github.com/wildcat430524/Steps2Great-skill) |
| 想在 DSH 桌面里使用阅读、作答和老师对话界面 | [DSH 学习工作台](https://github.com/wildcat430524/dsh-stg-learning) |

文件夹版和 Skill 版共用教学协议。Skill 可以生成独立学习项目，连同本地入口、协议与学习记录一起搬到另一个客户端。

## 常见问题

- **换客户端时怎样接着学？** 用新客户端打开原目录，说「继续」。已写入 `我的学习/` 的 Markdown 文件是接续依据。
- **怎样固定我的学习偏好？** 例如「每次只出一道题」，可以写进自己的规则文件。[我的规则](./我的学习/我的规则.md)
- **项目收费吗？** 协议可免费使用，模型与客户端费用按所用服务的计费方式计算。[更多问题](./docs/readme-details.md#常见问题全文)

## 验证与评测

回归测试覆盖重读当前回答、按轮评估、保留原答和引用来源等行为。仿真记录用于验证导师流程，真人学习效果仍需学习者测试。[行为评测方法](./docs/behavior-evaluation.md) · [仿真案例](./docs/simulations/) · [端到端报告](./docs/E2E-RUN-REPORT.md)

## 想深入看这里

- **了解设计。** [完整说明](./docs/readme-details.md) · [设计决策](./docs/adr/) · [状态机](./协议/04_状态机.md)
- **查看导师入口。** [AGENTS.md](./AGENTS.md) · [导师协议](./协议/00_导师协议.md) · [学科包](./学科包/README.md)
- **参与贡献。** 用自己的资料走一轮。觉得有用可以点 Star，遇到漏判、引用问题或无法续学时，欢迎提交可复现的例子。[贡献指南](./CONTRIBUTING.md) · [反馈问题](https://github.com/wildcat430524/StepsToGreat/issues)

## 许可

代码采用 [MIT](./LICENSE)，协议、学科包、教程与模板采用 [CC BY 4.0](./LICENSE-DOCS)。转载教学文档时请保留署名与出处。
