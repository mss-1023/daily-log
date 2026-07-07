// utils/export.js
// version 3: 包含所有模块数据，兼容 v1/v2 导入

function exportAll() {
  var keys = wx.getStorageInfoSync().keys;
  var data = {
    version: 3,
    app_name: "日迹",
    exported_at: new Date().toISOString(),
    // 一期
    entries: [],
    todos: [],
    memos: [],
    moods: {},
    habit_defs: [],
    habits: {},
    // 二期
    accounts: [],
    bodies: [],
    readings: [],
    wishes: [],
    memorials: [],
  };
  keys.forEach(function(k) {
    var v = wx.getStorageSync(k);
    if (k.startsWith("entry_")) {
      data.entries.push({ date: k.replace("entry_", ""), content: v.content, tags: v.tags, created_at: v.created_at, updated_at: v.updated_at });
    } else if (k.startsWith("todo_")) {
      data.todos.push(v);
    } else if (k.startsWith("memo_")) {
      data.memos.push(v);
    } else if (k.startsWith("mood_")) {
      data.moods[k.replace("mood_", "")] = v.emoji;
    } else if (k.startsWith("habit_def_")) {
      data.habit_defs.push(v);
    } else if (k.startsWith("habit_") && !k.startsWith("habit_def_")) {
      data.habits[k.replace("habit_", "")] = v;
    } else if (k.startsWith("acct_")) {
      data.accounts.push(v);
    } else if (k.startsWith("body_")) {
      data.bodies.push(v);
    } else if (k.startsWith("read_")) {
      data.readings.push(v);
    } else if (k.startsWith("wish_")) {
      data.wishes.push(v);
    } else if (k.startsWith("mem_")) {
      data.memorials.push(v);
    }
  });
  return JSON.stringify(data, null, 2);
}

function importData(jsonStr) {
  var data;
  try { data = JSON.parse(jsonStr); } catch (e) {
    return { success: false, error: "JSON 格式无效" };
  }
  var currentSizeKB = wx.getStorageInfoSync().currentSize;
  var incomingSizeKB = (jsonStr.length * 2) / 1024;
  if (currentSizeKB + incomingSizeKB > 9 * 1024) {
    return { success: false, error: "数据过大，请先清理历史数据" };
  }
  var added = 0, updated = 0;

  // 一期数据（v1/v2/v3 都有）
  (data.habit_defs || []).forEach(function(d) {
    var k = "habit_def_" + d.id;
    var e = wx.getStorageSync(k);
    wx.setStorageSync(k, d);
    e ? updated++ : added++;
  });
  (data.entries || []).forEach(function(e) {
    var k = "entry_" + e.date;
    var x = wx.getStorageSync(k);
    wx.setStorageSync(k, { content: e.content, tags: e.tags || [], created_at: e.created_at, updated_at: e.updated_at || e.created_at });
    x ? updated++ : added++;
  });
  var moodEntries = data.moods || {};
  Object.keys(moodEntries).forEach(function(d) {
    var k = "mood_" + d;
    var x = wx.getStorageSync(k);
    wx.setStorageSync(k, { emoji: moodEntries[d] });
    x ? updated++ : added++;
  });
  var habitEntries = data.habits || {};
  Object.keys(habitEntries).forEach(function(d) {
    var k = "habit_" + d;
    var x = wx.getStorageSync(k) || {};
    var merged = {};
    var keys = Object.keys(x);
    for (var i = 0; i < keys.length; i++) merged[keys[i]] = x[keys[i]];
    var newKeys = Object.keys(habitEntries[d]);
    for (var j = 0; j < newKeys.length; j++) merged[newKeys[j]] = habitEntries[d][newKeys[j]];
    wx.setStorageSync(k, merged);
    Object.keys(habitEntries[d]).length > 0 ? updated++ : added++;
  });
  (data.todos || []).forEach(function(t) {
    var k = "todo_" + t.id;
    var x = wx.getStorageSync(k);
    wx.setStorageSync(k, t);
    x ? updated++ : added++;
  });
  (data.memos || []).forEach(function(m) {
    var k = "memo_" + m.id;
    var x = wx.getStorageSync(k);
    wx.setStorageSync(k, m);
    x ? updated++ : added++;
  });

  // 二期数据（仅 v3 有，v1/v2 没有这些字段会跳过）
  (data.accounts || []).forEach(function(a) {
    var k = "acct_" + a.id;
    var x = wx.getStorageSync(k);
    wx.setStorageSync(k, a);
    x ? updated++ : added++;
  });
  (data.bodies || []).forEach(function(b) {
    var k = "body_" + b.id;
    var x = wx.getStorageSync(k);
    wx.setStorageSync(k, b);
    x ? updated++ : added++;
  });
  (data.readings || []).forEach(function(r) {
    var k = "read_" + r.id;
    var x = wx.getStorageSync(k);
    wx.setStorageSync(k, r);
    x ? updated++ : added++;
  });
  (data.wishes || []).forEach(function(w) {
    var k = "wish_" + w.id;
    var x = wx.getStorageSync(k);
    wx.setStorageSync(k, w);
    x ? updated++ : added++;
  });
  (data.memorials || []).forEach(function(m) {
    var k = "mem_" + m.id;
    var x = wx.getStorageSync(k);
    wx.setStorageSync(k, m);
    x ? updated++ : added++;
  });

  return { success: true, added: added, updated: updated };
}

// 归档：导出指定年份数据（合并式——每次归档包含该年所有数据，不依赖之前的归档文件）
function archiveYear(year) {
  var keys = wx.getStorageInfoSync().keys;
  var archive = {};
  var datePrefixes = ["entry_", "mood_", "habit_"];
  keys.forEach(function(k) {
    if (datePrefixes.some(function(p) { return k.startsWith(p); }) && k.includes(year + "-")) {
      archive[k] = wx.getStorageSync(k);
    }
  });
  return JSON.stringify(archive);
}

// 删除指定年份数据（可选，由用户决定是否调用）
function deleteYearData(year) {
  var keys = wx.getStorageInfoSync().keys;
  var datePrefixes = ["entry_", "mood_", "habit_"];
  keys.forEach(function(k) {
    if (datePrefixes.some(function(p) { return k.startsWith(p); }) && k.includes(year + "-")) {
      wx.removeStorageSync(k);
    }
  });
}

module.exports = { exportAll: exportAll, importData: importData, archiveYear: archiveYear, deleteYearData: deleteYearData };