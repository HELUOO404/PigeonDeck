# PigeonDeck UI 层级关系

## 1. 设计目的

本文定义 PigeonDeck 的 UI 层级、界面入口、状态关系和信息架构。它不决定最终视觉风格、配色、图标、动效或具体尺寸。

当前已确认的主入口不是单列工具栏，也不是环形菜单，而是：**logo 悬浮球点击后展开紧凑 2x3 工具盘**。

## 2. 顶层界面结构

PigeonDeck 有四类 UI 表面：

1. **页面内主 UI**：注入网页，是主要操作入口。
2. **页面内覆盖层**：用于元素选择、区域框选、批注、移动预览、参考线和轻提示。
3. **浏览器 popup**：用于扩展开关、站点禁用、权限提示和禁用列表入口。
4. **安装说明页**：安装后打开，也可从设置中重新打开。

```text
PigeonDeck
├─ Page Surface
│  ├─ Main Entry
│  │  ├─ Collapsed: Logo Floating Ball
│  │  └─ Expanded: Compact Tool Palette
│  ├─ Context Panels
│  ├─ Page Overlays
│  └─ Inline Feedback
├─ Extension Popup
│  ├─ Current Site Status
│  ├─ Global / Site Disable
│  ├─ Permission Notices
│  └─ Disabled Sites Entry
└─ Onboarding Page
   ├─ Quick Start Flow
   ├─ Example Walkthrough
   └─ Feature Overview
```

## 3. 页面内主入口

### 3.1 收起态：Logo 悬浮球

```text
Logo Floating Ball
└─ Click: expand / collapse Compact Tool Palette
```

规则：

- 收起时页面上只能看到一个纯粹的品牌 logo 悬浮球，不显示文字、工具按钮、提示条或额外装饰。
- 悬浮球作为品牌 logo 和主入口，点击后展开工具盘。
- 悬浮球和展开后的左上角 logo 是同一个入口的不同状态，不是两个同时存在的独立入口。
- 再次点击展开态左上角 logo 收起工具盘。
- 悬浮球位置属于整体插件位置的一部分；展开后由工具盘顶部拖拽把手移动整体插件位置。

### 3.2 展开态：紧凑 2x3 工具盘

展开后显示一个紧凑专业的小型工具盘。原本的 logo 进入工具盘左上角，成为顶部横幅里的品牌锚点。

```text
Compact Tool Palette
├─ Header Banner
│  ├─ Logo / Collapse Entry
│  ├─ Drag Handle
│  └─ History Controls
│     ├─ Undo
│     └─ Redo
└─ Tool Grid 2x3
   ├─ Annotation
   ├─ Move
   ├─ Copy Text
   ├─ Copy Image
   ├─ Clear
   └─ Settings
```

展开与定位规则：

- 点击收起态 logo 后，工具盘默认向右下展开。
- 展开后不再额外保留一个独立悬浮球；入口 logo 只出现在工具盘左上角。
- 如果靠近视口边缘，工具盘保持右下展开方向，但整体向视口内推，确保完整可见。
- 顶部中间的拖拽横条是明确的拖拽把手，用于移动整体插件位置。
- 工具盘手动收起为主；选中工具后不自动收起，方便连续操作。

工具按钮规则：

- 按钮以图标为主，悬停时显示文字。
- 工具顺序按工作流排列：标注、移动、复制文本、复制图片、清空、设置。
- 当前激活工具使用按钮高亮，并在工具盘外层显示轻量描边。
- 复制文本/复制图片的成功或失败反馈在按钮内部短暂变化，不另开大 toast。
- 清空不使用按钮内二段确认，改为贴工具盘的小确认弹层。

### 3.3 清空确认弹层

```text
Clear Confirmation Popover
├─ Message
├─ Confirm Clear
└─ Cancel
```

规则：

- 第一次点击清空后，在工具盘旁出现小确认弹层。
- 确认后清除当前页标注、区域、直接编辑、移动预览、历史记录和编号。
- 取消或点击外部区域关闭确认弹层。

## 4. 页面层级与 Shadow DOM

页面内 UI 应挂在 Shadow DOM 下，避免网页 CSS 污染插件，也避免插件样式影响网页。

```text
PigeonDeck Shadow Root
├─ Control Layer
│  └─ Main Entry
│     ├─ Collapsed: Logo Floating Ball
│     └─ Expanded: Compact Tool Palette
├─ Panel Layer
│  ├─ Annotation / Edit Panel
│  ├─ Region Annotation Panel
│  ├─ Settings Panel
│  └─ Clear Confirmation Popover
├─ Overlay Layer
│  ├─ Hover Highlight
│  ├─ Selection Box
│  ├─ Region Box
│  ├─ Annotation Pins
│  ├─ Connector Lines
│  ├─ Move Preview
│  └─ Alignment Guides
└─ Feedback Layer
   ├─ Button Inline Status
   ├─ Lightweight Hint
   └─ Unsupported Page Notice
```

## 5. 工具模式层级

同一时间只有一个主工具模式处于激活态。复制文本、复制图片和清空是瞬时动作，不长期占用模式。

```text
Active Mode
├─ None
├─ Annotation Mode
├─ Move Mode
└─ Settings Mode
```

切换规则：

- 标注模式、移动模式、设置模式互斥。
- 切换工具只退出当前交互，不清除已保存批注、编辑或移动预览。
- 设置面板打开时，暂停页面选择和拖动。
- 复制文本/复制图片不改变当前工具模式。
- 工具盘遮挡目标时不自动跳动，用户可通过拖拽把手移动整体插件。

## 6. 标注与编辑面板

### 6.1 面板定位

批注/编辑面板贴近目标元素出现，并智能翻转避让视口边界。

```text
Annotation / Edit Panel
├─ Header
│  ├─ Annotation Number
│  ├─ Target Summary
│  └─ Close
├─ Primary Instruction
│  └─ Instruction Textarea
├─ Always-visible Style Controls
├─ Advanced Style Area
└─ Actions
   ├─ Save / Update
   └─ Delete
```

规则：

- 面板打开后默认聚焦批注输入框。
- 批注输入优先，样式编辑服务于批注和视觉预览。
- 如果面板遮挡目标或超出视口，优先自动翻转到目标上下左右的可见位置。

### 6.2 常驻编辑项

常驻区显示高频项，不需要进入高级折叠区。

```text
Always-visible Style Controls
├─ Instruction
├─ Text Content
├─ Color
├─ Font Weight
├─ Font Size
├─ Text Alignment
└─ Layout
```

### 6.3 高级样式区

高级样式区尽量覆盖 MarkIt 大部分样式项，但用左侧导航控制复杂度，并按使用频率从上到下排列。

```text
Advanced Style Area
├─ Left Navigation
│  ├─ Common
│  ├─ Typography
│  ├─ Layout
│  ├─ Spacing
│  ├─ Appearance
│  ├─ Media
│  └─ Debug / Details
└─ Current Section
   ├─ Controls
   └─ Before / After Values
```

高级区原则：

- 常用项靠前，低频项靠后。
- 每项修改都应能即时预览并进入撤销/重做历史。
- 输出给 AI 时保留人类说明和 CSS 属性前后值。

## 7. 区域批注层级

区域批注是标注模式下的框选分支，不是独立导出模式。

```text
Region Annotation
├─ Drag Region Box
├─ Region Annotation Panel
│  ├─ One-sentence Instruction
│  ├─ Save
│  └─ Delete
└─ Saved Region
   ├─ Region Outline
   ├─ Number Pin
   └─ Connector Line
```

规则：

- 长按/拖拽框选区域后生成区域批注对象。
- 用户只填写一句修改说明。
- 区域批注同时参与复制文本和复制图片。

## 8. 移动组件层级

移动模式保留真实元素移动预览，但额外覆盖层保持克制。

```text
Move Mode
├─ Component Selection
│  ├─ Selection Box
│  └─ Granularity Switch
├─ Dragging
│  ├─ Real Element Preview
│  └─ Alignment Guides
├─ Free Move
│  ├─ Real Element Preview
│  └─ Free Move State
└─ Saved Move Task
   ├─ Initial Position
   └─ Final Position
```

规则：

- 单击选中组件，长按拖动。
- 元素本身跟随移动，用户能看到真实预览。
- 默认只额外显示参考线，不显示原位框、拖动轨迹或复杂覆盖层。
- 按住 Alt 时隐藏参考线并取消吸附，记录为 free move。
- 同一组件多次移动时，输出合并为初始位置到最终位置；撤销历史仍保留每一步。

## 9. 设置面板层级

设置面板从工具盘的设置按钮打开，并贴近工具盘出现。它采用分区短表单，不做重型设置中心。

```text
Settings Panel
├─ General
│  ├─ Interface Language
│  ├─ Default Selection Granularity
│  └─ Reset Plugin Position
├─ Interaction
│  ├─ Long Press Duration
│  ├─ History Limit
│  └─ Shortcuts
├─ Output
│  └─ Image Metadata Toggle
├─ Session
│  └─ Auto Clear Policy
└─ Help
   └─ Open Onboarding Page
```

规则：

- 设置面板打开时暂停页面选择和拖动。
- “重新打开教程”打开安装说明页新标签。
- V1 不在设置中展示复杂主题、多 pin 样式、多输出模板或输出详细度。

## 10. 安装说明页

教程以安装说明页为主，不在页面内做完整教程浮层。

```text
Onboarding Page
├─ Quick Start Flow
│  ├─ Open Tool Palette
│  ├─ Add Annotation
│  ├─ Move Component
│  ├─ Copy Text / Image
│  └─ Clear / Undo / Redo
├─ Example Walkthrough
│  └─ One Complete Page-change Scenario
└─ Feature Overview
   ├─ Annotation
   ├─ Move
   ├─ Copy
   ├─ Settings
   └─ Popup Controls
```

入口：

- 安装后自动打开说明页。
- 设置面板中可以重新打开说明页新标签。

## 11. 浏览器 Popup 层级

浏览器 popup 只做状态与开关为主，不承载完整设置。

```text
Extension Popup
├─ Header
│  ├─ Product Name
│  └─ Current Site
├─ Status
│  ├─ Extension Running / Disabled
│  └─ Page Support Notice
├─ Controls
│  ├─ Global Disable Toggle
│  └─ Disable Current Site Toggle
├─ Disabled Sites
│  └─ Open / Manage List
└─ Notices
   ├─ File Permission Notice
   └─ PDF Unsupported Notice
```

规则：

- popup 不管理页面内批注。
- popup 不重复页面内设置项。
- popup 需要清楚表达 file 权限和 PDF 不支持状态。

## 12. 状态互斥关系

- 标注模式和移动模式互斥。
- 设置面板打开时，页面选择和拖动暂停。
- 清空确认弹层只影响清空动作，不切换当前工具模式。
- 复制文本/复制图片不切换当前工具模式。
- Unsupported notice 优先级高于工具激活态。
- 工具盘展开状态与工具激活状态分离：工具盘可以展开但无激活工具，也可以在工具激活时保持展开。

## 13. 后续待敲定的 UI 风格问题

以下问题不在本文决定：

- logo 悬浮球的品牌形态。
- 2x3 工具盘的最终视觉风格。
- 工具图标风格。
- 激活态按钮和工具盘描边的状态色。
- 批注编号圆点样式。
- 连线、选中框、区域框和参考线的视觉语言。
- 高级样式区左侧导航的具体视觉密度。
- 安装说明页的视觉风格。
- 深浅色适配策略。
