const storage = require("../../utils/storage");
const dateUtil = require("../../utils/date");

const TYPES = [
  { emoji: "🎂", name: "生日" },
  { emoji: "💍", name: "纪念日" },
  { emoji: "📅", name: "其他" }
];

function calcCountdown(targetDate) {
  const today = dateUtil.parseDate(dateUtil.getToday());
  const target = dateUtil.parseDate(targetDate);
  // Compare yearless dates (MM-DD) for yearly recurring countdown
  const todayMD = dateUtil.getToday().slice(5);
  const targetMD = targetDate.slice(5);
  const todayFull = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetFull = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffTime = targetFull.getTime() - todayFull.getTime();
  const diffDays = Math.round(diffTime / 86400000);
  return diffDays;
}

Page({
  data: {
    memorials: [],

    // Add / Edit popup
    showPopup: false,
    editingMemorial: null,
    formTitle: "",
    formDate: "",
    formType: "other",
    formNote: "",

    // Delete dialog
    showDeleteDialog: false,
    deletingId: ""
  },

  onShow() {
    this.loadMemorials();
  },

  loadMemorials() {
    let memorials = storage.getMemorials();
    const today = dateUtil.getToday();
    // Compute countdown and sort
    memorials = memorials.map(m => {
      const diffDays = calcCountdown(m.date);
      let countdownText;
      if (diffDays === 0) {
        countdownText = "今天";
      } else if (diffDays > 0) {
        countdownText = "还有" + diffDays + "天";
      } else {
        countdownText = "已过" + Math.abs(diffDays) + "天";
      }
      return { ...m, countdownDays: diffDays, countdownText };
    });

    // Sort: upcoming first (positive diffDays asc), then past (negative diffDays asc = closest past first)
    memorials.sort((a, b) => {
      const aUpcoming = a.countdownDays >= 0;
      const bUpcoming = b.countdownDays >= 0;
      if (aUpcoming && !bUpcoming) return -1;
      if (!aUpcoming && bUpcoming) return 1;
      return a.countdownDays - b.countdownDays;
    });

    this.setData({ memorials });
  },

  // ── Add / Edit ──

  onAdd() {
    this.setData({
      showPopup: true,
      editingMemorial: null,
      formTitle: "",
      formDate: dateUtil.getToday(),
      formType: "other",
      formNote: ""
    });
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id;
    const memorial = this.data.memorials.find(m => m.id === id);
    if (!memorial) return;
    this.setData({
      showPopup: true,
      editingMemorial: memorial,
      formTitle: memorial.title,
      formDate: memorial.date,
      formType: memorial.type || "other",
      formNote: memorial.note || ""
    });
  },

  noop() {},

  onClosePopup() {
    this.setData({ showPopup: false });
  },

  onTitleInput(e) {
    this.setData({ formTitle: e.detail.value });
  },

  onDateChange(e) {
    this.setData({ formDate: e.detail.value });
  },

  onTypeChange(e) {
    this.setData({ formType: e.currentTarget.dataset.value });
  },

  onNoteInput(e) {
    this.setData({ formNote: e.detail.value });
  },

  // ── Save ──

  onSave() {
    const { formTitle, formDate, formType, formNote, editingMemorial } = this.data;
    if (!formTitle.trim()) {
      wx.showToast({ title: "请输入纪念日名称", icon: "none" });
      return;
    }
    if (!formDate) {
      wx.showToast({ title: "请选择日期", icon: "none" });
      return;
    }
    storage.saveMemorial({
      id: editingMemorial ? editingMemorial.id : undefined,
      title: formTitle.trim(),
      date: formDate,
      type: formType,
      note: formNote.trim()
    });
    this.setData({ showPopup: false });
    this.loadMemorials();
  },

  // ── Delete ──

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ showDeleteDialog: true, deletingId: id });
  },

  onConfirmDelete() {
    storage.deleteMemorial(this.data.deletingId);
    this.setData({ showDeleteDialog: false, deletingId: "" });
    this.loadMemorials();
  },

  onCancelDelete() {
    this.setData({ showDeleteDialog: false, deletingId: "" });
  }
});