---
name: ignore-policy
description: reference-projects/ 与 ui-extract/ 为何被 git 忽略
---

# 规则：忽略策略

**两类目录永远被 `.gitignore` 排除，不进任何提交。**

- `reference-projects/` —— MarkIt、ClickDeck 只是行为/UI 参考，不是 PigeonDeck 源码。它们有各自的来源与许可，纳入提交既无意义也有版权风险。需要它们时本地保留即可。
- `ui-extract/` —— 参考项目 UI 的运行时捕获工作区（捕获脚本 + 产物画廊）。这是一次性的设计素材准备，throwaway，不属于产品代码。

新增任何“仅本地、不该入库”的目录时，先更新根 `.gitignore`，再在本文件补一句说明为什么。相关提交边界见 [[git-workflow]]。
