---
name: git-workflow
description: 什么该提交 / 不该提交，以及提交与分支习惯
---

# 规则：Git 工作流

**只提交产品与规划资产，不提交参考与一次性工作区。**

- **该跟踪**：`docs/`（PRD、UI 文档、conventions/、决策笔记）、`CLAUDE.md`、`.gitignore`、以及后续 PigeonDeck 自身的源码与配置。
- **永不提交**：`reference-projects/`、`ui-extract/`（理由见 [[ignore-policy]]）。
- **提交时机**：仅在用户明确要求时提交或推送，不主动提交。
- **提交信息**：用中文，一句话说清“做了什么”，必要时附简短理由。
- **默认分支**：`main`。一次性、可丢弃的实验放独立分支，不污染 `main`。
