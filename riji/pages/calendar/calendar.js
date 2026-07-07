const storage = require("../../utils/storage");
const dateUtil = require("../../utils/date");

Page({
  data: {
    ym: "",           // "YYYY-MM"
    ymStr: "",        // "YYYY年M月"
    dotDates: [],     // dates with entries, moods, habits, or todos
    // stats
    monthEntryDays: 0,
    monthTotalWords: 0,
    habitCompletionRate: "0%",
    moodDistribution: {},
    moodKeys: [],
    // Inlined from calendar component
    months: [],
    swiperCurrent: 1,
    weekHeaders: ["一", "二", "三", "四", "五", "六", "日"],
    todayStr: dateUtil.getToday()
  },

  onLoad() {
    const today = dateUtil.getToday();
    this.setData({ ym: today.slice(0, 7) });
    this.refresh();
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    this.computeDotDates();
    this.computeStats();
    this.buildMonths(this.data.ym);
  },

  computeDotDates() {
    const dotSet = new Set();

    // 1. entries
    storage.getAllEntries().forEach(e => dotSet.add(e.date));

    // 2. moods
    const allMoods = storage.getAllMoods();
    Object.keys(allMoods).forEach(d => dotSet.add(d));

    // 3. habits
    const ym = this.data.ym;
    const [y, m] = ym.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = ym + "-" + String(d).padStart(2, "0");
      const habits = storage.getHabits(dateStr);
      if (Object.values(habits).some(v => v === true)) {
        dotSet.add(dateStr);
      }
    }

    // 4. todos (by deadline)
    storage.getTodos().forEach(t => {
      if (t.deadline) dotSet.add(t.deadline);
    });

    this.setData({ dotDates: Array.from(dotSet) });
  },

  computeStats() {
    const ym = this.data.ym;
    const [y, m] = ym.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const today = dateUtil.getToday();
    const todayYm = today.slice(0, 7);

    // entries in this month
    const allEntries = storage.getAllEntries();
    const monthEntries = allEntries.filter(e => e.date.startsWith(ym));
    const monthEntryDays = monthEntries.length;
    const monthTotalWords = monthEntries.reduce((sum, e) => sum + (e.content ? e.content.length : 0), 0);

    // habit completion rate
    const habitDefs = storage.getHabitDefs();
    const habitCount = habitDefs.length;
    let passedDays, totalHabitSlots;
    if (ym < todayYm) {
      passedDays = daysInMonth;
    } else if (ym > todayYm) {
      passedDays = 0;
    } else {
      passedDays = parseInt(today.slice(8, 10), 10);
    }
    totalHabitSlots = passedDays * habitCount;

    let habitTrueCount = 0;
    for (let d = 1; d <= passedDays; d++) {
      const dateStr = ym + "-" + String(d).padStart(2, "0");
      const habits = storage.getHabits(dateStr);
      Object.values(habits).forEach(v => { if (v === true) habitTrueCount++; });
    }
    const habitCompletionRate = totalHabitSlots > 0
      ? Math.round((habitTrueCount / totalHabitSlots) * 100) + "%"
      : "0%";

    // mood distribution
    const allMoods = storage.getAllMoods();
    const moodDist = {};
    Object.entries(allMoods).forEach(([d, emoji]) => {
      if (d.startsWith(ym)) {
        moodDist[emoji] = (moodDist[emoji] || 0) + 1;
      }
    });

    this.setData({
      ymStr: y + "年" + m + "月",
      monthEntryDays,
      monthTotalWords,
      habitCompletionRate,
      moodDisplay: Object.keys(moodDist).map(function(k) { return { emoji: k, count: moodDist[k] }; })
    });
  },

  // ---- Inlined from calendar component ----

  buildMonths(ym) {
    const prevYm = dateUtil.addMonths(ym, -1);
    const nextYm = dateUtil.addMonths(ym, 1);
    const dotSet = new Set(this.data.dotDates);
    const months = [
      this.buildMonthData(prevYm, dotSet),
      this.buildMonthData(ym, dotSet),
      this.buildMonthData(nextYm, dotSet)
    ];
    this.setData({ months, swiperCurrent: 1 });
  },

  buildMonthData(ym, dotSet) {
    const [y, m] = ym.split("-").map(Number);
    const weeks = dateUtil.getMonthCalendar(ym);
    const todayStr = this.data.todayStr;
    const weeksWithInfo = weeks.map(week =>
      week.map(day => {
        if (day === null) return { day: null, hasDot: false, isToday: false };
        const mStr = String(m).padStart(2, "0");
        const dStr = String(day).padStart(2, "0");
        const dateStr = y + "-" + mStr + "-" + dStr;
        return {
          day,
          hasDot: dotSet.has(dateStr),
          isToday: dateStr === todayStr
        };
      })
    );
    return { ym, y, m, weeks: weeksWithInfo };
  },

  onCalendarDayTap(e) {
    const { ym, day } = e.currentTarget.dataset;
    if (!day) return;
    const [y, m] = ym.split("-");
    const mStr = m.padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    const dateStr = y + "-" + mStr + "-" + dStr;
    wx.navigateTo({ url: "/pages/detail/detail?date=" + dateStr });
  },

  onPrevMonth() {
    const prevYm = dateUtil.addMonths(this.data.ym, -1);
    this.setData({ ym: prevYm });
    this.refresh();
  },

  onNextMonth() {
    const nextYm = dateUtil.addMonths(this.data.ym, 1);
    this.setData({ ym: nextYm });
    this.refresh();
  },

  onSwiperChange(e) {
    const newIdx = e.detail.current;
    if (newIdx === 1) return;
    const dir = newIdx > 1 ? 1 : -1;
    const newYm = dateUtil.addMonths(this.data.ym, dir);
    this.setData({ ym: newYm });
    this.refresh();
  }
});