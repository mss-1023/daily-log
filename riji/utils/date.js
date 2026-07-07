// utils/date.js
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}
function parseDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function getToday() { return formatDate(new Date()); }
function getWeekday(date) {
  return "星期" + ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
}
function getMonthStr(date) {
  return date.getFullYear() + "年" + (date.getMonth() + 1) + "月";
}
function addDays(dateStr, n) {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + n);
  return formatDate(d);
}
function addMonths(dateStr, n) {
  const d = parseDate(dateStr + "-01");
  d.setMonth(d.getMonth() + n);
  return formatDate(d).slice(0, 7);
}
function getDaysInMonth(ym) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}
function getFirstDayOfWeek(ym) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).getDay();
}
// 周一为一周第一天，周日(getDay()=0)放末尾，前面补6个空位
function getMonthCalendar(ym) {
  const days = getDaysInMonth(ym);
  const firstDay = getFirstDayOfWeek(ym);
  const weeks = [];
  let week = new Array(firstDay === 0 ? 6 : firstDay - 1).fill(null);  // 周日→6空位，周一→0空位
  for (let d = 1; d <= days; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}
module.exports = {
  formatDate, parseDate, getToday, getWeekday, getMonthStr,
  addDays, addMonths, getDaysInMonth, getFirstDayOfWeek, getMonthCalendar,
};
