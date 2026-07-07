const storage = require("../../utils/storage");

const STATUS_MAP = {
  reading: "在读",
  finished: "已读"
};

Page({
  data: {
    readings: [],
    stars: [1, 2, 3, 4, 5],

    // Add / Edit popup
    showPopup: false,
    editingReading: null,
    formTitle: "",
    formAuthor: "",
    formStatus: "reading",
    formNotes: "",
    formRating: 0,

    // Delete dialog
    showDeleteDialog: false,
    deletingId: ""
  },

  onShow() {
    this.loadReadings();
  },

  loadReadings() {
    const readings = storage.getReadings();
    this.setData({ readings });
  },

  // ── Add / Edit ──

  onAdd() {
    this.setData({
      showPopup: true,
      editingReading: null,
      formTitle: "",
      formAuthor: "",
      formStatus: "reading",
      formNotes: "",
      formRating: 0
    });
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id;
    const reading = this.data.readings.find(r => r.id === id);
    if (!reading) return;
    this.setData({
      showPopup: true,
      editingReading: reading,
      formTitle: reading.title,
      formAuthor: reading.author || "",
      formStatus: reading.status || "reading",
      formNotes: reading.notes || "",
      formRating: reading.rating || 0
    });
  },

  noop() {},

  onClosePopup() {
    this.setData({ showPopup: false });
  },

  onTitleInput(e) {
    this.setData({ formTitle: e.detail.value });
  },

  onAuthorInput(e) {
    this.setData({ formAuthor: e.detail.value });
  },

  onStatusChange(e) {
    this.setData({ formStatus: e.currentTarget.dataset.value });
  },

  onNotesInput(e) {
    this.setData({ formNotes: e.detail.value });
  },

  onRatingTap(e) {
    const rating = parseInt(e.currentTarget.dataset.rating, 10);
    this.setData({ formRating: rating === this.data.formRating ? 0 : rating });
  },

  // ── Save ──

  onSave() {
    const { formTitle, formAuthor, formStatus, formNotes, formRating, editingReading } = this.data;
    if (!formTitle.trim()) {
      wx.showToast({ title: "请输入书名", icon: "none" });
      return;
    }
    storage.saveReading({
      id: editingReading ? editingReading.id : undefined,
      title: formTitle.trim(),
      author: formAuthor.trim(),
      status: formStatus,
      notes: formNotes.trim(),
      rating: formRating
    });
    this.setData({ showPopup: false });
    this.loadReadings();
  },

  // ── Delete ──

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ showDeleteDialog: true, deletingId: id });
  },

  onConfirmDelete() {
    storage.deleteReading(this.data.deletingId);
    this.setData({ showDeleteDialog: false, deletingId: "" });
    this.loadReadings();
  },

  onCancelDelete() {
    this.setData({ showDeleteDialog: false, deletingId: "" });
  }
});