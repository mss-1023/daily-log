// utils/streak.js
// 仅统计 entry_ 的连续天数。每次调用遍历 entry_ key，数据量小时开销可忽略（< 50ms）。
// 优化提示：可加一个 {streak, cachedDate} 内存缓存，仅当日期变化时重算，避免 onShow 重复遍历。
const { getToday, addDays } = require("./date");

function getStreak() {
  let streak = 0;
  let date = getToday();
  while (wx.getStorageSync("entry_" + date)) {
    streak++;
    date = addDays(date, -1);
  }
  if (streak === 0) {
    date = addDays(getToday(), -1);
    while (wx.getStorageSync("entry_" + date)) {
      streak++;
      date = addDays(date, -1);
    }
  }
  return streak;
}
module.exports = { getStreak };
