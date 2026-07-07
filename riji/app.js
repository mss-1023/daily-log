var storage = require("./utils/storage");
App({
  onLaunch: function() {
    var info = storage.getStorageUsage();
    console.log("日迹启动 - 存储:", info.usedKB, "KB /", info.limitKB, "KB");
    this.globalData.isDark = !!storage.getSetting("dark_mode");
  },
  globalData: {
    version: "1.0.0",
    isDark: false
  }
});