var storage = require("../../utils/storage");
var exp = require("../../utils/export");

Page({
  data: {
    usedKB: 0,
    limitKB: 10240,
    usagePercent: 0,
    showExportDialog: false,
    exportContent: "",
    showImportDialog: false,
    importJsonText: "",
    showClearDialog: false,
    clearConfirmText: "",
    showAboutDialog: false,
    showArchiveDialog: false,
    archiveYears: [],
    selectedArchiveYear: ""
  },
  onShow: function() { this.calcStorage(); },
  calcStorage: function() {
    var info = storage.getStorageUsage();
    this.setData({ usedKB: info.usedKB, limitKB: info.limitKB, usagePercent: Math.min(100, Math.round((info.usedKB / info.limitKB) * 100)) });
  },
  // Export
  onExport: function() {
    var jsonStr = exp.exportAll();
    var fs = wx.getFileSystemManager();
    var fileName = "riji_backup_" + new Date().toISOString().slice(0,10) + ".json";
    var filePath = wx.env.USER_DATA_PATH + "/" + fileName;
    fs.writeFileSync(filePath, jsonStr, "utf8");
    wx.shareFileMessage({ filePath: filePath, success: function() { storage.saveSetting("last_export_time", Date.now()); wx.showToast({ title: "导出成功", icon: "success" }); }, fail: function() { wx.showModal({ title: "文件已保存", content: filePath, showCancel: false }); storage.saveSetting("last_export_time", Date.now()); } });
  },
  // Import
  onImport: function() { this.setData({ showImportDialog: true, importJsonText: "" }); },
  onFileImport: function() {
    wx.chooseMessageFile({ count: 1, type: "file", extension: ["json"], success: function(res) {
      var fs = wx.getFileSystemManager();
      try {
        var content = fs.readFileSync(res.tempFiles[0].path, "utf8");
        var result = exp.importData(content);
        if (result.success) { wx.showToast({ title: "新增" + result.added + "条，更新" + result.updated + "条", icon: "success" }); }
        else { wx.showToast({ title: result.error || "导入失败", icon: "none" }); }
      } catch (err) { wx.showToast({ title: "文件读取失败", icon: "none" }); }
    }});
  },
  onImportJsonInput: function(e) { this.setData({ importJsonText: e.detail.value }); },
  onPasteImport: function() {
    var text = this.data.importJsonText.trim();
    if (!text) { wx.showToast({ title: "请粘贴JSON", icon: "none" }); return; }
    var result = exp.importData(text);
    if (result.success) { wx.showToast({ title: "新增" + result.added + "条，更新" + result.updated + "条", icon: "success" }); this.setData({ showImportDialog: false }); }
    else { wx.showToast({ title: result.error || "导入失败", icon: "none" }); }
  },
  onCloseImportDialog: function() { this.setData({ showImportDialog: false }); },
  // Clear
  onClearData: function() { this.setData({ showClearDialog: true, clearConfirmText: "" }); },
  onClearInput: function(e) { this.setData({ clearConfirmText: e.detail.value }); },
  onConfirmClear: function() {
    if (this.data.clearConfirmText !== "确认清空") { wx.showToast({ title: '请输入"确认清空"', icon: "none" }); return; }
    storage.clearAll(); wx.showToast({ title: "已清空", icon: "success" }); this.setData({ showClearDialog: false }); this.calcStorage();
  },
  onCancelClear: function() { this.setData({ showClearDialog: false }); },
  // Archive
  onShowArchive: function() {
    var keys = wx.getStorageInfoSync().keys;
    var years = {};
    keys.forEach(function(k) { if (k.startsWith("entry_") || k.startsWith("mood_") || k.startsWith("habit_")) { var m = k.match(/(\d{4})/); if (m) years[m[1]] = true; } });
    var list = Object.keys(years).sort();
    if (list.length === 0) { wx.showToast({ title: "暂无可归档数据", icon: "none" }); return; }
    this.setData({ showArchiveDialog: true, archiveYears: list, selectedArchiveYear: list[0] });
  },
  onPickArchiveYear: function(e) { this.setData({ selectedArchiveYear: this.data.archiveYears[e.detail.value] }); },
  onConfirmArchive: function() {
    var year = this.data.selectedArchiveYear;
    if (!year) return;
    var self = this;
    var jsonStr = exp.archiveYear(year);
    var fs = wx.getFileSystemManager();
    var filePath = wx.env.USER_DATA_PATH + "/riji_archive_" + year + ".json";
    fs.writeFileSync(filePath, jsonStr, "utf8");
    wx.shareFileMessage({ filePath: filePath, success: function() { wx.showToast({ title: year + "年归档成功", icon: "success" }); }, fail: function() { wx.showToast({ title: "文件已保存", icon: "none" }); } });
    self.setData({ showArchiveDialog: false });
    setTimeout(function() { wx.showModal({ title: "是否删除原始数据？", content: "归档已完成。删除" + year + "年数据以释放空间？", confirmText: "删除", cancelText: "保留", success: function(res) { if (res.confirm) { exp.deleteYearData(year); wx.showToast({ title: "已删除", icon: "success" }); self.calcStorage(); } } }); }, 1000);
  },
  onCloseArchiveDialog: function() { this.setData({ showArchiveDialog: false }); },
  // About
  onAbout: function() { this.setData({ showAboutDialog: true }); },
  onCloseAbout: function() { this.setData({ showAboutDialog: false }); },
  noop: function() {}
});
