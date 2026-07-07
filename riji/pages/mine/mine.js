const storage = require("../../utils/storage");
const streak = require("../../utils/streak");
const exp = require("../../utils/export");

const HABIT_ICONS = ["📝","🏃","📚","💤","💧","🧘","🎯","💪","🍎","🎨","🎵","✍️","🧹","📱","🌿","🧠","☕","🛏️","🐾","⭐"];

Page({
  data: {
    // dark mode
    isDark: false,

    // date
    todayDate: "",

    // stats
    streakDays: 0,
    totalDays: 0,
    totalWords: 0,

    // habits
    habits: [],
    habitsExpanded: false,
    showHabitPopup: false,
    editingHabit: null,
    habitForm: { name: "", icon: "📝" },
    habitIcons: HABIT_ICONS,

    // storage
    usedKB: 0,
    limitKB: 10240,
    usagePercent: 0,

    // dialogs
    showDeleteHabitDialog: false,
    deleteHabitTarget: null,
    showClearDialog: false,
    clearConfirmText: "",
    showAboutDialog: false,
    showExportDialog: false,
    exportContent: "",

    // backup
    showBackupTip: false,

    // archive
    showArchiveDialog: false,
    archiveYears: [],
    selectedArchiveYear: "",

    // import dialog
    showImportDialog: false,
    importJsonText: ""
  },

  onLoad() {
    const isDark = storage.getSetting("dark_mode");
    if (isDark) {
      this.setData({ isDark: true });
    }
  },

  onShow() {
    this.setTodayDate();
    this.calcStats();
    this.loadHabits();
    this.calcStorage();
    this.checkBackup();
  },

  setTodayDate() {
    const now = new Date();
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekDays[now.getDay()]}`;
    this.setData({ todayDate: dateStr });
  },

  // ── Stats ──
  calcStats() {
    const entries = storage.getAllEntries();
    const totalWords = entries.reduce((sum, e) => sum + (e.content ? e.content.length : 0), 0);
    this.setData({
      streakDays: streak.getStreak(),
      totalDays: entries.length,
      totalWords
    });
  },

  // ── Habits ──
  loadHabits() {
    this.setData({ habits: storage.getHabitDefs() });
  },

  onToggleHabits() {
    this.setData({ habitsExpanded: !this.data.habitsExpanded });
  },

  onAddHabit() {
    if (this.data.habits.length >= 20) {
      wx.showToast({ title: "习惯太多不易坚持，请先归档不需要的", icon: "none" });
      return;
    }
    this.setData({
      showHabitPopup: true,
      editingHabit: null,
      habitForm: { name: "", icon: "📝" }
    });
  },

  onEditHabit(e) {
    const habit = e.currentTarget.dataset.habit;
    this.setData({
      showHabitPopup: true,
      editingHabit: habit,
      habitForm: { name: habit.name, icon: habit.icon }
    });
  },

  onDeleteHabitConfirm(e) {
    const habit = e.currentTarget.dataset.habit;
    this.setData({
      showDeleteHabitDialog: true,
      deleteHabitTarget: habit
    });
  },

  onConfirmDeleteHabit() {
    const habit = this.data.deleteHabitTarget;
    if (habit) {
      storage.deleteHabitDef(habit.id);
      wx.showToast({ title: "已删除", icon: "success" });
    }
    this.setData({ showDeleteHabitDialog: false, deleteHabitTarget: null });
    this.loadHabits();
  },

  onCancelDeleteHabit() {
    this.setData({ showDeleteHabitDialog: false, deleteHabitTarget: null });
  },

  onHabitNameInput(e) {
    this.setData({ "habitForm.name": e.detail.value });
  },

  onPickHabitIcon(e) {
    const icon = e.currentTarget.dataset.icon;
    this.setData({ "habitForm.icon": icon });
  },

  onSaveHabit() {
    const { name, icon } = this.data.habitForm;
    if (!name.trim()) {
      wx.showToast({ title: "请输入习惯名称", icon: "none" });
      return;
    }
    if (this.data.editingHabit) {
      storage.saveHabitDef({ id: this.data.editingHabit.id, name: name.trim(), icon });
    } else {
      storage.saveHabitDef({ name: name.trim(), icon });
    }
    wx.showToast({ title: "保存成功", icon: "success" });
    this.setData({ showHabitPopup: false });
    this.loadHabits();
  },

  noop() {},

  onCloseHabitPopup() {
    this.setData({ showHabitPopup: false });
  },

  // ── Storage ──
  calcStorage() {
    const { usedKB, limitKB } = storage.getStorageUsage();
    this.setData({
      usedKB,
      limitKB,
      usagePercent: Math.min(100, Math.round((usedKB / limitKB) * 100))
    });
    if (usedKB > 8192) {
      wx.showToast({ title: "存储空间不足，建议导出备份", icon: "none" });
    }
  },

  // ── Settings ──
  onExport() {
    var jsonStr = exp.exportAll();
    var fs = wx.getFileSystemManager();
    var fileName = "riji_backup_" + new Date().toISOString().slice(0,10) + ".json";
    var filePath = wx.env.USER_DATA_PATH + "/" + fileName;
    fs.writeFileSync(filePath, jsonStr, "utf8");
    wx.shareFileMessage({
      filePath: filePath,
      success: function() {
        storage.saveSetting("last_export_time", Date.now());
        wx.showToast({ title: "导出成功", icon: "success" });
      },
      fail: function() {
        // 开发者工具不支持 shareFileMessage，降级为弹窗显示
        wx.showModal({
          title: "文件已保存",
          content: "文件路径：" + filePath + "\n\n开发者工具中无法分享，真机上会弹出分享界面。",
          showCancel: false
        });
        storage.saveSetting("last_export_time", Date.now());
      }
    });
  },

  onCopyExport() {
    wx.setClipboardData({
      data: this.data.exportContent,
      success() {
        wx.showToast({ title: "已复制到剪贴板", icon: "success" });
      }
    });
  },

  onCloseExportDialog() {
    this.setData({ showExportDialog: false });
  },

  onImport() {
    this.setData({ showImportDialog: true, importJsonText: "" });
  },

  onFileImport() {
    wx.chooseMessageFile({
      count: 1,
      type: "file",
      extension: ["json"],
      success(res) {
        const fs = wx.getFileSystemManager();
        try {
          const content = fs.readFileSync(res.tempFiles[0].path, "utf8");
          const result = exp.importData(content);
          if (result.success) {
            wx.showToast({ title: "新增" + result.added + "条，更新" + result.updated + "条", icon: "success" });
          } else {
            wx.showToast({ title: result.error || "导入失败", icon: "none" });
          }
        } catch (err) {
          wx.showToast({ title: "文件读取失败", icon: "none" });
        }
      }
    });
  },

  onImportJsonInput(e) {
    this.setData({ importJsonText: e.detail.value });
  },

  onPasteImport() {
    const text = this.data.importJsonText.trim();
    if (!text) {
      wx.showToast({ title: "请粘贴JSON内容", icon: "none" });
      return;
    }
    const result = exp.importData(text);
    if (result.success) {
      wx.showToast({ title: "新增" + result.added + "条，更新" + result.updated + "条", icon: "success" });
      this.setData({ showImportDialog: false });
      this.onShow();
    } else {
      wx.showToast({ title: result.error || "导入失败", icon: "none" });
    }
  },

  onCloseImportDialog() {
    this.setData({ showImportDialog: false });
  },

  onClearData() {
    this.setData({ showClearDialog: true, clearConfirmText: "" });
  },

  onClearInput(e) {
    this.setData({ clearConfirmText: e.detail.value });
  },

  onConfirmClear() {
    if (this.data.clearConfirmText !== "确认清空") {
      wx.showToast({ title: '请输入"确认清空"', icon: 'none' });
      return;
    }
    storage.clearAll();
    wx.showToast({ title: "数据已清空", icon: "success" });
    this.setData({ showClearDialog: false });
    this.onShow();
  },

  onCancelClear() {
    this.setData({ showClearDialog: false });
  },

  onAbout() {
    this.setData({ showAboutDialog: true });
  },

  onCloseAbout() {
    this.setData({ showAboutDialog: false });
  },

  // ── Dark Mode ──
  onToggleDark: function(e) {
    var isDark = e.detail.value;
    this.setData({ isDark: isDark });
    storage.saveSetting("dark_mode", isDark);
    getApp().globalData.isDark = isDark;
    // 暗色模式需要重启小程序才能完全生效（CSS 变量在 page 级覆盖）
    if (isDark) {
      wx.showToast({ title: "暗色模式已开启，重启小程序生效", icon: "none", duration: 2000 });
    }
  },

  onNavHabits: function() { wx.navigateTo({ url: "/pages/habits/habits" }); },
  onNavSettings: function() { wx.navigateTo({ url: "/pages/settings2/settings2" }); },
  onNavTool(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.navigateTo({ url });
    }
  },

  // ── Backup reminder ──
  checkBackup() {
    const lastExport = storage.getSetting("last_export_time");
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const { usedKB } = storage.getStorageUsage();
    if (lastExport && (now - lastExport) > thirtyDays && usedKB > 3072) {
      this.setData({ showBackupTip: true });
    } else {
      this.setData({ showBackupTip: false });
    }
  },

  // ── Archive ──
  onShowArchive() {
    const years = new Set();
    const keys = wx.getStorageInfoSync().keys;
    for (const key of keys) {
      if (key.startsWith("entry_") || key.startsWith("mood_") || key.startsWith("habit_")) {
        const match = key.match(/(\d{4})/);
        if (match) years.add(match[1]);
      }
    }
    const archiveYears = Array.from(years).sort();
    if (archiveYears.length === 0) {
      wx.showToast({ title: "没有可归档的数据", icon: "none" });
      return;
    }
    this.setData({
      showArchiveDialog: true,
      archiveYears,
      selectedArchiveYear: archiveYears[0]
    });
  },

  onPickArchiveYear(e) {
    const idx = e.detail.value;
    this.setData({ selectedArchiveYear: this.data.archiveYears[idx] });
  },

  onConfirmArchive() {
    const year = this.data.selectedArchiveYear;
    if (!year) return;
    this.onDoArchive();
  },

  onDoArchive() {
    const year = this.data.selectedArchiveYear;
    if (!year) return;
    var self = this;
    try {
      const jsonStr = exp.archiveYear(year);
      var fs = wx.getFileSystemManager();
      var fileName = "riji_archive_" + year + ".json";
      var filePath = wx.env.USER_DATA_PATH + "/" + fileName;
      fs.writeFileSync(filePath, jsonStr, "utf8");
      wx.shareFileMessage({
        filePath: filePath,
        success: function() {
          wx.showToast({ title: year + "年归档成功", icon: "success" });
        },
        fail: function() {
          wx.showToast({ title: "文件已保存：" + fileName, icon: "none", duration: 2000 });
        }
      });
      self.setData({ showArchiveDialog: false });
      // 询问是否删除
      setTimeout(function() {
        wx.showModal({
          title: "是否删除原始数据？",
          content: "归档文件已生成。是否删除本地" + year + "年数据以释放空间？",
          confirmText: "删除",
          cancelText: "保留",
          success: function(res) {
            if (res.confirm) {
              exp.deleteYearData(year);
              wx.showToast({ title: "已删除", icon: "success" });
              self.onShow();
            }
          }
        });
      }, 1000);
      this.onShow();
    } catch (err) {
      wx.showToast({ title: "归档失败：" + (err.message || err), icon: "none" });
    }
  },

  onCloseArchiveDialog() {
    this.setData({ showArchiveDialog: false });
  }
});