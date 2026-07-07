// utils/storage.js
// 存储 key 约定：
//   entry_YYYY-MM-DD  → 日总结    {content, tags, created_at, updated_at}
//   mood_YYYY-MM-DD   → 心情      {emoji}
//   habit_YYYY-MM-DD  → 习惯打卡  {habit_id: true/false}
//   todo_<id>         → 待办      {id, title, deadline, note, done, created_at}
//   memo_<id>         → 备忘      {id, title, content, created_at, updated_at}
//   habit_def_<id>    → 习惯定义  {id, name, icon, order, created_at}
//   acct_<id>         → 记账      {id, category, amount, note, date, created_at}
//   body_<id>         → 身体记录  {id, weight, exercise, duration, note, date, created_at}
//   read_<id>         → 读书笔记  {id, title, author, status, notes, rating, created_at, updated_at}
//   wish_<id>         → 愿望清单  {id, title, description, priority, achieved, created_at}
//   mem_<id>          → 纪念日   {id, title, date, type, note, created_at}
//   settings_<key>    → 设置项

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── 日总结 ──
function getEntry(date) { return wx.getStorageSync("entry_" + date) || null; }
function saveEntry(date, data) {
  const existing = getEntry(date);
  const now = Date.now();
  wx.setStorageSync("entry_" + date, {
    content: data.content || "",
    tags: data.tags || [],
    created_at: existing ? existing.created_at : now,
    updated_at: now
  });
  checkStorageLimit();
}
function deleteEntry(date) { wx.removeStorageSync("entry_" + date); }
function getAllEntries() {
  return wx.getStorageInfoSync().keys
    .filter(k => k.startsWith("entry_"))
    .map(k => ({ date: k.replace("entry_", ""), ...wx.getStorageSync(k) }));
}

// ── 心情 ──
function getMood(date) {
  const d = wx.getStorageSync("mood_" + date);
  return d ? d.emoji : null;
}
function saveMood(date, emoji) {
  if (emoji) { wx.setStorageSync("mood_" + date, { emoji }); }
  else { wx.removeStorageSync("mood_" + date); }
  checkStorageLimit();
}
function getAllMoods() {
  const result = {};
  wx.getStorageInfoSync().keys
    .filter(k => k.startsWith("mood_"))
    .forEach(k => { result[k.replace("mood_", "")] = wx.getStorageSync(k).emoji; });
  return result;
}

// ── 习惯定义 ──
function getHabitDefs() {
  return wx.getStorageInfoSync().keys
    .filter(k => k.startsWith("habit_def_"))
    .map(k => wx.getStorageSync(k))
    .sort((a, b) => a.order - b.order);
}
function saveHabitDef(def) {
  const id = def.id || genId();
  const existing = wx.getStorageSync("habit_def_" + id);
  wx.setStorageSync("habit_def_" + id, {
    id,
    name: def.name,
    icon: def.icon || "📌",
    order: def.order !== undefined ? def.order : getHabitDefs().length,
    created_at: existing ? existing.created_at : Date.now()
  });
  return id;
}
function deleteHabitDef(id) { wx.removeStorageSync("habit_def_" + id); }

// ── 习惯打卡 ──
function getHabits(date) { return wx.getStorageSync("habit_" + date) || {}; }
function toggleHabit(date, habitId) {
  const habits = getHabits(date);
  habits[habitId] = !habits[habitId];
  wx.setStorageSync("habit_" + date, habits);
  checkStorageLimit();
}

// ── 待办 ──
function getTodos() {
  return wx.getStorageInfoSync().keys
    .filter(k => k.startsWith("todo_"))
    .map(k => wx.getStorageSync(k));
}
function saveTodo(todo) {
  const id = todo.id || genId();
  const existing = wx.getStorageSync("todo_" + id);
  wx.setStorageSync("todo_" + id, {
    id,
    title: todo.title,
    deadline: todo.deadline || null,
    note: todo.note || "",
    done: todo.done || false,
    created_at: existing ? existing.created_at : Date.now()
  });
  checkStorageLimit();
  return id;
}
function deleteTodo(id) { wx.removeStorageSync("todo_" + id); }

// ── 备忘 ──
function getMemos() {
  return wx.getStorageInfoSync().keys
    .filter(k => k.startsWith("memo_"))
    .map(k => wx.getStorageSync(k))
    .sort((a, b) => b.created_at - a.created_at);
}
function saveMemo(memo) {
  const id = memo.id || genId();
  const existing = wx.getStorageSync("memo_" + id);
  wx.setStorageSync("memo_" + id, {
    id,
    title: memo.title,
    content: memo.content || "",
    created_at: existing ? existing.created_at : Date.now(),
    updated_at: Date.now()
  });
  checkStorageLimit();
  return id;
}
function deleteMemo(id) { wx.removeStorageSync("memo_" + id); }

// ── 记账 ──
function getAccounts() {
  return wx.getStorageInfoSync().keys
    .filter(k => k.startsWith("acct_"))
    .map(k => wx.getStorageSync(k))
    .sort((a, b) => b.date.localeCompare(a.date) || b.created_at - a.created_at);
}
function saveAccount(acct) {
  const id = acct.id || genId();
  const existing = wx.getStorageSync("acct_" + id);
  wx.setStorageSync("acct_" + id, {
    id,
    category: acct.category,
    amount: acct.amount,
    note: acct.note || "",
    date: acct.date,
    created_at: existing ? existing.created_at : Date.now()
  });
  checkStorageLimit();
  return id;
}
function deleteAccount(id) { wx.removeStorageSync("acct_" + id); }

// ── 身体记录 ──
function getBodies() {
  return wx.getStorageInfoSync().keys
    .filter(k => k.startsWith("body_"))
    .map(k => wx.getStorageSync(k))
    .sort((a, b) => b.date.localeCompare(a.date) || b.created_at - a.created_at);
}
function saveBody(body) {
  const id = body.id || genId();
  const existing = wx.getStorageSync("body_" + id);
  wx.setStorageSync("body_" + id, {
    id,
    weight: body.weight,
    exercise: body.exercise,
    duration: body.duration,
    note: body.note || "",
    date: body.date,
    created_at: existing ? existing.created_at : Date.now()
  });
  checkStorageLimit();
  return id;
}
function deleteBody(id) { wx.removeStorageSync("body_" + id); }

// ── 读书笔记 ──
function getReadings() {
  return wx.getStorageInfoSync().keys
    .filter(k => k.startsWith("read_"))
    .map(k => wx.getStorageSync(k))
    .sort((a, b) => b.updated_at - a.updated_at);
}
function saveReading(reading) {
  const id = reading.id || genId();
  const existing = wx.getStorageSync("read_" + id);
  const now = Date.now();
  wx.setStorageSync("read_" + id, {
    id,
    title: reading.title,
    author: reading.author || "",
    status: reading.status || "reading",
    notes: reading.notes || "",
    rating: reading.rating || 0,
    created_at: existing ? existing.created_at : now,
    updated_at: now
  });
  checkStorageLimit();
  return id;
}
function deleteReading(id) { wx.removeStorageSync("read_" + id); }

// ── 愿望清单 ──
function getWishes() {
  return wx.getStorageInfoSync().keys
    .filter(k => k.startsWith("wish_"))
    .map(k => wx.getStorageSync(k))
    .sort((a, b) => a.created_at - b.created_at);
}
function saveWish(wish) {
  const id = wish.id || genId();
  const existing = wx.getStorageSync("wish_" + id);
  wx.setStorageSync("wish_" + id, {
    id,
    title: wish.title,
    description: wish.description || "",
    priority: wish.priority || "medium",
    achieved: wish.achieved || false,
    created_at: existing ? existing.created_at : Date.now()
  });
  checkStorageLimit();
  return id;
}
function deleteWish(id) { wx.removeStorageSync("wish_" + id); }

// ── 纪念日 ──
function getMemorials() {
  return wx.getStorageInfoSync().keys
    .filter(k => k.startsWith("mem_"))
    .map(k => wx.getStorageSync(k));
}
function saveMemorial(memorial) {
  const id = memorial.id || genId();
  const existing = wx.getStorageSync("mem_" + id);
  wx.setStorageSync("mem_" + id, {
    id,
    title: memorial.title,
    date: memorial.date,
    type: memorial.type || "other",
    note: memorial.note || "",
    created_at: existing ? existing.created_at : Date.now()
  });
  checkStorageLimit();
  return id;
}
function deleteMemorial(id) { wx.removeStorageSync("mem_" + id); }

// ── 存储用量 ──
function getStorageUsage() {
  const info = wx.getStorageInfoSync();
  return { usedKB: info.currentSize, limitKB: info.limitSize || 10240 };
}
function checkStorageLimit() {
  const { usedKB, limitKB } = getStorageUsage();
  if (usedKB > limitKB * 0.8) {
    wx.showToast({ title: "存储空间不足，请导出备份后清理", icon: "none", duration: 3000 });
  }
}

// ── 设置 ──
function getSetting(key) { return wx.getStorageSync("settings_" + key); }
function saveSetting(key, value) { wx.setStorageSync("settings_" + key, value); }

// ── 清空 ──
function clearAll() {
  const keys = wx.getStorageInfoSync().keys;
  keys.forEach(k => wx.removeStorageSync(k));
}

module.exports = {
  genId,
  getEntry, saveEntry, deleteEntry, getAllEntries,
  getMood, saveMood, getAllMoods,
  getHabitDefs, saveHabitDef, deleteHabitDef,
  getHabits, toggleHabit,
  getTodos, saveTodo, deleteTodo,
  getMemos, saveMemo, deleteMemo,
  getAccounts, saveAccount, deleteAccount,
  getBodies, saveBody, deleteBody,
  getReadings, saveReading, deleteReading,
  getWishes, saveWish, deleteWish,
  getMemorials, saveMemorial, deleteMemorial,
  getStorageUsage,
  getSetting, saveSetting,
  clearAll,
};
