# 日迹 设计契约

## 路由表
| 页面 | 路径 | 跳转方式 |
|------|------|----------|
| 首页(Tab) | /pages/index/index | switchTab |
| 待办(Tab) | /pages/todos/todos | switchTab |
| 备忘(Tab) | /pages/memos/memos | switchTab |
| 我的(Tab) | /pages/mine/mine | switchTab |
| 月历 | /pages/calendar/calendar | navigateTo |
| 详情 | /pages/detail/detail?date=YYYY-MM-DD | navigateTo |
| 写总结 | /pages/write/write?date=YYYY-MM-DD | navigateTo |

## CSS 全局 class（禁止 WXML inline style）
卡片: .card
日期: .date-header .arrow .date-text .weekday
连续: .streak-badge
标题: .section-title
按钮: .btn-primary .btn-outline .btn-danger .btn-sm
操作: .action-bar
空态: .empty-state .icon .text
完成: .done
间距: .mt-8 .mt-12 .mt-16 .mt-24 .mb-8 .mb-16 .p-12 .p-16
动画: .scale-in .fill-green .fill-green.active
进度: .progress-bar .fill
CSS 变量: --color-primary --color-bg --color-card --color-text --color-text-muted
  --color-danger --color-success --color-warning --color-highlight
  --radius-md --shadow-sm --spacing-lg --transition-fast --transition-normal

## storage API（唯一允许直接调 wx.Storage 的模块）
```
const storage = require("../../utils/storage")
// 日总结
storage.getEntry(date) → {content, tags, created_at, updated_at} | null
storage.saveEntry(date, {content, tags})
storage.deleteEntry(date)
storage.getAllEntries() → [{date, content, tags, created_at, updated_at}]  // 统计/月历用
// 心情
storage.getMood(date) → emoji | null
storage.saveMood(date, emoji|null)
storage.getAllMoods() → {date: emoji, ...}  // 月历用
// 习惯定义
storage.getHabitDefs() → [{id, name, icon, order, created_at}]
storage.saveHabitDef({id?, name, icon, order?}) → id
storage.deleteHabitDef(id)
// 习惯打卡
storage.getHabits(date) → {habit_id: bool}
storage.toggleHabit(date, habitId)
// 待办
storage.getTodos() → [{id, title, deadline, note, done, created_at}]
storage.saveTodo({id?, title, deadline?, note?, done?}) → id
storage.deleteTodo(id)
// 备忘
storage.getMemos() → [{id, title, content, created_at, updated_at}]  (按创建时间倒序)
storage.saveMemo({id?, title, content}) → id
storage.deleteMemo(id)
// 存储
storage.getStorageUsage() → {usedKB, limitKB}
storage.getSetting(key) / saveSetting(key, value)
storage.clearAll()  // 清空所有数据（危险操作，调用前必须二次确认）
storage.genId() → 唯一 ID
```

## date 工具
```
const dateUtil = require("../../utils/date")
dateUtil.getToday() → "YYYY-MM-DD"
dateUtil.formatDate(date) / parseDate(str)
dateUtil.getWeekday(date) → "星期X"
dateUtil.getMonthStr(date) → "2026年6月"
dateUtil.addDays(dateStr, n) / addMonths(dateStr, n)
dateUtil.getDaysInMonth(ym) / getFirstDayOfWeek(ym)
dateUtil.getMonthCalendar(yearMonth) → [[day,...], ...]
```

## streak 工具
```
const streak = require("../../utils/streak")
streak.getStreak() → 连续天数
```

## export 工具
```
const exp = require("../../utils/export")
exp.exportAll() → JSON 字符串（调用后需 wx.getFileSystemManager().writeFile 写临时文件，再 wx.shareFileMessage 分享）
exp.importData(jsonStr) → {success, added?, updated?, error?}
exp.archiveYear(year) → JSON 字符串
exp.deleteYearData(year)
```

## TDesign 组件速查
t-textarea: <t-textarea value="{{x}}" placeholder="..." bind:change="onX" autosize />
t-tag: <t-tag theme="primary" size="small">{{label}}</t-tag>
t-tag closable: <t-tag closable bind:close="onRemove">{{label}}</t-tag>
t-dialog: <t-dialog visible="{{show}}" title="..." content="..." bind:confirm="onOK" bind:cancel="onCancel" />
t-toast: wx.showToast({ title: "...", icon: "success" })
t-picker: <t-picker visible="{{show}}" value="{{val}}" bind:change="onPick" bind:cancel="onCancel" />
t-popup: <t-popup visible="{{show}}" placement="bottom" bind:visible-change="onClose">...</t-popup>
t-tabs: <t-tabs value="{{tab}}" bind:change="onTab"><t-tab-panel label="全部" value="all" />...</t-tabs>
t-icon: <t-icon name="add" size="24px" />
t-input: <t-input value="{{x}}" placeholder="..." bind:change="onX" />
t-button: <t-button theme="primary" size="medium" bind:tap="onX">按钮</t-button>

## 铁律
1. 禁止 WXML 中写 style="..." 内联样式
2. 禁止直接调 wx.setStorageSync / wx.getStorageSync / wx.removeStorageSync（例外：utils/streak.js 读 entry_ 判断连续天数；utils/export.js 导入导出需遍历全部 key）
3. 跳转 Tab 页面必须用 wx.switchTab，子页面用 wx.navigateTo
4. 所有数据读写走 storage 模块，所有日期处理走 dateUtil