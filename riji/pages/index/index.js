const dateUtil = require("../../utils/date");
const streakUtil = require("../../utils/streak");
const storage = require("../../utils/storage");

const MOODS = [
  { emoji: "😊", label: "开心" },
  { emoji: "😄", label: "愉快" },
  { emoji: "😐", label: "一般" },
  { emoji: "😞", label: "难过" },
  { emoji: "😡", label: "生气" }
];

const PLACEHOLDERS = [
  "今天最有成就感的一件事是什么？",
  "今天遇到了什么有趣的人或事？",
  "今天学到了什么新东西？",
  "今天的心情怎么样？发生了什么？",
  "今天完成了哪些重要的事？"
];

const QUOTES = [
  "每一天都是新的开始",
  "记录让生活更有意义",
  "积少成多，聚沙成塔",
  "今天是你余生中最年轻的一天",
  "生活不是等待暴风雨过去，而是学会在雨中跳舞",
  "小确幸藏在日常的点滴里",
  "坚持是最美的姿态",
  "每一个不曾记录的日子，都是对生命的辜负",
  "简单的事情重复做，你就是专家",
  "明天的你会感谢今天努力的自己"
];

Page({
  data: {
    date: "",
    dateStr: "",
    weekday: "",
    streak: 0,
    isToday: true,
    // 心情
    moods: MOODS,
    selectedMood: null,
    // 习惯
    habits: [],
    // 日记
    hasEntry: false,
    entryContent: "",
    entryTags: [],
    charCount: 0,
    placeholder: "",
    // 待办
    todoItems: [],
    showMoreTodos: false,

    // 每日一言
    dailyQuote: ""
  },

  onLoad() {
    this.setData({ placeholder: PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)] });
    this.setData({ dailyQuote: QUOTES[Math.floor(Math.random() * QUOTES.length)] });
    this._setToday();
  },

  onShow() {
    this.loadData();
  },

  _setToday() {
    this._setDateFields(dateUtil.getToday());
  },

  _setDateFields(dateKey) {
    var d = dateUtil.parseDate(dateKey);
    var today = dateUtil.getToday();
    this.setData({
      date: dateKey,
      dateStr: (d.getMonth() + 1) + "月" + d.getDate() + "日",
      weekday: dateUtil.getWeekday(d),
      isToday: dateKey === today
    });
  },

  loadData() {
    this.setData({ streak: streakUtil.getStreak() });
    this._loadMood();
    this._loadHabits();
    this._loadEntry();
    this._loadTodos();
  },

  // ── 日期导航 ──
  onPrevDay() {
    var newDate = dateUtil.addDays(this.data.date, -1);
    this._setDateFields(newDate);
    this.loadData();
  },

  onNextDay() {
    var newDate = dateUtil.addDays(this.data.date, 1);
    this._setDateFields(newDate);
    this.loadData();
  },

  onPickDate(e) {
    this._setDateFields(e.detail.value);
    this.loadData();
  },

  // ── 心情 ──
  _loadMood() {
    this.setData({ selectedMood: storage.getMood(this.data.date) });
  },

  onMoodTap(e) {
    var emoji = e.currentTarget.dataset.emoji;
    if (this.data.selectedMood === emoji) {
      storage.saveMood(this.data.date, null);
      this.setData({ selectedMood: null });
    } else {
      storage.saveMood(this.data.date, emoji);
      this.setData({ selectedMood: emoji });
    }
  },

  // ── 习惯 ──
  _loadHabits() {
    var defs = storage.getHabitDefs();
    var dayHabits = storage.getHabits(this.data.date);
    var habits = defs.map(function (def) {
      return {
        id: def.id,
        name: def.name,
        icon: def.icon || "📌",
        checked: !!dayHabits[def.id]
      };
    });
    this.setData({ habits: habits });
  },

  onHabitToggle(e) {
    var habitId = e.currentTarget.dataset.id;
    storage.toggleHabit(this.data.date, habitId);
    this._loadHabits();
  },

  // ── 日记 ──
  _loadEntry() {
    var entry = storage.getEntry(this.data.date);
    if (entry) {
      this.setData({
        hasEntry: true,
        entryContent: entry.content || "",
        entryTags: entry.tags || [],
        charCount: (entry.content || "").length
      });
    } else {
      this.setData({
        hasEntry: false,
        entryContent: "",
        entryTags: [],
        charCount: 0
      });
    }
  },

  onEntryInput(e) {
    var content = e.detail.value;
    this.setData({ entryContent: content, charCount: content.length });
  },

  onSaveEntry() {
    var content = this.data.entryContent.trim();
    if (!content) {
      wx.showToast({ title: "请输入内容", icon: "none" });
      return;
    }
    storage.saveEntry(this.data.date, { content: content, tags: this.data.entryTags });
    wx.showToast({ title: "已保存", icon: "success" });
    this._loadEntry();
  },

  onContinueWrite() {
    wx.navigateTo({ url: "/pages/write/write?date=" + this.data.date });
  },

  onDeleteEntry() {
    var self = this;
    wx.showModal({
      title: "确认删除",
      content: "删除后无法恢复",
      success: function (res) {
        if (res.confirm) {
          storage.deleteEntry(self.data.date);
          self._loadEntry();
          wx.showToast({ title: "已删除", icon: "success" });
        }
      }
    });
  },

  // ── 待办 ──
  _loadTodos() {
    var todos = storage.getTodos();
    var today = this.data.date;
    var self = this;
    var filtered = todos.filter(function (t) {
      return t.deadline && t.deadline <= today && !t.done;
    }).sort(function (a, b) {
      return a.deadline < b.deadline ? -1 : a.deadline > b.deadline ? 1 : 0;
    }).map(function (t) {
      // Format deadline for display
      var d = dateUtil.parseDate(t.deadline);
      var label = (d.getMonth() + 1) + '月' + d.getDate() + '日';
      if (t.deadline === today) label = '今天';
      return Object.assign({}, t, { deadlineLabel: label });
    });
    this.setData({
      todoItems: filtered.slice(0, 5),
      showMoreTodos: filtered.length > 5
    });
  },

  onTodoDone(e) {
    var todoId = e.currentTarget.dataset.id;
    var todos = storage.getTodos();
    for (var i = 0; i < todos.length; i++) {
      if (todos[i].id === todoId) {
        todos[i].done = true;
        storage.saveTodo(todos[i]);
        break;
      }
    }
    this._loadTodos();
  },

  onGoTodos() {
    wx.switchTab({ url: "/pages/list/list" });
  },

  onGoMine() {
    wx.navigateTo({ url: "/pages/mine/mine" });
  }
});