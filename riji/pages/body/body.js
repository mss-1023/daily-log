const storage = require("../../utils/storage");
const dateUtil = require("../../utils/date");

const EXERCISE_TYPES = [
  { emoji: '🏃', name: '跑步' },
  { emoji: '🏊', name: '游泳' },
  { emoji: '🚴', name: '骑行' },
  { emoji: '🏋️', name: '健身' },
  { emoji: '📦', name: '其他' }
];

Page({
  data: {
    exerciseTypes: EXERCISE_TYPES,
    records: [],
    groupedRecords: [],
    weightLogs: [],

    // Popup
    showPopup: false,
    editingId: null,
    formWeight: '',
    formExercise: '跑步',
    formDuration: '',
    formNote: '',
    formDate: '',

    // Delete dialog
    showDeleteDialog: false,
    deletingId: ''
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    var all = storage.getBodies();
    this.setData({ records: all });
    this._groupRecords(all);
    this._buildWeightLog(all);
  },

  _groupRecords(records) {
    var grouped = [];
    var currentDate = '';
    var currentGroup = null;
    var self = this;

    records.forEach(function (r) {
      if (r.date !== currentDate) {
        currentDate = r.date;
        currentGroup = { date: currentDate, items: [] };
        grouped.push(currentGroup);
      }
      r.exerciseEmoji = self._getExerciseEmoji(r.exercise);
      r.durationLabel = r.duration >= 60 ? Math.floor(r.duration/60) + '小时' + (r.duration%60 ? r.duration%60 + '分钟' : '') : r.duration + '分钟';
      currentGroup.items.push(r);
    });

    this.setData({ groupedRecords: grouped });
  },

  _buildWeightLog(records) {
    // Collect weight records, one per day (first occurrence)
    var weightMap = {};
    records.forEach(function (r) {
      if (r.weight && !weightMap[r.date]) {
        weightMap[r.date] = {
          weight: r.weight,
          exercise: r.exercise || '其他',
          duration: r.duration || 0,
          emoji: EXERCISE_TYPES.find(function (t) { return t.name === r.exercise; }) ? (EXERCISE_TYPES.find(function (t) { return t.name === r.exercise; }) || {}).emoji || '📦' : '📦'
        };
      }
    });

    var logs = [];
    for (var date in weightMap) {
      if (weightMap.hasOwnProperty(date)) {
        logs.push({
          date: date,
          weight: weightMap[date].weight,
          exercise: weightMap[date].exercise,
          duration: weightMap[date].duration,
          emoji: weightMap[date].emoji
        });
      }
    }
    // Sort by date descending
    logs.sort(function (a, b) { return b.date.localeCompare(a.date); });

    this.setData({ weightLogs: logs });
  },

  _getExerciseEmoji(name) {
    var found = EXERCISE_TYPES.find(function (t) { return t.name === name; });
    return found ? found.emoji : '📦';
  },

  // ── Add / Edit ──

  onAdd() {
    this.setData({
      showPopup: true,
      editingId: null,
      formWeight: '',
      formExercise: '跑步',
      formDuration: '',
      formNote: '',
      formDate: dateUtil.getToday()
    });
  },

  onEdit(e) {
    var id = e.currentTarget.dataset.id;
    var records = this.data.records;
    var record = null;
    for (var i = 0; i < records.length; i++) {
      if (records[i].id === id) { record = records[i]; break; }
    }
    if (!record) return;
    this.setData({
      showPopup: true,
      editingId: id,
      formWeight: record.weight ? String(record.weight) : '',
      formExercise: record.exercise || '跑步',
      formDuration: record.duration ? String(record.duration) : '',
      formNote: record.note || '',
      formDate: record.date
    });
  },

  noop() {},

  onClosePopup() {
    this.setData({ showPopup: false });
  },

  onExerChange(e) {
    this.setData({ formExercise: e.currentTarget.dataset.name });
  },

  onWeightInput(e) {
    this.setData({ formWeight: e.detail.value });
  },

  onDurationInput(e) {
    this.setData({ formDuration: e.detail.value });
  },

  onNoteInput(e) {
    this.setData({ formNote: e.detail.value });
  },

  onDateChange(e) {
    this.setData({ formDate: e.detail.value });
  },

  onSave() {
    var weight = parseFloat(this.data.formWeight);
    var duration = parseInt(this.data.formDuration, 10);

    if (isNaN(weight) || weight <= 0) {
      wx.showToast({ title: '请输入有效体重', icon: 'none' });
      return;
    }
    if (isNaN(duration) || duration <= 0) {
      wx.showToast({ title: '请输入有效时长', icon: 'none' });
      return;
    }

    storage.saveBody({
      id: this.data.editingId || undefined,
      weight: weight,
      exercise: this.data.formExercise,
      duration: duration,
      note: this.data.formNote.trim(),
      date: this.data.formDate
    });

    this.setData({ showPopup: false });
    this.loadData();
  },

  // ── Delete ──

  onDelete(e) {
    var id = e.currentTarget.dataset.id;
    if (!id) return;
    this.setData({
      showDeleteDialog: true,
      deletingId: id
    });
  },

  onConfirmDelete() {
    storage.deleteBody(this.data.deletingId);
    this.setData({ showDeleteDialog: false, deletingId: '' });
    this.loadData();
  },

  onCancelDelete() {
    this.setData({ showDeleteDialog: false, deletingId: '' });
  }
});