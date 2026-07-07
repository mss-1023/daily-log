var storage = require("../../utils/storage");
var dateUtil = require("../../utils/date");

var CATEGORIES = [
  { emoji: "🍔", name: "餐饮" },
  { emoji: "🚌", name: "交通" },
  { emoji: "🛒", name: "购物" },
  { emoji: "🎮", name: "娱乐" },
  { emoji: "📦", name: "其他" }
];

Page({
  data: {
    categories: CATEGORIES,
    groupedRecords: [],
    monthlyTotal: 0,
    currentMonth: "",
    monthLabel: "",
    catStats: [],
    showPopup: false,
    editingId: null,
    formCategory: "餐饮",
    formAmount: "",
    formNote: "",
    formDate: "",
    showDeleteDialog: false,
    deletingId: ""
  },
  onShow: function() {
    if (!this.data.currentMonth) {
      var today = dateUtil.getToday();
      this.setData({ currentMonth: today.slice(0, 7), formDate: today });
    }
    this.loadData();
  },
  onPrevMonth: function() {
    var parts = this.data.currentMonth.split("-");
    var d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 2, 1);
    this.setData({ currentMonth: dateUtil.formatDate(d).slice(0, 7) });
    this.loadData();
  },
  onNextMonth: function() {
    var parts = this.data.currentMonth.split("-");
    var d = new Date(parseInt(parts[0]), parseInt(parts[1]), 1);
    this.setData({ currentMonth: dateUtil.formatDate(d).slice(0, 7) });
    this.loadData();
  },
  onPickMonth: function(e) {
    this.setData({ currentMonth: e.detail.value });
    this.loadData();
  },
  loadData: function() {
    var records = storage.getAccounts();
    var currentMonth = this.data.currentMonth;
    var monthlyTotal = 0;
    var grouped = [];
    var currentDate = "";
    var currentGroup = null;
    var self = this;
    records.forEach(function(r) {
      if (!r.date || r.date.slice(0, 7) !== currentMonth) return;
      monthlyTotal += (r.amount || 0);
      if (r.date !== currentDate) {
        currentDate = r.date;
        currentGroup = { date: currentDate, items: [], total: 0 };
        grouped.push(currentGroup);
      }
      r.categoryEmoji = self._getCatEmoji(r.category);
      currentGroup.items.push(r);
      currentGroup.total += (r.amount || 0);
    });
    // Compute per-category stats for current month
    var catTotals = {};
    CATEGORIES.forEach(function(c) { catTotals[c.name] = 0; });
    records.forEach(function(r) {
      if (r.date && r.date.slice(0, 7) === currentMonth) {
        catTotals[r.category] = (catTotals[r.category] || 0) + (r.amount || 0);
      }
    });
    var catStats = CATEGORIES.map(function(c) { return { emoji: c.emoji, name: c.name, total: (catTotals[c.name] || 0).toFixed(2) }; }).filter(function(c) { return parseFloat(c.total) > 0; });
    // 所有金额保留两位小数
    grouped.forEach(function(g) { g.total = g.total.toFixed(2); });
    var parts = currentMonth.split("-");
    var monthLabel = parseInt(parts[0]) + "年" + parseInt(parts[1]) + "月";
    this.setData({ groupedRecords: grouped, monthlyTotal: monthlyTotal.toFixed(2), catStats: catStats, monthLabel: monthLabel });
  },
  _getCatEmoji: function(name) {
    var found = CATEGORIES.find(function(c) { return c.name === name; });
    return found ? found.emoji : "📦";
  },
  onAdd: function() {
    this.setData({ showPopup: true, editingId: null, formCategory: "餐饮", formAmount: "", formNote: "", formDate: dateUtil.getToday() });
  },
  onEdit: function(e) {
    var id = e.currentTarget.dataset.id;
    var records = storage.getAccounts();
    var r = records.find(function(x) { return x.id === id; });
    if (!r) return;
    this.setData({ showPopup: true, editingId: id, formCategory: r.category, formAmount: String(r.amount), formNote: r.note || "", formDate: r.date });
  },
  noop: function() {},
  onClosePopup: function() { this.setData({ showPopup: false }); },
  onCatChange: function(e) { this.setData({ formCategory: e.currentTarget.dataset.name }); },
  onAmountInput: function(e) { this.setData({ formAmount: e.detail.value }); },
  onNoteInput: function(e) { this.setData({ formNote: e.detail.value }); },
  onDateChange: function(e) { this.setData({ formDate: e.detail.value }); },
  onSave: function() {
    var amount = parseFloat(this.data.formAmount);
    if (isNaN(amount) || amount <= 0) {
      wx.showToast({ title: "请输入金额", icon: "none" });
      return;
    }
    storage.saveAccount({ id: this.data.editingId || undefined, category: this.data.formCategory, amount: amount, note: this.data.formNote.trim(), date: this.data.formDate });
    this.setData({ showPopup: false });
    this.loadData();
  },
  onDelete: function(e) {
    this.setData({ showDeleteDialog: true, deletingId: e.currentTarget.dataset.id });
  },
  onConfirmDelete: function() {
    storage.deleteAccount(this.data.deletingId);
    this.setData({ showDeleteDialog: false, deletingId: "" });
    this.loadData();
  },
  onCancelDelete: function() { this.setData({ showDeleteDialog: false }); }
});
