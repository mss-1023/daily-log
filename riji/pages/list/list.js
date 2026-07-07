var storage = require("../../utils/storage");
var dateUtil = require("../../utils/date");

Page({
  data: {
    summaryExpanded: false,
    entries: [],
    todosExpanded: false,
    memosExpanded: false,
    bodyExpanded: false,
    todos: [],
    memos: [],
    bodies: [],
    showTodoPopup: false,
    showMemoPopup: false,
    showBodyPopup: false,
    todoFormTitle: "",
    todoFormDeadline: "",
    todoFormNote: "",
    todoEditingId: null,
    memoFormTitle: "",
    memoFormContent: "",
    memoEditingId: null,
    bodyFormWeight: "",
    bodyFormExercise: "跑步",
    bodyFormDuration: "",
    bodyFormNote: "",
    bodyFormDate: "",
    bodyEditingId: null,
    exerciseTypes: [
      { emoji: "🏃", name: "跑步" },
      { emoji: "🏊", name: "游泳" },
      { emoji: "🚴", name: "骑行" },
      { emoji: "🏋️", name: "健身" },
      { emoji: "📦", name: "其他" }
    ],
    showDeleteDialog: false,
    deleteType: "",
    deleteId: ""
  },
  onShow: function() { this.loadAll(); this.loadEntries(); },
  loadEntries: function() {
    var all = storage.getAllEntries();
    all.sort(function(a, b) { return b.date.localeCompare(a.date); });
    var entries = all.slice(0, 20).map(function(e) {
      var d = dateUtil.parseDate(e.date);
      return { date: e.date, dateLabel: (d.getMonth()+1) + "月" + d.getDate() + "日", weekday: dateUtil.getWeekday(d), preview: (e.content || "").slice(0, 40), charCount: (e.content || "").length };
    });
    this.setData({ entries: entries });
  },
  loadAll: function() {
    var todos = storage.getTodos().sort(function(a, b) {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      return a.created_at - b.created_at;
    });
    this.setData({ todos: todos, memos: storage.getMemos(), bodies: storage.getBodies() });
  },
  onToggleSummary: function() { this.setData({ summaryExpanded: !this.data.summaryExpanded }); },
  onEntryTap: function(e) { wx.navigateTo({ url: "/pages/write/write?date=" + e.currentTarget.dataset.date }); },
  onToggleTodos: function() { this.setData({ todosExpanded: !this.data.todosExpanded }); },
  onToggleMemos: function() { this.setData({ memosExpanded: !this.data.memosExpanded }); },
  onToggleBody: function() { this.setData({ bodyExpanded: !this.data.bodyExpanded }); },
  noop: function() {},
  // Todo
  onAddTodo: function() { this.setData({ showTodoPopup: true, todoEditingId: null, todoFormTitle: "", todoFormDeadline: "", todoFormNote: "" }); },
  onEditTodo: function(e) {
    var id = e.currentTarget.dataset.id;
    var t = this.data.todos.find(function(x) { return x.id === id; });
    if (t) this.setData({ showTodoPopup: true, todoEditingId: id, todoFormTitle: t.title, todoFormDeadline: t.deadline || "", todoFormNote: t.note || "" });
  },
  onTodoTitleInput: function(e) { this.setData({ todoFormTitle: e.detail.value }); },
  onTodoNoteInput: function(e) { this.setData({ todoFormNote: e.detail.value }); },
  onTodoDateChange: function(e) { this.setData({ todoFormDeadline: e.detail.value }); },
  onCloseTodoPopup: function() { this.setData({ showTodoPopup: false }); },
  onSaveTodo: function() {
    if (!this.data.todoFormTitle.trim()) { wx.showToast({ title: "请输入标题", icon: "none" }); return; }
    storage.saveTodo({ id: this.data.todoEditingId || undefined, title: this.data.todoFormTitle.trim(), deadline: this.data.todoFormDeadline || null, note: this.data.todoFormNote.trim(), done: false });
    this.setData({ showTodoPopup: false }); this.loadAll();
  },
  onToggleTodoDone: function(e) {
    var id = e.currentTarget.dataset.id;
    var t = this.data.todos.find(function(x) { return x.id === id; });
    if (t) { storage.saveTodo({ id: id, title: t.title, deadline: t.deadline, note: t.note, done: !t.done }); this.loadAll(); }
  },
  // Memo
  onAddMemo: function() { this.setData({ showMemoPopup: true, memoEditingId: null, memoFormTitle: "", memoFormContent: "" }); },
  onEditMemo: function(e) {
    var id = e.currentTarget.dataset.id;
    var m = this.data.memos.find(function(x) { return x.id === id; });
    if (m) this.setData({ showMemoPopup: true, memoEditingId: id, memoFormTitle: m.title, memoFormContent: m.content || "" });
  },
  onMemoTitleInput: function(e) { this.setData({ memoFormTitle: e.detail.value }); },
  onMemoContentInput: function(e) { this.setData({ memoFormContent: e.detail.value }); },
  onCloseMemoPopup: function() { this.setData({ showMemoPopup: false }); },
  onSaveMemo: function() {
    if (!this.data.memoFormTitle.trim()) { wx.showToast({ title: "请输入标题", icon: "none" }); return; }
    storage.saveMemo({ id: this.data.memoEditingId || undefined, title: this.data.memoFormTitle.trim(), content: this.data.memoFormContent.trim() });
    this.setData({ showMemoPopup: false }); this.loadAll();
  },
  // Body
  onAddBody: function() { this.setData({ showBodyPopup: true, bodyEditingId: null, bodyFormWeight: "", bodyFormExercise: "跑步", bodyFormDuration: "", bodyFormNote: "", bodyFormDate: dateUtil.getToday() }); },
  onBodyWeightInput: function(e) { this.setData({ bodyFormWeight: e.detail.value }); },
  onBodyDurationInput: function(e) { this.setData({ bodyFormDuration: e.detail.value }); },
  onBodyNoteInput: function(e) { this.setData({ bodyFormNote: e.detail.value }); },
  onBodyDateChange: function(e) { this.setData({ bodyFormDate: e.detail.value }); },
  onBodyExerChange: function(e) { this.setData({ bodyFormExercise: e.currentTarget.dataset.name }); },
  onCloseBodyPopup: function() { this.setData({ showBodyPopup: false }); },
  onSaveBody: function() {
    var w = parseFloat(this.data.bodyFormWeight);
    var d = parseInt(this.data.bodyFormDuration, 10);
    if (isNaN(w) || w <= 0) { wx.showToast({ title: "请输入体重", icon: "none" }); return; }
    if (isNaN(d) || d <= 0) { wx.showToast({ title: "请输入时长", icon: "none" }); return; }
    storage.saveBody({ id: this.data.bodyEditingId || undefined, weight: w, exercise: this.data.bodyFormExercise, duration: d, note: this.data.bodyFormNote.trim(), date: this.data.bodyFormDate });
    this.setData({ showBodyPopup: false }); this.loadAll();
  },
  // Delete
  onDeleteItem: function(e) { this.setData({ showDeleteDialog: true, deleteType: e.currentTarget.dataset.type, deleteId: e.currentTarget.dataset.id }); },
  onConfirmDelete: function() {
    var type = this.data.deleteType;
    var id = this.data.deleteId;
    if (type === "todo") storage.deleteTodo(id);
    else if (type === "memo") storage.deleteMemo(id);
    else if (type === "body") storage.deleteBody(id);
    this.setData({ showDeleteDialog: false }); this.loadAll();
  },
  onCancelDelete: function() { this.setData({ showDeleteDialog: false }); }
});
