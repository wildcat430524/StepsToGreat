# StepsToGreat

[简体中文](./README.md) · English

**Open one folder and start learning with the AI client you already use.**

Give the tutor a goal. It starts with one small question, teaches from your answers, and saves your original work, feedback, and next step in Markdown. Come back later, open the same folder, and say “continue.”

[Start learning](#start) · [See a tutoring exchange](#core-rules-at-a-glance) · [Install the Skill](https://github.com/wildcat430524/Steps2Great-skill)

[![Content check](https://github.com/wildcat430524/StepsToGreat/actions/workflows/check.yml/badge.svg)](https://github.com/wildcat430524/StepsToGreat/actions/workflows/check.yml)
[![Code MIT](https://img.shields.io/badge/code-MIT-blue.svg)](./LICENSE)
[![Docs CC BY 4.0](https://img.shields.io/badge/docs-CC%20BY%204.0-lightgrey.svg)](./LICENSE-DOCS)

## Start

1. Download and extract the project. [Download ZIP](https://github.com/wildcat430524/StepsToGreat/archive/refs/heads/main.zip)
2. Open the **whole folder** in an AI client that can read and write local files. [Client setup guide](./教程/02-agent-setup-guide.en.md)
3. Tell the tutor what you actually want to learn today.

```text
Please read AGENTS.md first. I know Python loops and get confused by negative indices.
I want to read list slices. I have 15 minutes today.
```

Answer in chat or in the current round’s answer file. For formal practice, the tutor records your original answer, re-reads the question and your work, and gives feedback.

## Core rules at a glance

**Example exchange**

> **Tutor**　There are three items in `["milk", "bread", "eggs"]`. What would `items[-2:]` keep?
>
> **Learner**　Bread. −2 is the second item from the end.
>
> **Tutor**　You found the starting point. `-2` points to bread. The blank after the colon tells the slice to go all the way to the end. What comes after bread?

The tutor sets 1–3 questions per formal round and reviews all your answers together. It can fix and explain a typo. For a misconception, it gives a focused hint so you can work through it. You advance after passing the applicable checks for concept, logic, and expression. The files keep both your original work and revisions. [Full learning workflow](./docs/learning-workflow.en.md) · [Five-minute walkthrough](./示例/演示学科/README.md)

## Learning view: two separate layers

Module progress counts units that have passed final assessment. The checklist records the skills you have demonstrated for this specific goal.

**Python lists · 1 of 4 units mastered (illustration)**

![One out of four Python list units mastered](./docs/assets/module-progress-compact-1-of-4.svg)

**Small goal · Read slices with negative indices**

- [x] Find the starting position of a negative index
- [ ] Independently predict the result of a slice with no end index

When you finish a goal, the tutor names what you can now do and gives you a place to stop. [Progress rules](./协议/06_小目标进度.en.md)

## Install

The teaching protocol is Markdown. You need an AI client with local file access. Node.js runs the optional helper scripts. To upgrade an existing study folder, follow the migration guide to retain your rules, records, and original answers. [Five-minute setup](./教程/01-five-minute-setup.en.md) · [Client compatibility](./docs/AGENT-COMPAT.md) · [Upgrade guide](./docs/UPGRADE.md)

## Teach from your own material

Put your notes or textbook in `资料/` and name the section you want to study. The tutor reads that section and its exceptions, then cites the file and section as it teaches. Scanned PDFs may need OCR first. If you have no course material, give the tutor a verifiable primary source. [Materials folder](./资料/README.md) · [Retrieval and citation guide](./docs/material-retrieval.md)

## Two shells, one protocol

| How you want to study | Where to start |
| --- | --- |
| Open a portable Markdown folder | **StepsToGreat** (this repository) |
| Call the tutor from a client that supports Agent Skills | [Steps2Great-skill](https://github.com/wildcat430524/Steps2Great-skill/blob/main/README.en.md) |
| Use a workspace for reading, answers, and tutor chat in DSH Desktop | [DSH learning workbench](https://github.com/wildcat430524/dsh-stg-learning) |

The folder and Skill share the teaching protocol. The Skill can create a standalone project, so the entry point, protocol, and your study records move together.

## FAQ

- **How do I continue with a new AI client?** Open the same folder and say “continue.” The Markdown files saved in `我的学习/` carry your progress.
- **How do I keep my preferences?** Put a rule such as “one question at a time” in your personal settings file. [Personal rules](./我的学习/我的规则.en.md)
- **Does it cost money?** The protocol is free to use. Your client or model provider sets its own prices. [Full FAQ](./docs/readme-details.en.md#full-faq)

## Verification and evaluation

Regression tests cover re-reading current answers, grading a whole round, preserving original work, and citing sources. Simulations exercise the tutoring workflow. Measuring learning gains requires studies with real learners. [Evaluation method](./docs/behavior-evaluation.md) · [Simulations](./docs/simulations/) · [End-to-end report](./docs/E2E-RUN-REPORT.md)

## Going deeper

- **Explore the design.** [Expanded guide](./docs/readme-details.en.md) · [Design decisions](./docs/adr/) · [State machine](./协议/04_状态机.en.md)
- **See what the tutor reads.** [AGENTS.md](./AGENTS.md) · [Tutor protocol](./协议/00_导师协议.en.md) · [Subject packs](./学科包/README.en.md)
- **Contribute from experience.** Try a round with your own material. Star the project if it helps, or share a reproducible case if grading, citation, or resuming a lesson breaks. [Contributing guide](./CONTRIBUTING.md) · [Report an issue](https://github.com/wildcat430524/StepsToGreat/issues)

## License

Code is [MIT](./LICENSE). The protocol, subject packs, tutorials, and templates are [CC BY 4.0](./LICENSE-DOCS). Please keep attribution when redistributing the teaching material.
