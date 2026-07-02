# Changelog

All notable changes to PigeonDeck will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

> **当前阶段：编码进行中。** V1 首个版本号将在功能闭环完成后确定。

### Coding — 阶段 2：工具盘与悬浮球（2026-07-02）

- 模式控制器（`src/content/controller.ts`）：极简状态机 `mode: annotate/move/settings + expanded`，展开自动进入 annotate，move/settings 互斥，收起重置；瞬时动作回调挂点；subscribe() 订阅机制；24 个 vitest 单测全绿
- 悬浮球（`src/content/toolbar.ts`）：42px 邮政金圆形底色 + 白色鸽子 SVG，阴影按 design-system §5.1，默认右下角 16px；点击展开，长按 ≥300ms 拖拽，位置持久化 localStorage，resize 夹紧，刷新恢复
- 单列纵向工具盘：药丸容器（radius 999px、padding 5px、gap 3px），7 按钮（Logo/移动/复制文本/复制图片/撤销重做/清空/设置），SVG 图标从 preview part 02 完整照搬；撤销重做横向合并药丸（42×23），本阶段禁用占位
- 激活态：move/settings 按钮 `--c1-soft` 底 + `--c1-edge` 边框 + 工具盘容器外描边；annotate 默认态无高亮
- Tooltip：hover 显示（130ms），工具盘靠右边缘自动翻到左侧
- 展开方向防截断（裁决12 #9）：向下空间不足时工具盘底边贴视口，内容超视口高则内部滚动（隐藏滚动条）
- i18n：8 个 tooltip key（tb_logo / tb_move / tb_copy_text / tb_copy_image / tb_undo / tb_redo / tb_clear / tb_settings），中英双语同步，`i18n:check` 通过
- E2E 测试基建（`tests/e2e/helpers/extension.ts` + `tests/fixtures/basic.html` + `playwright.config.ts`）：chromium 持久化上下文加载扩展，随机端口本地 HTTP 服务
- E2E 测试：`tests/e2e/toolbar.spec.ts` 6 用例（球尺寸/位置、展开收起、tooltip、激活高亮、拖拽持久化、视口边界防截断）

### Coding — 阶段 1：工程骨架（2026-07-02）

- Vite + TypeScript + MV3 工程落地：双配置顺序构建（content → IIFE，background → ES module），输出扁平 `dist/content.js` + `dist/background.js`
- `manifest.json`（MV3）：`__MSG_*__` 国际化、`default_locale: en`、`storage` 权限、自托管 `update_url` 占位（裁决12 #2）
- Shadow DOM 宿主注入：防重复注入 + 四层容器（Control / Panel / Overlay / Feedback）+ `setTheme()` 亮暗切换出口
- pigeonlib 设计令牌完整移植（`src/content/design-tokens.css`，亮/暗双主题变量 + `interpolate-size: allow-keywords`），逐值与画廊比对一致
- i18n 运行时（构建期打包语言 JSON，运行时可切换，缺失回退 en）+ `scripts/i18n-check.mjs` 完整性校验
- 品牌资产：`public/brand/logo.svg`（画廊鸽子线稿提取）+ 四尺寸 icon PNG（sharp 生成，邮政金圆底）
- 极简分级 logger；vitest 单测 9 例全绿；`build` / `typecheck` / `test` / `i18n:check` 四门禁全过

### Design System — pigeonlib

- 建立完整设计令牌体系（CSS 变量）：色彩 / 字体 / 圆角 / 阴影 / 动效
- 确定邮政金 `#b8842c` 为品牌点睛色
- 确定 Fraunces + 思源宋体 为标题字体栈
- 确定 Lucide Icons 为图标库（内联 SVG）
- 亮/暗双主题完整定义，通过 `data-theme` 属性切换
- 沉淀可复用控件配方：`.pd-color`（色块·色值·取色器）、`.pd-menu`、`.pd-range`

### UI Preview Gallery

- 搭建 UI 组件画廊宿主（`preview/index.html`）
- 产出 **38 张 UI 表面卡**，覆盖全部 V1 交互态：
  - 悬浮球与工具盘（默认态 / 移动态）
  - 批注面板（主态 / 高级样式 / 暗色版）
  - 元素类型适配（文本 / 图片 / 按钮容器 / 陌生元素）
  - 内联编辑与富文本浮条
  - 位号圆与右键上下文菜单
  - 区域框选
  - 移动吸附 / 自由移动 / 参考线
  - 清空确认弹层
  - 设置面板（4 分区：通用 / 交互 / 输出 / 帮助 + 暗色版）
  - hover 标签 / 调色盘 / 轻提示 / Popup / 输出示意
- 完成首轮 + 第二轮 UI 收紧（药丸控件、面板紧凑化、撤销重做合并按钮）
- 高级样式区 4 分类左导航（排版 / 尺寸 / 外观 / 调试）独立成卡
- 调色盘完整实现（色块→展开取色器+局部推荐色+透明度+RGB）

### Documentation

- 完成 V1 实施计划（[docs/v1-plan.md](docs/v1-plan.md)）：15 个实施阶段、文件模块清单、验收标准
- 完成设计系统参考文档（[docs/design-system.md](docs/design-system.md)）
- 完成 11 轮 UI 预览裁决记录（[docs/ui-preview-rulings.md](docs/ui-preview-rulings.md)）
- 建立颗粒化项目规范系统（[docs/conventions/INDEX.md](docs/conventions/INDEX.md)）
- 建立仓库级 CLAUDE.md 索引（项目指令 + 文档导航 + 架构要点）

### Architecture Decisions

- 确定技术栈：Vite + TypeScript + Manifest V3，多入口构建（background + content）
- 确定 Shadow DOM 四层隔离架构（Control / Panel / Overlay / Feedback）
- 确定展开即默认批注模式（无独立批注按钮）
- 确定单列纵向工具盘（7 按钮，仅图标 + hover tooltip）
- 确定合并撤销/重做按钮（左撤销·右重做，默认 50 步上限）
- 确定状态生命周期按标签页会话（URL 键 → 刷新恢复 → 关 tab 清理）
- 确定标注编号删除不重排策略
- 确定同元素多操作合并输出策略
- 确定移动任务合并策略（多次移动 → 初始→最终）
- 确定 OpenDesign 兼容为硬约束
- 确定 V1/V2 功能边界：不做多页面统一导出、多页多图、PDF 支持

---

## [0.1.0] — Design Phase Complete

### Added

- **`preview/`** — UI 组件画廊（38 张表面卡，含 pigeonlib.css + pigeon-components.js）
- **`docs/v1-plan.md`** — V1 实施计划（15 阶段 + 验收标准）
- **`docs/design-system.md`** — 设计令牌与控件规格
- **`docs/ui-preview-rulings.md`** — 11 轮 UI 裁决记录
- **`docs/conventions/`** — 颗粒化项目规范
- **`context/构想蓝图2.md`** — 产品规格完整定义
- **`CLAUDE.md`** — 仓库级 AI 编码指令
- 设计系统 pigeonlib 全套令牌与控件配方
- Light/Dark 双主题完整定义
- V1 架构决策全部落地

---

## Future — Planned for v1.0.0

> 以下为 V1 实施计划中的 15 个开发阶段，将在后续版本中逐步完成。
> 详细验收标准见 [docs/v1-plan.md §4](docs/v1-plan.md#4-验收标准)。

| Phase | Scope |
|-------|-------|
| ~~1~~ | ~~工程骨架：Vite + TS + MV3 + Shadow DOM 宿主 + 设计令牌移植~~ ✅ |
| ~~2~~ | ~~工具盘与悬浮球：Logo 球 + 展开/收起 + 拖拽移位 + 位置持久化~~ ✅ |
| 3 | 批注模式：单击标注 + 修改栏 + 高级样式 + 调色盘 + 批注卡片/位号 |
| 4 | 直接编辑：双击文本编辑 + 内联富文本浮条 + 图片/视频替换 |
| 5 | 区域框选：长按 ≥300ms 拖拽 + 区域批注面板 |
| 6 | 移动模式：选中 + 拖拽 + 吸附/参考线 + 八向缩放句柄 |
| 7 | 撤销/重做：合并按钮 + 全操作覆盖 + Ctrl+Z / Ctrl+Shift+Z |
| 8 | 复制文本：Codex/AI 任务清单生成 + 去重合并 |
| 9 | 复制图片：单页长图 + 批注叠加 |
| 10 | 清空确认：贴工具盘确认弹层 |
| 11 | 设置面板：4 分区 + 贴工具盘 |
| 12 | 安装说明页：首次自动打开 + 设置可重看 |
| 13 | Popup 与后台：Service Worker + 右键菜单 + file:// + PDF 提示 |
| 14 | i18n 完整化：中英双语全覆盖 |
| 15 | 测试：Vitest 单测 + Playwright E2E + 手动冒烟 |

---

[Unreleased]: https://github.com/HELUOO404/PigeonDeck/compare/v0.1.0...HEAD
