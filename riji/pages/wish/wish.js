const storage = require("../../utils/storage");

const PRIORITIES = [
  { label: "高", color: "#e74c3c" },
  { label: "中", color: "#faad14" },
  { label: "低", color: "#52c41a" }
];

Page({
  data: {
    wishes: [],

    // Add / Edit popup
    showPopup: false,
    editingWish: null,
    formTitle: "",
    formDescription: "",
    formPriority: "medium",
    formAchieved: false,

    // Delete dialog
    showDeleteDialog: false,
    deletingId: ""
  },

  onShow() {
    this.loadWishes();
  },

  loadWishes() {
    const wishes = storage.getWishes();
    this.setData({ wishes });
  },

  // ── Add / Edit ──

  onAdd() {
    this.setData({
      showPopup: true,
      editingWish: null,
      formTitle: "",
      formDescription: "",
      formPriority: "medium",
      formAchieved: false
    });
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id;
    const wish = this.data.wishes.find(w => w.id === id);
    if (!wish) return;
    this.setData({
      showPopup: true,
      editingWish: wish,
      formTitle: wish.title,
      formDescription: wish.description || "",
      formPriority: wish.priority || "medium",
      formAchieved: wish.achieved || false
    });
  },

  noop() {},

  onClosePopup() {
    this.setData({ showPopup: false });
  },

  onTitleInput(e) {
    this.setData({ formTitle: e.detail.value });
  },

  onDescriptionInput(e) {
    this.setData({ formDescription: e.detail.value });
  },

  onPriorityChange(e) {
    this.setData({ formPriority: e.currentTarget.dataset.value });
  },

  onAchievedToggle() {
    this.setData({ formAchieved: !this.data.formAchieved });
  },

  // ── Save ──

  onSave() {
    const { formTitle, formDescription, formPriority, formAchieved, editingWish } = this.data;
    if (!formTitle.trim()) {
      wx.showToast({ title: "请输入愿望", icon: "none" });
      return;
    }
    storage.saveWish({
      id: editingWish ? editingWish.id : undefined,
      title: formTitle.trim(),
      description: formDescription.trim(),
      priority: formPriority,
      achieved: formAchieved
    });
    this.setData({ showPopup: false });
    this.loadWishes();
  },

  // ── Toggle achieved ──

  onToggle(e) {
    const id = e.currentTarget.dataset.id;
    const wish = this.data.wishes.find(w => w.id === id);
    if (!wish) return;
    storage.saveWish({
      id: wish.id,
      title: wish.title,
      description: wish.description,
      priority: wish.priority,
      achieved: !wish.achieved
    });
    this.loadWishes();
  },

  // ── Delete ──

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ showDeleteDialog: true, deletingId: id });
  },

  onConfirmDelete() {
    storage.deleteWish(this.data.deletingId);
    this.setData({ showDeleteDialog: false, deletingId: "" });
    this.loadWishes();
  },

  onCancelDelete() {
    this.setData({ showDeleteDialog: false, deletingId: "" });
  }
});