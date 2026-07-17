# Edge 商店宣传物料 · Store assets

微软 Edge 加载项商店（Partner Center）用图，中英各一套。全部由 `build/store.html` 精确排版渲染，**尺寸即商店要求的精确像素**。

## 目录

```
assets/store/
├─ build/store.html      # 合成源（所有帧，一帧一个 #id）
├─ zh/                   # 中文一套
│  ├─ tile-small-440x280.png     小促销磁贴
│  ├─ tile-large-1400x560.png    大型促销磁贴
│  └─ screenshot-1..6-1280x800.png  截图（最多 6 张）
└─ en/                   # 英文一套（同上）
```

## 尺寸对照（商店字段 → 文件）

| 商店字段 | 尺寸 | 文件 |
| --- | --- | --- |
| 小促销磁贴 | 440×280 | `tile-small-440x280.png` |
| 大型促销磁贴 | 1400×560 | `tile-large-1400x560.png` |
| 屏幕截图（≤6） | 1280×800 | `screenshot-1..6-1280x800.png` |

## 6 张截图内容（中/英一致）

> 现有 **7 张**候选，Edge 商店**最多放 6 张**——发布时挑 6 张。若只留 6，建议去掉 6（悬浮工具盘）或 3（高级样式）。

1. 圈选标注 / Annotate — `03-pins-card`
2. 直接改样式·文案 / Edit in place — `02-annotate`
3. 高级样式 / Advanced styles — `05-advanced-styles`
4. 移动预览 / Move & preview — `06-move-selbox`
5. 一键复制=AI清单 / Copy as AI task list — `08-copy-text`
6. 悬浮工具盘 / Floating toolbar — `01-toolbar-expanded`
7. 富文本编辑 / Rich-text editing — 合成 mock（仓库无真实截图）

截图取自仓库真实 UI：`assets/screenshots/live/{zh,en}`（第 7 张为 HTML mock）。

## 重新渲染

改 `build/store.html` 后，按帧渲染（先出 2x 再由脚本超采样到精确像素）：

```bash
node scripts/shot-html.mjs assets/store/build/store.html <W> <H> <out.png> "#<id>"
# 例：node scripts/shot-html.mjs assets/store/build/store.html 1400 560 assets/store/zh/tile-large-1400x560.png "#zh-tile-l"
# 渲染输出为 2x，再用 sharp resize 到精确尺寸（见提交时的批处理）
```

frame id：`{zh,en}-tile-s`、`{zh,en}-tile-l`、`{zh,en}-s1..s6`。

## 备注

- 品牌：鸽子 mark + `PigeonDeck` 字标，金 `#b8842c` / 墨黑 `#1c1e22` / 米白，无 emoji。
- 与小红书九图（`assets/covers/`）、落地页（`site/`）视觉统一。
