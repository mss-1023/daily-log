# UI 审查报告

> 审查范围：`/media/mass/2T/download/daily-log/riji` 下所有 `.wxml` / `.wxss` 文件（不含 node_modules）
> 审查基准：`CONTRACT.md` 铁律 1（禁止 WXML inline style）、CSS 全局 class 和变量规范

---

## 严重（必须修复）

- [x] **pages/mine/mine.wxml:54** — WXML inline style `style="width: {{usagePercent}}%"`，违反 CONTRACT.md 铁律 1。已修复：改用 TDesign `<t-progress>` 组件。
- [x] **pages/memos/memos.wxss + pages/todos/todos.wxss** — `.popup-form`、`.popup-header`、`.popup-title`、`.form-body`、`.form-field`、`.form-actions` 六组 class 完全重复定义。已修复：提取到 `app.wxss` 全局。
- [x] **pages/memos/memos.wxss + pages/todos/todos.wxss** — `.add-fab` 完全重复定义。已修复：提取到 `app.wxss` 全局。

---

## 中等（建议修复）

- [ ] **components/habit-check/habit-check.wxss + pages/mine/mine.wxss** — `.habit-item` 在组件和页面中分别定义了**不同样式**（组件是 flex 横向标签，页面是列表行），类名冲突。建议组件用 `.habit-tag`，页面用 `.habit-row` 区分。
- [ ] **components/todo-item/todo-item.wxss + pages/detail/detail.wxss + pages/index/index.wxss** — `.todo-item` 在三处分别定义，组件内是完整卡片样式，detail 页是简化行样式，index 页未定义 `.todo-item` 但定义了 `.todo-list`、`.todo-title`、`.todo-deadline`。类名分散重复，建议统一走组件，页面只做布局包裹。
- [ ] **components/entry-card/entry-card.wxss + pages/detail/detail.wxss** — `.tag-row` 样式完全重复（`display:flex; flex-wrap:wrap; gap:var(--spacing-sm)`），应提取到 `app.wxss`。
- [ ] **components/entry-card/entry-card.wxss + pages/write/write.wxss** — `.char-count` 在两处定义且样式不同（entry-card 缺 `text-align:right`），应统一到 `app.wxss`。
- [ ] **硬编码 `#fff`（白色）散落 6 处**：`app.wxss:42` `.btn-primary`、`app.wxss:44` `.btn-danger`、`app.wxss:67` `.fill-green.active`、`pages/mine/mine.wxss:4` `.backup-tip`、`components/tag-input/tag-input.wxss:7` `.preset-item.active`、`components/todo-item/todo-item.wxss:35` `.checkbox-circle.checked::after`。建议新增 `--color-white: #ffffff` 变量统一引用。
- [ ] **硬编码 `padding-bottom: 40px` / `100px` 散落 6 页**：`calendar.wxss`、`detail.wxss`、`index.wxss`、`memos.wxss`、`mine.wxss`、`todos.wxss`、`write.wxss`。建议定义 `--page-bottom-padding` 变量，或统一用 `var(--spacing-xl)` 等语义化变量。
- [ ] **pages/list/list.wxss:2、pages/review/review.wxss:2、pages/settings/settings.wxss:2** — 三个占位页面使用 `padding: 16px` 而非 `var(--spacing-lg)`。
- [ ] **pages/memos/memos.wxss:29 + pages/todos/todos.wxss:32** — FAB 的 `box-shadow` 使用硬编码 `rgba(44,62,62,0.3)`，应定义为 `--shadow-fab` 变量。
- [ ] **pages/mine/mine.wxss:9** — `.stat-value` 使用硬编码 `font-size: 28px`，应定义为 `--font-xxl` 或类似变量。

---

## 轻微（锦上添花）

- [ ] **components/mood-picker/mood-picker.wxss:16-17,25** — `.mood-item` 尺寸 `width:56px; height:56px` 和 `.mood-emoji` 字号 `28px` 硬编码。可定义为 `--mood-item-size` 变量。
- [ ] **components/calendar/calendar.wxss:6** — `.calendar-swiper` 高度 `300px` 硬编码，可定义为变量。
- [ ] **components/calendar/calendar.wxss:13** — `.day-inner` 尺寸 `width:36px; height:36px` 硬编码，可定义为 `--day-cell-size`。
- [ ] **app.wxss:51** — `.empty-state` 的 `padding: 60px 20px` 硬编码，可改用语义化变量。
- [ ] **app.wxss:59-61** — 间距工具类 `.mt-8`、`.mt-12`、`.mt-16`、`.mt-24`、`.mb-8`、`.mb-16`、`.p-12`、`.p-16` 的 px 值与 CSS 变量 `--spacing-*` 系列对应值一致，但直接写了数字而非引用变量。建议改为 `margin-top: var(--spacing-sm)` 等以保持语义一致。
- [ ] **components/todo-item/todo-item.wxss:31-34** — 勾选标记伪元素 `::after` 的 `left/top/width/height` 使用硬编码 px，这是精确几何定位，可接受但建议加注释说明。
- [ ] **pages/index/index.wxss:2** — `.page` 的 `padding-bottom: 100px` 是为 tabBar 留空，建议用变量 `--tabbar-safe-bottom` 语义化。

---

## 动画检查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 心情选择器 `.scale-in` | 通过 | `mood-picker.wxml:7` 通过条件 class 应用，动画随选择变化重播 |
| 习惯打卡 `.fill-green` 过渡 | 通过 | `habit-check.wxml:7` 使用 `fill-green active`，`app.wxss:66-67` 定义了 `transition` 和激活态背景色 |
| 其他组件动画 | 缺失 | 待办勾选 `checkbox-circle.checked` 有 `transition`，但 FAB 按钮只有 `transform` 过渡无 active 反馈，备忘卡片无 hover 过渡 |

---

## 视觉一致性

| 检查项 | 结论 |
|--------|------|
| 卡片间距 | 通过 — 全局 `.card` 统一 `margin: var(--spacing-md) var(--spacing-lg)`，组件级 `.memo-item.card` / `.todo-item.card` 重写为 `margin: var(--spacing-xs) var(--spacing-lg)`，内部布局一致 |
| 字体 | 基本通过 — 大部分使用 `var(--font-*)`，仅 `mine.wxss` 的 stat/habit 图标和 `detail.wxss` 的 check-box 有硬编码字号 |
| 按钮 | 通过 — 主要使用 TDesign `<t-button>` 组件，entry-card 使用全局 `.btn-primary`/`.btn-outline`/`.btn-danger`/`.btn-sm` |
| 空状态 | 通过 — 全局 `.empty-state` class 统一使用 |
| 阴影 | 轻微问题 — 全局 `.card` 使用 `var(--shadow-sm)`，但 FAB 的两处阴影硬编码且值相同 |
| 间距工具类 | 通过 — `.mt-8`/`.mt-12`/`.mt-16`/`.mt-24` 等全局类被正确使用 |

---

## 评分

| 维度 | 分数 | 说明 |
|------|------|------|
| 颜色 | 7/10 | 颜色变量体系完整，但 `#fff` 散落 6 处未收口为变量 |
| 间距 | 7/10 | 间距工具类体系完整，但页面级 `padding-bottom` 硬编码、占位页面 `16px` 硬编码 |
| 动画 | 7/10 | 核心动画（scale-in / fill-green）正确实现，但 FAB 和卡片缺少交互反馈过渡 |
| 组件复用 | 5/10 | popup 表单、FAB 按钮、tag-row 等多处重复定义，`.habit-item`、`.todo-item` 名冲突 |