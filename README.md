# 日迹

个人记录微信小程序 — 日总结、记账、待办、备忘、心情、习惯、身体、读书、愿望、纪念日，一站搞定。

## 技术栈

纯原生微信小程序框架（WXML + WXSS + JS），零 npm 依赖，数据全本地存储（`wx.setStorageSync`）。

## 功能模块

### 四大 Tab

| Tab | 页面 | 功能 |
|-----|------|------|
| 🏠 今天 | `pages/index/index` | 心情选择、习惯打卡、日总结编辑、今日待办预览 |
| 💰 记账 | `pages/account/account` | 月份切换、收支记录、分类统计 |
| 📋 清单 | `pages/list/list` | 日总结列表、身体记录、备忘、待办折叠 |
| 👤 我的 | `pages/mine/mine` | 连续/累计/字数统计、工具网格、设置入口 |

### 子页面

| 页面 | 路径 | 功能 |
|------|------|------|
| 写总结 | `pages/write/write` | 单独编辑日总结 |
| 详情 | `pages/detail/detail` | 某天全部数据汇总 |
| 月历 | `pages/calendar/calendar` | 心情热力图 + 日总结跳转 |
| 身体 | `pages/body/body` | 体重、运动、时长记录 |
| 读书 | `pages/reading/reading` | 读书笔记（在读/已读/想读） |
| 愿望 | `pages/wish/wish` | 愿望清单（优先级 + 达成标记） |
| 纪念日 | `pages/memorial/memorial` | 纪念日管理（恋爱/生日/其他） |
| 习惯 | `pages/habits/habits` | 习惯增删改排序 |
| 设置 | `pages/settings2/settings2` | 深色模式、导入导出、数据清理 |

## 项目结构

```
riji/
├── app.js / app.json / app.wxss   # 应用入口
├── pages/
│   ├── index/          # Tab: 今天
│   ├── account/        # Tab: 记账
│   ├── list/           # Tab: 清单
│   ├── mine/           # Tab: 我的
│   ├── write/          # 子页: 写总结
│   ├── detail/         # 子页: 某天详情
│   ├── calendar/       # 子页: 月历
│   ├── body/           # 子页: 身体记录
│   ├── reading/        # 子页: 读书笔记
│   ├── wish/           # 子页: 愿望清单
│   ├── memorial/       # 子页: 纪念日
│   ├── habits/         # 子页: 习惯管理
│   └── settings2/      # 子页: 设置
├── utils/
│   ├── storage.js      # 数据层（唯一允许直接调 wx.Storage 的模块）
│   ├── date.js         # 日期工具
│   ├── streak.js       # 连续天数计算
│   └── export.js       # 导入导出（v3 格式，兼容 v1/v2）
└── assets/             # TabBar 图标
```

## 数据存储

全部数据以 `key` 前缀区分模块，存储在微信本地 Storage 中：

| 前缀 | 模块 | 字段 |
|------|------|------|
| `entry_YYYY-MM-DD` | 日总结 | content, tags, created_at, updated_at |
| `mood_YYYY-MM-DD` | 心情 | emoji |
| `habit_YYYY-MM-DD` | 习惯打卡 | {habit_id: bool} |
| `habit_def_<id>` | 习惯定义 | id, name, icon, order |
| `todo_<id>` | 待办 | id, title, deadline, note, done |
| `memo_<id>` | 备忘 | id, title, content, created_at, updated_at |
| `acct_<id>` | 记账 | id, category, amount, note, date |
| `body_<id>` | 身体 | id, weight, exercise, duration, note, date |
| `read_<id>` | 读书 | id, title, author, status, notes, rating |
| `wish_<id>` | 愿望 | id, title, description, priority, achieved |
| `mem_<id>` | 纪念日 | id, title, date, type, note |
| `settings_<key>` | 设置 | 深色模式等 |

## 开发环境

- **开发工具**：wechat-web-devtools-linux v2.01.2510290
- **AppID**：`wxbb4e154f002a76b1`
- **项目路径**：`/media/mass/2T/download/daily-log/riji/`

## 本地开发

```bash
# 检查 JS 语法
for f in $(find pages/ utils/ -name "*.js"); do node --check "$f" || echo "FAIL: $f"; done

# 检查 WXSS 大括号平衡
python3 -c "
import os
for root, _, files in os.walk('pages'):
    for f in files:
        if f.endswith('.wxss'):
            c = open(os.path.join(root, f)).read()
            if c.count('{') != c.count('}'):
                print(f'MISMATCH: {os.path.join(root, f)}')"

# 检查 WXSS 总量（不能超过 ~35KB）
python3 -c "
import os, json
with open('app.json') as f: config = json.load(f)
total = os.path.getsize('app.wxss')
for p in config['pages']: total += os.path.getsize(p + '.wxss')
print(f'WXSS: {total}B ({total/1024:.1f}KB) / 35KB limit')"

# 检查禁止项
grep -rn '@keyframes\|animation:\|bind:\|catch:\|&#' --include="*.wxml" --include="*.wxss" pages/
```

## Linux 版开发者工具限制

| 限制 | 说明 |
|------|------|
| WXSS 总量 ~35KB | 超过会导致编译器卡死/崩溃 |
| 禁止 `@keyframes` | 任何页面 WXSS 中定义即崩溃 |
| 禁止 `animation:` | 同上 |
| 禁止 `bind:tap` 冒号语法 | 使用 `bindtap` |
| 禁止 `<wxs>` 模块 | 可能卡死，在 JS 中预计算 |
| 禁止第三方组件库 | 无法构建，纯原生 |

详细限制见 [CLAUDE.md](CLAUDE.md)。

## 数据导出

导出格式为 v3 JSON，包含所有模块数据，兼容 v1/v2 导入。导入时会自动跳过旧版本不存在的字段。

```json
{
  "version": 3,
  "app_name": "日迹",
  "exported_at": "2026-07-07T...",
  "entries": [...],
  "todos": [...],
  "memos": [...],
  "moods": {...},
  "habit_defs": [...],
  "habits": {...},
  "accounts": [...],
  "bodies": [...],
  "readings": [...],
  "wishes": [...],
  "memorials": [...]
}
```

## 许可

MIT