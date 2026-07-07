var storage = require("../../utils/storage");

var HABIT_ICONS = ["📝","🏃","📚","💤","💧","🧘","🎯","💪","🍎","🎨","🎵","✍️","🧹","📱","🌿","🧠","☕","🛏️","🐾","⭐"];

Page({
  data: {
    habits: [],
    habitIcons: HABIT_ICONS,
    showPopup: false,
    editingHabit: null,
    formName: "",
    formIcon: "📝",
    showDeleteDialog: false,
    deleteTarget: null
  },
  onShow: function() { this.loadHabits(); },
  loadHabits: function() { this.setData({ habits: storage.getHabitDefs() }); },
  onAdd: function() {
    if (this.data.habits.length >= 20) { wx.showToast({ title: "最多20个习惯", icon: "none" }); return; }
    this.setData({ showPopup: true, editingHabit: null, formName: "", formIcon: "📝" });
  },
  onEdit: function(e) {
    var h = e.currentTarget.dataset.habit;
    this.setData({ showPopup: true, editingHabit: h, formName: h.name, formIcon: h.icon });
  },
  onNameInput: function(e) { this.setData({ formName: e.detail.value }); },
  onPickIcon: function(e) { this.setData({ formIcon: e.currentTarget.dataset.icon }); },
  noop: function() {},
  onClosePopup: function() { this.setData({ showPopup: false }); },
  onSave: function() {
    var name = this.data.formName.trim();
    if (!name) { wx.showToast({ title: "请输入名称", icon: "none" }); return; }
    if (this.data.editingHabit) {
      storage.saveHabitDef({ id: this.data.editingHabit.id, name: name, icon: this.data.formIcon });
    } else {
      storage.saveHabitDef({ name: name, icon: this.data.formIcon });
    }
    wx.showToast({ title: "已保存", icon: "success" });
    this.setData({ showPopup: false });
    this.loadHabits();
  },
  onDeleteConfirm: function(e) {
    this.setData({ showDeleteDialog: true, deleteTarget: e.currentTarget.dataset.habit });
  },
  onConfirmDelete: function() {
    if (this.data.deleteTarget) storage.deleteHabitDef(this.data.deleteTarget.id);
    this.setData({ showDeleteDialog: false, deleteTarget: null });
    this.loadHabits();
  },
  onCancelDelete: function() { this.setData({ showDeleteDialog: false }); }
});
