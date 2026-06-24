---
name: file-management
description: 目录归属与文件命名约定
---

# 规则：文件管理

**每类内容有固定归属，命名用小写短横线（kebab-case）。**

- `docs/` —— 所有规划与规范文档。
  - `docs/conventions/` —— 颗粒化规范：每条规则一个文件，外加 `INDEX.md` 索引。
  - 其它产品文档（PRD、UI 层级/风格、决策笔记）直接放 `docs/` 根。
- `reference-projects/` —— 只读参考扩展（被忽略）。
- `ui-extract/` —— UI 提取工作区（被忽略）：`capture/` 放工具，`markit/`、`clickdeck/` 放产物。
- 后续 PigeonDeck 源码按 ClickDeck 样板组织在 `src/`（见根 `CLAUDE.md` 的“目标工程形态”）。

文件命名一律 kebab-case（如 `ui-hierarchy.md`、`git-workflow.md`）。规范文件名应与其 `name:` 头部一致，便于 `[[name]]` 互链。
