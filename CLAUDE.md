# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 仓库当前阶段（重要）

这是一个**尚未开始编码的规划/规格阶段仓库**。根目录只有两样东西：

- `docs/` — PigeonDeck 的产品规格（PRD、UI 层级、UI 风格、方向决策笔记）。
- `reference-projects/` — 两个**只读参考**的浏览器扩展，不是本产品源码。

根目录**没有** `package.json`、`src/`、`manifest.json` 或任何构建配置。下面“目标工程形态”一节描述的是将要搭建的东西，不是已存在的东西。

## PigeonDeck 是什么

面向网页验收、UI 修改反馈和 AI 编码交付的 Chrome/Edge MV3 浏览器扩展。用户在任意网页上标注、框选区域、直接编辑元素文字/样式、移动组件预览，然后一键“复制文本”（生成 Codex/AI 可执行的任务清单）或“复制图片”（当前视口截图叠加批注）。

核心是从 MarkIt 重建一个更精简、可维护的 TypeScript 版本，借鉴 ClickDeck 的移动/吸附/参考线和 prompt 输出纪律。

## 文档导航（开工前必读）

- [docs/prd.md](docs/prd.md) — **唯一权威规格**。功能需求、状态/数据规则、验收标准、非目标、V1 范围边界。任何实现决策以此为准。
- [docs/ui-hierarchy.md](docs/ui-hierarchy.md) — UI 层级与信息架构：Shadow DOM 分层、四类 UI 表面、工具模式互斥关系、各面板从属关系。
- [docs/ui-style.md](docs/ui-style.md) — 视觉气质（宣纸感、淡墨绿点睛色）与硬性禁止项（无 emoji、无写实鸽子、无玻璃拟态等）。
- [docs/ui-preview-prompt.md](docs/ui-preview-prompt.md) — 用于生成单页 HTML UI 预览草稿的提示词（预览本身可能尚未生成）。
- [docs/markit-redevelopment-notes.md](docs/markit-redevelopment-notes.md) — **方向决策笔记**。产品方向的“真相源”，见下方工作约定。
- [docs/conventions/INDEX.md](docs/conventions/INDEX.md) — **项目规范索引**。颗粒化规范（git 工作流、忽略策略、文件管理），每条规则一个文件。开工前读一遍。

## 关键工作约定（不在代码里、容易踩坑）

- **规范是颗粒化的、需自更新**：项目规范放在 [docs/conventions/](docs/conventions/INDEX.md)，每条规则一个文件 + `INDEX.md` 索引。**新增或变更任何项目规范时，必须建/改对应单规则文件，并同步更新 `INDEX.md`**——文档不会自更新，靠这条纪律维护。
- **方向决策写入笔记文件**：重要的产品方向、取舍决策必须记录到 [docs/markit-redevelopment-notes.md](docs/markit-redevelopment-notes.md)，不能只停留在聊天里。
- **重大分叉用选择式提问**：遇到重要的分叉或取舍，优先用 choice/input 式提问（AskUserQuestion），而不是只在纯文本里问。
- **`reference-projects/` 不得进入提交**：实现开始前必须把它移出 git 索引（保留本地文件）并加入忽略规则。它不是产品源码。
- **不拆改 MarkIt 的 `content.js`**：它是打包后的产物，作为行为参考；需要时从可读源文件重建，绝不直接编辑/拆分这个 bundle。
- **本仓库当前不是 git 仓库**（`git` 未初始化）。除非用户明确要求，不要 stage/commit/处理 git 索引。

## 参考项目（只读，不要当作产品源码改）

### `reference-projects/markit/` — 主要行为参考

MarkIt 的**已解包扩展产物**（无 TS 源码、无 sourcemap）：`content.js`（263KB 打包脚本）、`popup.html/js`、`service-worker.js`、`manifest.json`。参考其标注、元素编辑、区域批注、popup 行为、右键菜单、file 页面支持。

### `reference-projects/clickdeck/` — 移动/吸附/prompt 参考 + 工程结构样板

ClickDeck 是**有完整 TS 源码**的 MV3 扩展，PigeonDeck 的工程形态以它为模板。重点参考：
- 移动组件：`src/content/intent-*.ts`（draft-panel、ghost、overlay、region）、`selection.ts`、`visual-units.ts`（视觉组件块粒度）、`region-context.ts`。
- prompt 输出纪律：`src/export/intent-prompt.ts`、`unified-prompt.ts`、`change-summary.ts`。
- 工程结构：`src/{background,content,export,shared,state,diagnostics}/`，每个模块旁边配 `*.test.ts`（vitest）。

注意 PRD 明确**不复制** ClickDeck 的重型部分（多种导出路径、PDF/长图导出、演示模式等）。ClickDeck 的 ghost/预览思路要改为**移动真实元素预览**。

## 目标工程形态（将要搭建，参照 ClickDeck）

PRD 指定技术栈为 **Vite + TypeScript + Manifest V3**。实现时应复刻 ClickDeck 的构建模式：

```bash
npm install
npm run build       # vite build → dist/（在浏览器扩展页加载 dist/，需开启开发者模式）
npm run dev         # vite build --watch
npm run typecheck   # tsc --noEmit
npm test            # vitest run src（单测与源码同目录，*.test.ts）
npm run e2e         # playwright test
```

预期约定（来自 ClickDeck 样板）：
- Vite 多入口构建：`background`（service worker）+ `content`，输出扁平为 `[name].js`。
- `tsconfig` 开启 `strict`、`noUnusedLocals`、`noUnusedParameters`；module resolution 用 `Bundler`。
- 运行单个测试文件：`npx vitest run src/content/<file>.test.ts`；单个用例用 `-t "<name>"`。
- `manifest.json` 放 `public/`，用 `default_locale` + `__MSG_*__` 做中英文；静态资源经 `web_accessible_resources` 暴露。

## 架构要点（需要跨多个文档才能拼出的全局图）

- **Shadow DOM 隔离**：所有页面内 UI 挂在一个 Shadow Root 下，分四层——Control（悬浮球/工具盘）、Panel（批注/区域/设置/清空确认面板）、Overlay（hover 高亮、选中框、区域框、编号、连线、移动预览、参考线）、Feedback（按钮内反馈、轻提示）。避免网页 CSS 与插件互相污染。
- **单一激活模式**：标注 / 移动 / 设置三种模式互斥；复制文本、复制图片、清空是瞬时动作，不占用模式。切换工具只退出当前交互，不清除已保存的批注/编辑/移动预览。
- **状态生命周期按标签页会话**：页面键 = 完整 URL。同一 tab 刷新同一 URL 自动恢复可定位的标注/编辑/移动预览；找不到目标时**不乱改页面**，只轻提示，但任务记录保留、复制文本仍包含该意图。关闭 tab 清理会话。
- **撤销/重做覆盖全部编辑操作**（标注、区域、直接编辑、移动、清空），默认上限 50 步。编号在会话内删除不重排，清空后从 1 重置。
- **移动任务合并规则**：同一组件多次移动，**复制文本只输出“初始位置 → 最终位置”**，但撤销历史保留每一步。
- **复制文本输出纪律**（核心交付物）：任务清单格式，含页面上下文 + 全局编辑规则 + 操作列表 + 每操作定位信息；样式修改以“人类指令 + CSS 属性前后值表”输出；移动任务须含 Source/Target/初始/最终位置 + 吸附或 free move 状态。**必须提示 AI：视觉坐标只是定位线索，不要硬编码 `top/left`，优先用现有布局/flex/grid/gap/margin/order**。
- **复制图片**：只产图、不附文本，默认当前视口，叠加截图+编号+连线+区域框+移动预览。

## V1 明确不做（避免过度实现）

不保留 MarkIt 的 Dev/Prototype 双模式；不做 Markdown 导出、下载截图、多模板输出；不做多套 pin 样式、多主题、输出详细度等高级设置；不默认对复制内容脱敏；不生成最终 UI 视觉定稿（UI 风格仍需单独确认）。PDF 页面 V1 只提示不支持。
