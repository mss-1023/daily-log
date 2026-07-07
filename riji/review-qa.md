# QA 测试报告

## 致命（阻断功能）
- [ ] 无

## 严重（功能异常）
- [x] `pages/todos/todos.wxml:84-90` — t-picker 截止日期选择器缺少 `columns` 属性。已修复：添加 `columns="{{deadlineDates}}"`。

- [x] `pages/index/index.js:45-48` — `loadData()` 只刷新了 `streak` 和 `todoItems`，未触发 entry-card、mood-picker、habit-check 三个子组件的重新加载。已修复：为三个子组件添加 `pageLifetimes.show` 钩子，页面恢复时自动刷新数据。

## 一般（边界遗漏）
- [ ] `pages/index/index.json:8-9` — 注册了 `t-dialog` 和 `t-tag` 但 `index.wxml` 中未直接使用（`t-dialog` 在 entry-card 子组件内部使用，无需在父页面注册）。不影响功能，但增加不必要的组件加载。

- [ ] `utils/storage.js:72` — `deleteHabitDef(id)` 仅删除 `habit_def_<id>`，不清理已存在的 `habit_YYYY-MM-DD` 中该 habit 的打卡数据。虽然 `habit-check` 组件只展示当前 defs 中存在的习惯（orphan 打卡数据不会被渲染），但 orphan 数据会永久占用存储空间。建议：在 `deleteHabitDef` 中遍历所有 `habit_*` key 并删除对应 habit ID 的条目。

- [ ] `utils/export.js:67-71` — `importData` 中 habits 的 `added`/`updated` 计数逻辑有误：`Object.keys(habits).length > 0 ? updated++ : added++` 判断的是导入数据中该日期是否有打卡记录，而非该 storage key 是否已存在。正确做法应判断 `Object.keys(x).length > 0`（即 `x` 已有数据则为 updated）。

- [ ] `utils/export.js:34-44` — `importData` 导入完成后未调用 `checkStorageLimit()`。如果导入数据量较大，可能在导入完成后触发存储超限但用户无感知。建议在 `importData` 返回前调用 `checkStorageLimit()`。

- [ ] `components/entry-card/entry-card.js`、`components/mood-picker/mood-picker.js`、`components/habit-check/habit-check.js` — 三个组件均未实现 `pageLifetimes.show`，仅依赖 `properties.date` 的 observer。当页面从后台恢复（`onShow`）且 date 未变时，组件不会重新加载数据。这影响所有通过 `wx.navigateBack` 返回的场景。

- [ ] 习惯删除后无确认提示（`pages/mine/mine.js:89-97`）中 `onConfirmDeleteHabit` 直接删除，未提示用户"该习惯的所有打卡记录也将丢失"。

## 建议（体验优化）
- [ ] `pages/index/index.js` — 首页 `onNextDay` 允许无限向前翻到未来日期，可以写未来日期的总结。如产品设计允许，则无问题；否则应限制 `date <= getToday()`。

- [ ] `pages/todos/todos.js:159-177` — `generateDeadlineDates` 仅生成 60 天范围，无"不限截止日期"的快捷选项。如果用户想要更远的截止日期，需要手动输入。

- [ ] `pages/mine/mine.js:140-142` — 存储 > 8MB 警告用了 `wx.showToast`，但 `onShow` 时每次都弹，用户可能频繁看到。建议改为页面内持久提示条，或仅在首次超过阈值时提示。

- [ ] `components/entry-card/entry-card.js:81-94` — `onSave` 保存后调用 `_loadEntry()` 再读取一次存储，而 `saveEntry` 本身就是同步的，可以直接用 `saveEntry` 返回的数据更新 UI，避免一次额外读。

- [ ] `utils/streak.js` — 连续天数计算没有缓存，每次 `onShow` 都遍历所有 entry_ key。注释中已提到优化建议但未实现。数据量小时影响不大，但可加一个 `{cachedDate, cachedStreak}` 简易缓存。

## 评分
- 存储隔离: 10/10 — 所有 wx.Storage 直接调用仅出现在 `utils/storage.js`（主模块）、`utils/streak.js`（只读 entry_）、`utils/export.js`（导入导出遍历全 key），符合 CONTRACT.md 铁律第 2 条白名单。
- 路由: 9/10 — Tab 页面 `index`→`todos` 使用 `wx.switchTab` 正确；`calendar`→`detail`、`detail`→`write`、`entry-card`→`write` 使用 `wx.navigateTo` 正确；路径与 CONTRACT.md 路由表一致。扣 1 分：`todos` 页面缺少 deadline picker 的 columns，不影响路由但对功能有影响。
- 数据流: 6/10 — 详情页、待办页、备忘页、月历页、我的页的 `onShow` 刷新逻辑正确；保存/删除后均正确更新本地数据。扣 4 分：首页 `loadData()` 严重缺陷——不刷新 entry-card、mood-picker、habit-check 三个子组件，导致从 write 页返回后显示旧数据。
- 边界: 7/10 — 空状态提示完善（首页、待办页、备忘页、详情页均有 empty-state）；习惯上限 20 有拦截；存储 > 8MB 有 toast 警告；导入 > 9MB 有拒绝；无 deadline 待办首页不显示（`t.deadline &&` 过滤正确）。扣 3 分：orphan 习惯数据未清理；importData 计数逻辑有误；组件缺少 `pageLifetimes.show` 导致边界刷新遗漏。
- 需求符合: 9/10 — 连续天数仅统计 `entry_`（`streak.js` 只读 `entry_` key）；允许写未来日期（`onNextDay` 无限制）；日总结续写是覆盖（`saveEntry` 用 `data.content` 覆盖而非追加）。扣 1 分：todos 页面 deadline picker 的 columns 缺失属功能缺陷。