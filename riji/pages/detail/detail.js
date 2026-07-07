const storage = require("../../utils/storage");
const dateUtil = require("../../utils/date");

Page({
  data: {
    date: "",
    dateStr: "",
    weekday: "",
    mood: null,
    entry: null,
    habits: [],
    habitDefs: [],
    todos: [],
    showDeleteDialog: false
  },

  onLoad(options) {
    const date = options.date || dateUtil.getToday();
    this.setData({ date });
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const date = this.data.date;
    const d = dateUtil.parseDate(date);
    const entry = storage.getEntry(date);
    const mood = storage.getMood(date);
    const habitsData = storage.getHabits(date);
    const habitDefs = storage.getHabitDefs();
    const todos = storage.getTodos().filter(t => t.deadline === date);

    this.setData({
      dateStr: dateUtil.formatDate(d),
      weekday: dateUtil.getWeekday(d),
      mood,
      entry,
      habits: habitsData || {},
      habitDefs,
      todos
    });
  },

  onToggleHabit(e) {
    const habitId = e.currentTarget.dataset.habitId;
    storage.toggleHabit(this.data.date, habitId);
    this.setData({ habits: storage.getHabits(this.data.date) });
  },

  onContinueWrite() {
    wx.navigateTo({ url: "/pages/write/write?date=" + this.data.date });
  },

  onDelete() {
    this.setData({ showDeleteDialog: true });
  },

  onConfirmDelete() {
    storage.deleteEntry(this.data.date);
    wx.showToast({ title: "已删除", icon: "success" });
    this.setData({ showDeleteDialog: false });
    setTimeout(() => wx.navigateBack(), 500);
  },

  onCancelDelete() {
    this.setData({ showDeleteDialog: false });
  },

  noop() {},

  onShareAppMessage() {
    const entry = this.data.entry;
    const content = entry ? entry.content.slice(0, 200) : "";
    const moodStr = this.data.mood ? "心情：" + this.data.mood : "";
    const habitsDone = this.data.habitDefs
      .filter(h => this.data.habits[h.id])
      .map(h => h.icon + h.name)
      .join(" ");
    const habitsStr = habitsDone ? "习惯：" + habitsDone : "";
    return {
      title: [this.data.date, moodStr, content, habitsStr].filter(Boolean).join(" | ").slice(0, 50),
      path: "/pages/detail/detail?date=" + this.data.date
    };
  }
});