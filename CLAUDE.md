# 日迹 — 微信小程序开发规则

## 项目概述

个人记录微信小程序，涵盖日总结/记账/待办/备忘/心情/习惯/身体/读书/愿望/纪念日。
纯原生框架（WXML + WXSS + JS），零 npm 依赖，数据全本地 `wx.setStorageSync`。

## 开发环境

- 开发工具：wechat-web-devtools-linux（v2.01.2510290）
- 系统：Ubuntu Linux
- 项目路径：`/media/mass/2T/download/daily-log/riji/`
- AppID：`wxbb4e154f002a76b1`

## 硬性限制（Linux 版开发者工具）

| 限制 | 触发条件 | 后果 | 解决 |
|------|---------|------|------|
| WXSS 总量 ~35KB | 所有注册页面 WXSS 加 app.wxss 超过 ~35KB | 编译器卡死/崩溃 | 精简页面 CSS，公共样式放 app.wxss |
| `@keyframes` | 任何页面 WXSS 中定义 | 崩溃 | **全项目禁止** |
| `animation:` | 任何页面 WXSS 中使用 | 崩溃 | **全项目禁止** |
| WXSS 大括号不平衡 | `{` 和 `}` 数量不一致 | 崩溃无报错 | 每次改 WXSS 必须检查平衡 |
| `bind:tap` 冒号语法 | WXML 中使用 `bind:tap` | 卡死 | 统一用 `bindtap`（无冒号） |
| `catch:tap=""` 空值 | 尝试阻止冒泡 | 不生效 | 用 `catchtap="noop"` + JS 定义空方法 |
| `{{[1,2,3]}}` 数组字面量 | WXML 模板中 | 编译卡死 | 在 JS data 中定义数组 |
| HTML 实体 `&#8592;` | WXML 中 | 不渲染 | 直接用 Unicode 字符 |
| `<wxs>` 模块 | WXML 中嵌入 WXS | 可能卡死 | 禁止，在 JS 中预计算 |
| 自定义组件 | `<component>` | 不渲染 | 全部内联到 Page |
| TDesign/npm 库 | 任何第三方组件库 | 无法构建 | 禁止，纯原生 |
| `<input>` + `width:100%` + `padding` | 同时使用 | 被压缩 | 去掉 `width:100%`，用 `display:block` |
| `transition` 中 `var()` | 引用 CSS 变量 | 可能不生效 | 直接写 `0.15s ease` |

## 代码规范

### WXML
- 禁止 `style="..."` 内联样式
- 禁止 `bind:tap`，统一 `bindtap`
- 禁止 `catch:tap=""`，用 `catchtap="noop"`
- 禁止 `{{[1,2,3]}}` 数组字面量
- 禁止 HTML 实体，直接用 Unicode（← → 🔥）
- 弹窗必须用 `catchtap="noop"` 阻止穿透

### WXSS
- 禁止 `@keyframes` 和 `animation:`
- 禁止 `transition` 中使用 `var()`
- 每次修改后必须检查 `{` 和 `}` 数量相等
- 金额显示用 `.toFixed(2)` 避免浮点精度问题
- 页面 WXSS 尽量精简，公共样式放 app.wxss

### JS
- 数据读写统一走 `utils/storage.js`（例外：streak.js、export.js）
- 日期处理走 `utils/date.js`
- `forEach` 回调中需要 `this` 时用 `var self = this`
- 弹窗页面必须有 `noop: function() {}` 方法

## 项目结构

```
riji/
├── app.js / app.json / app.wxss
├── pages/
│   ├── index/        (Tab: 今天 — 心情+习惯+日记+待办预览)
│   ├── account/      (Tab: 记账 — 月份切换+分类统计)
│   ├── list/         (Tab: 清单 — 总结+身体+备忘+待办折叠)
│   ├── mine/         (Tab: 我的 — 统计+工具网格+设置入口)
│   ├── write/        (子页: 写总结)
│   ├── detail/       (子页: 某天详情)
│   ├── calendar/     (子页: 月历)
│   ├── body/         (子页: 身体记录)
│   ├── reading/      (子页: 读书笔记)
│   ├── wish/         (子页: 愿望清单)
│   ├── memorial/     (子页: 纪念日)
│   ├── habits/       (子页: 习惯管理)
│   └── settings2/    (子页: 设置)
├── utils/
│   ├── storage.js    (唯一允许直接调 wx.Storage 的文件)
│   ├── date.js       (日期工具)
│   ├── streak.js     (连续天数)
│   └── export.js     (导入导出)
└── assets/           (TabBar 图标)
```

## 存储 key 约定

| 前缀 | 数据类型 |
|------|---------|
| `entry_YYYY-MM-DD` | 日总结 |
| `mood_YYYY-MM-DD` | 心情 |
| `habit_YYYY-MM-DD` | 习惯打卡 |
| `habit_def_<id>` | 习惯定义 |
| `todo_<id>` | 待办 |
| `memo_<id>` | 备忘 |
| `acct_<id>` | 记账 |
| `body_<id>` | 身体记录 |
| `read_<id>` | 读书笔记 |
| `wish_<id>` | 愿望清单 |
| `mem_<id>` | 纪念日 |
| `settings_<key>` | 设置项 |

## 验证清单（每次改代码后）

```bash
# 1. JS 语法
for f in $(find pages/ utils/ -name "*.js"); do node --check "$f" || echo "FAIL: $f"; done

# 2. WXSS 大括号平衡
python3 -c "
import os, re
for root, _, files in os.walk('pages'):
    for f in files:
        if f.endswith('.wxss'):
            c = open(os.path.join(root, f)).read()
            if c.count('{') != c.count('}'):
                print(f'MISMATCH: {os.path.join(root, f)}')
"

# 3. WXSS 总量
python3 -c "
import os, json
with open('app.json') as f: config = json.load(f)
total = os.path.getsize('app.wxss')
for p in config['pages']: total += os.path.getsize(p + '.wxss')
print(f'WXSS: {total}B ({total/1024:.1f}KB) / 35KB limit')
"

# 4. 禁止项
grep -rn '@keyframes\|animation:\|bind:\|catch:\|&#' --include="*.wxml" --include="*.wxss" pages/
```

## 导出格式

版本 v3，包含所有模块数据。兼容 v1/v2 导入（二期字段不存在时跳过）。
