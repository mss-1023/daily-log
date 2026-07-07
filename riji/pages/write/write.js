const storage = require("../../utils/storage");
const dateUtil = require("../../utils/date");

const PRESET_TAGS = ["工作", "学习", "生活", "健康", "开发", "阅读"];

Page({
  data: {
    date: "",
    dateStr: "",
    weekday: "",
    content: "",
    tags: [],
    charCount: 0,
    // Inlined from tag-input component
    presetTags: PRESET_TAGS,
    inputValue: ""
  },

  onLoad(options) {
    const date = options.date || dateUtil.getToday();
    const d = dateUtil.parseDate(date);
    const entry = storage.getEntry(date);
    this.setData({
      date,
      dateStr: dateUtil.formatDate(d),
      weekday: dateUtil.getWeekday(d),
      content: entry ? entry.content : "",
      tags: entry ? entry.tags : [],
      charCount: entry ? entry.content.length : 0
    });
  },

  onTextareaChange(e) {
    const content = e.detail.value;
    this.setData({ content, charCount: content.length });
  },

  onSave() {
    const { date, content, tags } = this.data;
    if (!content.trim()) {
      wx.showToast({ title: "请输入内容", icon: "none" });
      return;
    }
    storage.saveEntry(date, { content: content.trim(), tags });
    wx.showToast({ title: "保存成功", icon: "success" });
    setTimeout(() => wx.navigateBack(), 500);
  },

  // ---- Inlined from tag-input component ----

  onTogglePreset(e) {
    const tag = e.currentTarget.dataset.tag;
    const tags = [...this.data.tags];
    const idx = tags.indexOf(tag);
    if (idx > -1) {
      tags.splice(idx, 1);
    } else {
      tags.push(tag);
    }
    this.setData({ tags });
  },

  onInputChange(e) {
    this.setData({ inputValue: e.detail.value });
  },

  onInputConfirm() {
    const tag = this.data.inputValue.trim();
    if (!tag) return;
    const tags = this.data.tags;
    if (tags.includes(tag)) {
      wx.showToast({ title: "标签已存在", icon: "none" });
      this.setData({ inputValue: "" });
      return;
    }
    if (tags.length >= 10) {
      wx.showToast({ title: "最多10个标签", icon: "none" });
      this.setData({ inputValue: "" });
      return;
    }
    tags.push(tag);
    this.setData({ tags, inputValue: "" });
  },

  onRemoveTag(e) {
    const tag = e.currentTarget.dataset.tag;
    const tags = this.data.tags.filter(t => t !== tag);
    this.setData({ tags });
  }
});