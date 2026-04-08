// ===== Constants =====
const MONTHS_VI = [
  'Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
  'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'
];
const DAYS_FULL_VI = ['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'];
const DAYS_VI = ['CN','T2','T3','T4','T5','T6','T7'];
const CAT_ICON  = { work: '💼', health: '💪', finance: '💰' };
const CAT_LABEL = { work: 'Công việc', health: 'Sức khỏe', finance: 'Chi tiêu' };
const CONFETTI_COLORS = ['#5B5BD6','#1D9E75','#D85A30','#BA7517','#D4537E'];

// ===== Gamification Config =====
const XP_PER_TASK   = 10;
const XP_BONUS_TIME = 5;   // bonus if done before scheduled time
const XP_BONUS_CAT  = { work: 0, health: 5, finance: 3 };
const LEVELS = [
  { level:1,  name:'Tập sự',       minXP:0,    icon:'🌱' },
  { level:2,  name:'Chăm chỉ',     minXP:50,   icon:'⚡' },
  { level:3,  name:'Tích cực',     minXP:150,  icon:'🔥' },
  { level:4,  name:'Chuyên nghiệp',minXP:300,  icon:'💎' },
  { level:5,  name:'Siêu năng suất',minXP:600, icon:'🚀' },
  { level:6,  name:'Huyền thoại',  minXP:1000, icon:'👑' },
];
const ACHIEVEMENTS = [
  { id:'first',     icon:'🎯', name:'Bước đầu tiên',   desc:'Hoàn thành task đầu tiên',         check: g => g.totalDone >= 1 },
  { id:'streak3',   icon:'🔥', name:'Bốc lửa',         desc:'Streak 3 ngày liên tiếp',          check: g => g.streak >= 3 },
  { id:'streak7',   icon:'💥', name:'Tuần lễ thần thánh',desc:'Streak 7 ngày liên tiếp',        check: g => g.streak >= 7 },
  { id:'streak30',  icon:'🌟', name:'Tháng vàng',       desc:'Streak 30 ngày',                  check: g => g.streak >= 30 },
  { id:'done10',    icon:'⚡', name:'Máy làm việc',     desc:'Hoàn thành 10 task',              check: g => g.totalDone >= 10 },
  { id:'done50',    icon:'💪', name:'Chiến binh',       desc:'Hoàn thành 50 task',              check: g => g.totalDone >= 50 },
  { id:'done100',   icon:'🏆', name:'Trăm task',        desc:'Hoàn thành 100 task',             check: g => g.totalDone >= 100 },
  { id:'health5',   icon:'🥗', name:'Lối sống lành mạnh',desc:'Xong 5 task sức khỏe',          check: g => g.catDone.health >= 5 },
  { id:'level5',    icon:'🚀', name:'Lên đỉnh',         desc:'Đạt Level 5',                     check: g => g.level >= 5 },
  { id:'allday',    icon:'🎪', name:'Ngày hoàn hảo',    desc:'Xong tất cả task trong 1 ngày',   check: g => g.perfectDays >= 1 },
];
const THEMES = [
  { id:'default', name:'Mặc định',  icon:'🔵', unlock:'Mặc định',         unlockCond: g => true },
  { id:'forest',  name:'Rừng xanh', icon:'🌿', unlock:'Streak 3 ngày',    unlockCond: g => g.streak >= 3,
    vars: {'--accent':'#1D9E75','--accent-light':'#E1F5EE','--accent-mid':'#5DCAA5'} },
  { id:'sunset',  name:'Hoàng hôn', icon:'🌅', unlock:'Hoàn thành 10 task',unlockCond: g => g.totalDone >= 10,
    vars: {'--accent':'#D85A30','--accent-light':'#FAECE7','--accent-mid':'#F0997B'} },
  { id:'galaxy',  name:'Thiên hà',  icon:'🌌', unlock:'Level 4',           unlockCond: g => g.level >= 4,
    vars: {'--accent':'#7F77DD','--accent-light':'#EEEDFE','--accent-mid':'#AFA9EC'} },
  { id:'gold',    name:'Hoàng kim', icon:'👑', unlock:'Streak 7 ngày',     unlockCond: g => g.streak >= 7,
    vars: {'--accent':'#BA7517','--accent-light':'#FAEEDA','--accent-mid':'#EF9F27'} },
  { id:'cherry',  name:'Hoa anh đào',icon:'🌸',unlock:'Level 5',           unlockCond: g => g.level >= 5,
    vars: {'--accent':'#D4537E','--accent-light':'#FBEAF0','--accent-mid':'#ED93B1'} },
];

// ===== State =====
let tasks = JSON.parse(localStorage.getItem('tasks_v4') || '[]');
let selectedCat  = 'work';
let editCat      = 'work';
let repeatOn     = false;
let editRepeatOn = false;
let editingIdx   = null;
let activeDayStr = null;

// ===== Game State =====
const DEFAULT_GAME = { xp:0, level:1, streak:0, lastDoneDate:'', totalDone:0, catDone:{work:0,health:0,finance:0}, achievements:[], perfectDays:0, activeTheme:'default' };
let game = { ...DEFAULT_GAME, ...JSON.parse(localStorage.getItem('gameState_v4') || '{}') };
if (!game.catDone) game.catDone = {work:0,health:0,finance:0};

let curYear, curMonth;
const today = new Date();
curYear  = today.getFullYear();
curMonth = today.getMonth();

// ===== Helpers =====
function toDateStr(d) {
  return d.getFullYear() + '-'
    + String(d.getMonth() + 1).padStart(2, '0') + '-'
    + String(d.getDate()).padStart(2, '0');
}
function save() { localStorage.setItem('tasks_v4', JSON.stringify(tasks)); }
function getEffectiveTasks(dateStr) {
  return tasks.filter(t => t.date === dateStr || (t.repeat && t.date <= dateStr));
}
function formatDayTitle(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const todayStr = toDateStr(today);
  const prefix = dateStr === todayStr ? 'Hôm nay — ' : DAYS_FULL_VI[d.getDay()] + ', ';
  return prefix + d.getDate() + ' ' + MONTHS_VI[d.getMonth()] + ' ' + d.getFullYear();
}

// ===== Stats =====
function updateStats() {
  const todayStr = toDateStr(today);
  document.getElementById('statTotal').textContent = tasks.length;
  document.getElementById('statToday').textContent =
    getEffectiveTasks(todayStr).filter(t => !t.done).length;
  const monthKey = curYear + '-' + String(curMonth + 1).padStart(2, '0');
  document.getElementById('statDone').textContent =
    tasks.filter(t => t.done && t.date && t.date.startsWith(monthKey)).length;
}

// ===== Calendar =====
function renderCalendar() {
  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';
  DAYS_VI.forEach(d => {
    const el = document.createElement('div');
    el.className = 'day-name';
    el.textContent = d;
    grid.appendChild(el);
  });
  document.getElementById('monthLabel').textContent = MONTHS_VI[curMonth] + ' ' + curYear;
  const firstDay    = new Date(curYear, curMonth, 1).getDay();
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const todayStr    = toDateStr(today);
  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day empty';
    grid.appendChild(el);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = curYear + '-'
      + String(curMonth + 1).padStart(2, '0') + '-'
      + String(d).padStart(2, '0');
    const el = document.createElement('div');
    el.className = 'cal-day';
    if (dateStr === todayStr) el.classList.add('today');
    const dayTasks = getEffectiveTasks(dateStr);
    const numEl = document.createElement('div');
    numEl.className = 'day-num';
    numEl.textContent = d;
    el.appendChild(numEl);
    if (dayTasks.length > 0) {
      const emojiRow = document.createElement('div');
      emojiRow.className = 'cal-emoji-row';
      dayTasks.slice(0, 6).forEach(t => {
        const span = document.createElement('span');
        span.className = 'cal-emoji' + (t.done ? ' done' : '');
        span.textContent = t.icon || CAT_ICON[t.category];
        emojiRow.appendChild(span);
      });
      if (dayTasks.length > 6) {
        const more = document.createElement('div');
        more.className = 'more-badge';
        more.textContent = '+' + (dayTasks.length - 6);
        emojiRow.appendChild(more);
      }
      el.appendChild(emojiRow);
    }
    el.addEventListener('click', () => openDayModal(dateStr));
    grid.appendChild(el);
  }
  updateStats();
}

// ===== Day Detail Modal =====
function openDayModal(dateStr) {
  activeDayStr = dateStr;
  document.getElementById('dayModalTitle').textContent = formatDayTitle(dateStr);
  renderDayTaskList();
  document.getElementById('dayModal').classList.add('open');
}
function closeDayModal() {
  document.getElementById('dayModal').classList.remove('open');
  activeDayStr = null;
  renderCalendar();
}
function renderDayTaskList() {
  const list = document.getElementById('dayTaskList');
  list.innerHTML = '';
  const dayTasks = getEffectiveTasks(activeDayStr);
  if (!dayTasks.length) {
    list.innerHTML = '<div class="empty-state">Chưa có nhiệm vụ nào — thêm ngay!</div>';
    return;
  }
  dayTasks.forEach(t => {
    const realIdx = tasks.indexOf(t);
    const item = document.createElement('div');
    item.className = 'task-list-item' + (t.done ? ' done' : '');
    item.innerHTML = `
      <div class="task-check ${t.done ? 'checked' : ''}" data-idx="${realIdx}">${t.done ? '✓' : ''}</div>
      ${t.image ? `<img class="task-thumb" src="${t.image}" alt="" data-src="${t.image}">` : `<span style="font-size:20px;flex-shrink:0;">${t.icon || CAT_ICON[t.category]}</span>`}
      <div style="flex:1;min-width:0;">
        <div class="task-text">${t.text}</div>
        ${(t.subtasks && t.subtasks.length) ? (() => {
          const total = t.subtasks.length;
          const done  = t.subtasks.filter(s => s.done).length;
          const pct   = Math.round(done/total*100);
          return `<div class="subtask-progress-row" style="margin-top:5px;">
            <span class="subtask-progress-label">${done}/${total}</span>
            <div class="subtask-progress-track"><div class="subtask-progress-fill" style="width:${pct}%"></div></div>
            <span class="subtask-progress-pct">${pct}%</span>
          </div>`;
        })() : ''}
      </div>
      <div class="task-meta">
        ${t.time ? `<span class="task-time">${t.time}</span>` : ''}
        <span class="cat-badge ${t.category}">${CAT_LABEL[t.category]}</span>
      </div>
      <button class="task-edit-btn" data-idx="${realIdx}" title="Sửa">✎</button>
    `;
    // Thumbnail lightbox
    if (t.image) {
      item.querySelector('.task-thumb').addEventListener('click', e => {
        e.stopPropagation();
        openLightbox(e.currentTarget.dataset.src);
      });
    }
    // Expand subtasks on click
    if (t.subtasks && t.subtasks.length) {
      const subtaskSection = document.createElement('div');
      subtaskSection.className = 'subtask-section';
      subtaskSection.style.display = 'none';
      t.subtasks.forEach((st, si) => {
        const stItem = document.createElement('div');
        stItem.className = 'subtask-day-item';
        stItem.innerHTML = `
          <div class="subtask-day-check ${st.done ? 'checked' : ''}" data-ridx="${realIdx}" data-si="${si}">${st.done ? '✓' : ''}</div>
          <div class="subtask-day-text ${st.done ? 'done' : ''}">${escHtml(st.text)}</div>
        `;
        stItem.querySelector('.subtask-day-check').addEventListener('click', e => {
          e.stopPropagation();
          const ri = parseInt(e.currentTarget.dataset.ridx);
          const si2 = parseInt(e.currentTarget.dataset.si);
          tasks[ri].subtasks[si2].done = !tasks[ri].subtasks[si2].done;
          // Auto-complete parent task if all subtasks done
          if (tasks[ri].subtasks.every(s => s.done) && !tasks[ri].done) {
            tasks[ri].done = true;
            spawnConfetti(); onTaskDone(tasks[ri]);
          }
          save(); renderDayTaskList(); updateStats();
        });
        subtaskSection.appendChild(stItem);
      });
      item.appendChild(subtaskSection);

      // Toggle expand on item click (not on buttons)
      item.addEventListener('click', e => {
        if (e.target.classList.contains('task-check') ||
            e.target.classList.contains('task-edit-btn') ||
            e.target.classList.contains('task-thumb') ||
            e.target.classList.contains('subtask-day-check')) return;
        const isOpen = subtaskSection.style.display !== 'none';
        subtaskSection.style.display = isOpen ? 'none' : 'block';
      });
    }
    item.querySelector('.task-check').addEventListener('click', e => {
      e.stopPropagation();
      const i = parseInt(e.currentTarget.dataset.idx);
      const snap2 = snapshotTasks();
      tasks[i].done = !tasks[i].done;
      const action = tasks[i].done ? 'done' : 'undone';
      if (tasks[i].done) { spawnConfetti(); onTaskDone(tasks[i]); }
      save();
      pushHistory(action, tasks[i].text, snap2);
      renderDayTaskList(); updateStats(); renderCountdownWidget();
    });
    item.querySelector('.task-edit-btn').addEventListener('click', e => {
      e.stopPropagation();
      openEditModal(parseInt(e.currentTarget.dataset.idx));
    });
    list.appendChild(item);
  });
}

// ===== Add Modal =====
function resetAddForm(dateStr) {
  document.getElementById('taskDate').value = dateStr || toDateStr(today);
  document.getElementById('taskInput').value = '';
  document.getElementById('taskTime').value  = '';
  repeatOn = false;
  document.getElementById('repeatToggle').classList.remove('on');
  selectedCat = 'work';
  document.querySelectorAll('#taskModal .cat-opt').forEach(o => o.classList.remove('selected'));
  document.querySelector('#taskModal .cat-opt[data-cat="work"]').classList.add('selected');
  // Reset icon
  selectedIcon = '💼';
  document.getElementById('iconPickBtn').textContent = '💼';
  document.getElementById('emojiPicker').style.display = 'none';
  document.getElementById('emojiPicker').querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
  // Reset image
  selectedImageB64 = null;
  document.getElementById('taskImageInput').value = '';
  document.getElementById('imgPreview').style.display = 'none';
  document.getElementById('imgUploadPlaceholder').style.display = 'flex';
  // Reset sub-tasks
  addSubtasks = [];
  document.getElementById('subtaskPanel').style.display = 'none';
  document.getElementById('subtaskList').innerHTML = '';
  document.getElementById('subtaskLoading').style.display = 'none';
  document.getElementById('aiSubtaskBtn').classList.remove('loading');
}
function openModal() {
  resetAddForm(toDateStr(today));
  document.getElementById('taskModal').classList.add('open');
  setTimeout(() => document.getElementById('taskInput').focus(), 200);
}
function openAddModalForDay() {
  resetAddForm(activeDayStr);
  document.getElementById('dayModal').classList.remove('open');
  document.getElementById('taskModal').classList.add('open');
  setTimeout(() => document.getElementById('taskInput').focus(), 200);
}
function closeAddModal() {
  document.getElementById('taskModal').classList.remove('open');
}
function addTask() {
  const text = document.getElementById('taskInput').value.trim();
  const date = document.getElementById('taskDate').value;
  if (!text || !date) { document.getElementById('taskInput').focus(); return; }
  const snap = snapshotTasks();
  tasks.push({ id: Date.now(), text, date, time: document.getElementById('taskTime').value, category: selectedCat, repeat: repeatOn, done: false, icon: selectedIcon, image: selectedImageB64 || null, subtasks: addSubtasks.length ? JSON.parse(JSON.stringify(addSubtasks)) : [] });
  save();
  pushHistory('add', text, snap);
  closeAddModal();
  if (activeDayStr) {
    openDayModal(activeDayStr);
  } else {
    renderCalendar();
  }
  renderCountdownWidget();
  refreshTimelineIfOpen();
}

// ===== Edit Modal =====
function openEditModal(idx) {
  editingIdx = idx;
  const t = tasks[idx];
  document.getElementById('editTaskInput').value = t.text;
  document.getElementById('editTaskDate').value  = t.date;
  document.getElementById('editTaskTime').value  = t.time || '';
  editCat = t.category;
  editRepeatOn = t.repeat || false;
  document.querySelectorAll('#editCatSelector .cat-opt').forEach(o => {
    o.classList.toggle('selected', o.dataset.cat === editCat);
  });
  document.getElementById('editRepeatToggle').classList.toggle('on', editRepeatOn);
  // Restore icon
  selectedEditIcon = t.icon || CAT_ICON[t.category];
  document.getElementById('editIconPickBtn').textContent = selectedEditIcon;
  document.getElementById('editEmojiPicker').style.display = 'none';
  // Restore image
  selectedEditImageB64 = t.image || null;
  const editPreview = document.getElementById('editImgPreview');
  const editPlaceholder = document.getElementById('editImgUploadPlaceholder');
  const editRemoveBtn = document.getElementById('editImgRemoveBtn');
  if (t.image) {
    editPreview.src = t.image;
    editPreview.style.display = 'block';
    editPlaceholder.style.display = 'none';
    editRemoveBtn.style.display = 'inline-block';
  } else {
    editPreview.src = '';
    editPreview.style.display = 'none';
    editPlaceholder.style.display = 'flex';
    editRemoveBtn.style.display = 'none';
  }
  // Load sub-tasks
  editSubtasks = t.subtasks ? JSON.parse(JSON.stringify(t.subtasks)) : [];
  const editSubtaskPanel = document.getElementById('editSubtaskPanel');
  const editSubtaskListEl = document.getElementById('editSubtaskList');
  if (editSubtasks.length) {
    editSubtaskPanel.style.display = 'flex';
    renderSubtaskList(editSubtaskListEl, editSubtasks, () => renderSubtaskList(editSubtaskListEl, editSubtasks, () => {}));
  } else {
    editSubtaskPanel.style.display = 'none';
    editSubtaskListEl.innerHTML = '';
  }
  document.getElementById('editSubtaskLoading').style.display = 'none';
  document.getElementById('editAiSubtaskBtn').classList.remove('loading');
  document.getElementById('editModal').classList.add('open');
  setTimeout(() => document.getElementById('editTaskInput').focus(), 200);
}
function closeEditModal() {
  document.getElementById('editModal').classList.remove('open');
  editingIdx = null;
}
function saveEdit() {
  if (editingIdx === null) return;
  const text = document.getElementById('editTaskInput').value.trim();
  const date = document.getElementById('editTaskDate').value;
  if (!text || !date) { document.getElementById('editTaskInput').focus(); return; }
  const snapEdit = snapshotTasks();
  tasks[editingIdx] = { ...tasks[editingIdx], text, date, time: document.getElementById('editTaskTime').value, category: editCat, repeat: editRepeatOn, icon: selectedEditIcon, image: selectedEditImageB64 !== undefined ? selectedEditImageB64 : tasks[editingIdx].image, subtasks: JSON.parse(JSON.stringify(editSubtasks)) };
  save();
  pushHistory('edit', text, snapEdit);
  closeEditModal();
  renderDayTaskList();
  updateStats();
  renderCountdownWidget();
  refreshTimelineIfOpen();
}
function deleteTask() {
  if (editingIdx === null) return;
  const snapDel = snapshotTasks();
  const label   = tasks[editingIdx].text;
  tasks.splice(editingIdx, 1);
  save();
  const hIdx = actionHistory.length;
  pushHistory('delete', label, snapDel);
  closeEditModal();
  renderDayTaskList();
  updateStats();
  renderCountdownWidget();
  refreshTimelineIfOpen();
  showUndoToast(label, 0);
}

// ===== Confetti =====
function spawnConfetti(count) {
  const box = document.getElementById('confettiBox');
  const n = count || 18;
  for (let i = 0; i < n; i++) {
    const piece = document.createElement('div');
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const size  = 5 + Math.random() * 6;
    piece.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:${Math.random()>0.5?'50%':'2px'};left:${Math.random()*100}%;top:${Math.random()*30}%;background:${color};animation:confettifall ${0.7+Math.random()*0.6}s ease-out ${Math.random()*0.4}s forwards;`;
    box.appendChild(piece);
    setTimeout(() => piece.remove(), 1400);
  }
}

// ===== Event Listeners =====
document.getElementById('openModalBtn').addEventListener('click', openModal);

// Add modal
document.getElementById('modalClose').addEventListener('click', closeAddModal);
document.getElementById('taskModal').addEventListener('click', e => { if (e.target === document.getElementById('taskModal')) closeAddModal(); });
document.getElementById('addBtn').addEventListener('click', addTask);
document.getElementById('taskInput').addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
document.querySelectorAll('#taskModal .cat-opt').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('#taskModal .cat-opt').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected'); selectedCat = opt.dataset.cat;
  });
});
document.getElementById('repeatToggle').addEventListener('click', () => {
  repeatOn = !repeatOn;
  document.getElementById('repeatToggle').classList.toggle('on', repeatOn);
});

// Day modal
document.getElementById('dayModalClose').addEventListener('click', closeDayModal);
document.getElementById('dayModal').addEventListener('click', e => { if (e.target === document.getElementById('dayModal')) closeDayModal(); });
document.getElementById('addTaskFromDayBtn').addEventListener('click', openAddModalForDay);

// Edit modal
document.getElementById('editModalClose').addEventListener('click', closeEditModal);
document.getElementById('editModal').addEventListener('click', e => { if (e.target === document.getElementById('editModal')) closeEditModal(); });
document.getElementById('saveEditBtn').addEventListener('click', saveEdit);
document.getElementById('deleteTaskBtn').addEventListener('click', deleteTask);
document.getElementById('editTaskInput').addEventListener('keydown', e => { if (e.key === 'Enter') saveEdit(); });
document.querySelectorAll('#editCatSelector .cat-opt').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('#editCatSelector .cat-opt').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected'); editCat = opt.dataset.cat;
  });
});
document.getElementById('editRepeatToggle').addEventListener('click', () => {
  editRepeatOn = !editRepeatOn;
  document.getElementById('editRepeatToggle').classList.toggle('on', editRepeatOn);
});

// Month navigation
document.getElementById('prevMonth').addEventListener('click', () => {
  curMonth--; if (curMonth < 0) { curMonth = 11; curYear--; } renderCalendar();
});
document.getElementById('nextMonth').addEventListener('click', () => {
  curMonth++; if (curMonth > 11) { curMonth = 0; curYear++; } renderCalendar();
});

// ===== Stats Modal =====
function openStatsModal() {
  renderStats();
  document.getElementById('statsModal').classList.add('open');
}
function closeStatsModal() {
  document.getElementById('statsModal').classList.remove('open');
}

// Tab switching
document.querySelectorAll('.stats-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.stats-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.stats-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'chart') renderChart();
  });
});

document.getElementById('openStatsBtn').addEventListener('click', openStatsModal);
document.getElementById('statsModalClose').addEventListener('click', closeStatsModal);
document.getElementById('statsModal').addEventListener('click', e => {
  if (e.target === document.getElementById('statsModal')) closeStatsModal();
});

function renderStats() {
  const todayStr = toDateStr(today);
  const total    = tasks.length;
  const done     = tasks.filter(t => t.done).length;
  const pending  = total - done;
  const todayCount = getEffectiveTasks(todayStr).filter(t => !t.done).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  document.getElementById('s-total').textContent   = total;
  document.getElementById('s-done').textContent    = done;
  document.getElementById('s-pending').textContent = pending;
  document.getElementById('s-today').textContent   = todayCount;
  document.getElementById('s-pct').textContent     = pct + '%';

  // Animate bar after paint
  setTimeout(() => {
    document.getElementById('s-bar').style.width = pct + '%';
  }, 50);

  // Note
  let note = '';
  if (pct === 100 && total > 0) note = '🎉 Tuyệt vời! Bạn đã hoàn thành tất cả nhiệm vụ!';
  else if (pct >= 80) note = '💪 Rất tốt! Gần hoàn thành rồi!';
  else if (pct >= 50) note = '🔥 Đang tiến triển tốt, tiếp tục nào!';
  else if (total === 0) note = 'Chưa có nhiệm vụ nào. Thêm ngay!';
  else note = '📌 Còn ' + pending + ' nhiệm vụ chưa hoàn thành.';
  document.getElementById('s-note').textContent = note;

  // Category breakdown
  const cats = ['work', 'health', 'finance'];
  const catCount = {};
  cats.forEach(c => { catCount[c] = tasks.filter(t => t.category === c).length; });
  const maxCat = Math.max(...Object.values(catCount), 1);
  cats.forEach(c => {
    document.getElementById('bc-' + c).textContent = catCount[c];
    setTimeout(() => {
      document.getElementById('b-' + c).style.width = Math.round((catCount[c] / maxCat) * 100) + '%';
    }, 80);
  });

  renderBestDay();
}

function getLast14Days() {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(toDateStr(d));
  }
  return days;
}

function renderChart() {
  const canvas = document.getElementById('statsChart');
  const ctx    = canvas.getContext('2d');
  const days   = getLast14Days();

  // Build data
  const dataWork    = days.map(d => tasks.filter(t => t.date === d && t.done && t.category === 'work').length);
  const dataHealth  = days.map(d => tasks.filter(t => t.date === d && t.done && t.category === 'health').length);
  const dataFinance = days.map(d => tasks.filter(t => t.date === d && t.done && t.category === 'finance').length);

  const W = canvas.offsetWidth;
  const H = 180;
  canvas.width  = W * window.devicePixelRatio;
  canvas.height = H * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const padL = 24, padR = 8, padT = 12, padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxVal = Math.max(...days.map((_, i) => dataWork[i] + dataHealth[i] + dataFinance[i]), 1);
  const barW   = Math.floor(chartW / days.length) - 3;
  const gap    = (chartW - barW * days.length) / (days.length - 1);

  // Detect dark mode
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const gridColor  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const labelColor = isDark ? '#888780' : '#888780';
  const colors = { work: '#5B5BD6', health: '#1D9E75', finance: '#BA7517' };

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const y = padT + chartH - (i / 4) * chartH;
    ctx.strokeStyle = gridColor;
    ctx.lineWidth   = 0.5;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
    if (i > 0) {
      ctx.fillStyle  = labelColor;
      ctx.font       = `10px DM Sans, sans-serif`;
      ctx.textAlign  = 'right';
      ctx.fillText(Math.round((i / 4) * maxVal), padL - 3, y + 3);
    }
  }

  // Bars (stacked)
  days.forEach((d, i) => {
    const x   = padL + i * (barW + gap);
    let   yBot = padT + chartH;
    const layers = [
      { val: dataWork[i],    color: colors.work    },
      { val: dataHealth[i],  color: colors.health  },
      { val: dataFinance[i], color: colors.finance  }
    ];
    layers.forEach(l => {
      if (l.val === 0) return;
      const bH = Math.round((l.val / maxVal) * chartH);
      ctx.fillStyle = l.color;
      const radius  = Math.min(3, bH / 2);
      ctx.beginPath();
      ctx.roundRect(x, yBot - bH, barW, bH, [radius, radius, 0, 0]);
      ctx.fill();
      yBot -= bH;
    });

    // X label (day/month)
    const dateObj = new Date(d + 'T00:00:00');
    const label   = (i % 2 === 0) ? dateObj.getDate() + '/' + (dateObj.getMonth() + 1) : '';
    ctx.fillStyle = labelColor;
    ctx.font      = `10px DM Sans, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(label, x + barW / 2, padT + chartH + 14);

    // Highlight today
    if (d === toDateStr(today)) {
      ctx.strokeStyle = isDark ? 'rgba(91,91,214,0.5)' : 'rgba(91,91,214,0.3)';
      ctx.lineWidth   = 1;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(x + barW / 2, padT);
      ctx.lineTo(x + barW / 2, padT + chartH);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });
}

function renderBestDay() {
  // Count completed tasks per date
  const dayMap = {};
  tasks.forEach(t => {
    if (!t.done || !t.date) return;
    dayMap[t.date] = (dayMap[t.date] || 0) + 1;
  });

  const entries = Object.entries(dayMap).sort((a, b) => b[1] - a[1]);

  // Best day card
  const bestCard = document.getElementById('bestDayCard');
  if (entries.length === 0) {
    bestCard.innerHTML = '<div style="font-size:13px;color:var(--text3);">Chưa có dữ liệu. Hoàn thành một vài nhiệm vụ nhé!</div>';
  } else {
    const [bestDate, bestCount] = entries[0];
    const d = new Date(bestDate + 'T00:00:00');
    const label = DAYS_FULL_VI[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS_VI[d.getMonth()] + ' ' + d.getFullYear();
    bestCard.innerHTML = `
      <div style="font-size:11px;color:var(--accent);font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">🏆 Ngày năng suất nhất</div>
      <div style="font-size:17px;font-weight:600;color:var(--accent);margin-top:2px;">${label}</div>
      <div style="font-size:13px;color:var(--text2);margin-top:2px;">Hoàn thành <strong>${bestCount}</strong> nhiệm vụ</div>
    `;
  }

  // Streak: consecutive days with ≥1 done task up to today
  let streak = 0;
  const check = new Date(today);
  while (true) {
    const ds = toDateStr(check);
    if (dayMap[ds]) { streak++; check.setDate(check.getDate() - 1); }
    else break;
  }

  // Average per active day
  const activeDays = entries.length;
  const totalDone  = tasks.filter(t => t.done).length;
  const avg = activeDays > 0 ? (totalDone / activeDays).toFixed(1) : '0';

  document.getElementById('streakBox').innerHTML = `
    <div class="streak-label">Chuỗi ngày</div>
    <div class="streak-val">${streak} 🔥</div>
    <div class="streak-sub">ngày liên tiếp</div>
  `;
  document.getElementById('avgBox').innerHTML = `
    <div class="streak-label">Trung bình</div>
    <div class="streak-val">${avg}</div>
    <div class="streak-sub">NV/ngày hoạt động</div>
  `;

  // Top 5
  const rankLabels = ['🥇','🥈','🥉','4.','5.'];
  const rankClasses = ['gold','silver','bronze','',''];
  const top5El = document.getElementById('top5List');
  top5El.innerHTML = '';
  entries.slice(0, 5).forEach(([date, count], i) => {
    const d2    = new Date(date + 'T00:00:00');
    const label = d2.getDate() + ' ' + MONTHS_VI[d2.getMonth()] + ' ' + d2.getFullYear();
    const item  = document.createElement('div');
    item.className = 'top5-item';
    item.innerHTML = `
      <div class="top5-rank ${rankClasses[i]}">${rankLabels[i]}</div>
      <div class="top5-date">${label}</div>
      <div class="top5-count">${count} NV</div>
    `;
    top5El.appendChild(item);
  });
  if (entries.length === 0) {
    top5El.innerHTML = '<div class="empty-state">Chưa có dữ liệu</div>';
  }
}

// ===== Notification System =====

// Tracks which alerts have already fired: key = taskId + ':' + type ('early'|'exact'|'late')
const firedAlerts = new Set(JSON.parse(sessionStorage.getItem('firedAlerts') || '[]'));

function saveFired() {
  sessionStorage.setItem('firedAlerts', JSON.stringify([...firedAlerts]));
}

// Request browser notification permission on load
function requestNotifPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Send a browser notification + in-app toast
function sendAlert(task, type, minutesLate) {
  const key = task.id + ':' + type;
  if (firedAlerts.has(key)) return;
  firedAlerts.add(key);
  saveFired();

  const icon = { work: '💼', health: '💪', finance: '💰' }[task.category];
  let title, body;

  if (type === 'early') {
    title = '⏰ Sắp đến giờ!';
    body  = icon + ' ' + task.text + ' — còn 30 phút nữa';
  } else if (type === 'exact') {
    title = '🔔 Đến giờ rồi!';
    body  = icon + ' ' + task.text;
  } else {
    title = '⚠️ Trễ ' + minutesLate + ' phút!';
    body  = icon + ' ' + task.text + ' đã quá giờ';
  }

  // In-app toast
  showToast(title, body, type);

  // Browser notification (if permitted)
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: 'https://cdn.jsdelivr.net/npm/twemoji@14/assets/72x72/1f4c5.png' });
    } catch(e) {}
  }
}

// In-app toast UI
function showToast(title, body, type) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = `
      position: fixed; bottom: 24px; right: 24px;
      display: flex; flex-direction: column; gap: 10px;
      z-index: 9999; max-width: 320px;
    `;
    document.body.appendChild(container);
  }

  const colors = {
    early: { bg: '#FAEEDA', border: '#BA7517', text: '#412402' },
    exact: { bg: '#E1F5EE', border: '#1D9E75', text: '#04342C' },
    late:  { bg: '#FAECE7', border: '#D85A30', text: '#4A1B0C' }
  };
  const c = colors[type] || colors.exact;

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${c.bg};
    border: 1.5px solid ${c.border};
    border-radius: 12px;
    padding: 12px 14px;
    display: flex; flex-direction: column; gap: 3px;
    animation: toastIn 0.3s ease-out;
    cursor: pointer;
  `;
  toast.innerHTML = `
    <div style="font-size:13px;font-weight:600;color:${c.text};font-family:'DM Sans',sans-serif;">${title}</div>
    <div style="font-size:12px;color:${c.text};opacity:0.8;font-family:'DM Sans',sans-serif;">${body}</div>
  `;

  // Click to dismiss
  toast.addEventListener('click', () => toast.remove());

  // Auto dismiss after 8 seconds
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease-in forwards';
    setTimeout(() => toast.remove(), 300);
  }, 8000);
}

// Inject toast animations once
(function injectToastStyles() {
  const s = document.createElement('style');
  s.textContent = `
    @keyframes toastIn  { from { transform: translateX(60px); opacity:0; } to { transform: translateX(0); opacity:1; } }
    @keyframes toastOut { from { opacity:1; } to { opacity:0; transform: translateX(60px); } }
  `;
  document.head.appendChild(s);
})();

// Main check — runs every 30 seconds
function checkNotifications() {
  const now     = new Date();
  const dateStr = toDateStr(now);
  const nowMin  = now.getHours() * 60 + now.getMinutes();

  getEffectiveTasks(dateStr).forEach(t => {
    if (!t.time || t.done) return;

    const [h, m]   = t.time.split(':').map(Number);
    const taskMin  = h * 60 + m;
    const diff     = taskMin - nowMin; // positive = future, negative = past

    if (diff === 30 || (diff > 28 && diff < 32)) {
      // ~30 minutes early
      sendAlert(t, 'early', 0);
    } else if (diff === 0 || (diff > -2 && diff <= 0)) {
      // Exact time (within 2 min window)
      sendAlert(t, 'exact', 0);
    } else if (diff < 0 && diff >= -60) {
      // Overdue up to 60 minutes — fire once per 15-minute bracket
      const minutesLate = Math.abs(diff);
      const bracket = Math.floor(minutesLate / 15); // 0=1-15, 1=16-30, 2=31-45, 3=46-60
      const lateKey = t.id + ':late:' + bracket;
      if (!firedAlerts.has(lateKey)) {
        firedAlerts.add(lateKey);
        saveFired();
        sendAlert(t, 'late', minutesLate);
      }
    }
  });
}

// Start the notification loop
requestNotifPermission();
checkNotifications(); // run once immediately
setInterval(checkNotifications, 30 * 1000); // then every 30s

// ===== Auto-reschedule Dialog =====
// Tracks tasks already asked about this session
const askedReschedule = new Set(
  JSON.parse(sessionStorage.getItem('askedReschedule') || '[]')
);
function saveAsked() {
  sessionStorage.setItem('askedReschedule', JSON.stringify([...askedReschedule]));
}

// Inject dialog styles once
(function injectDialogStyles() {
  const s = document.createElement('style');
  s.textContent = `
    .reschedule-dialog {
      position: fixed;
      bottom: 24px; left: 50%;
      transform: translateX(-50%);
      width: min(360px, 92vw);
      background: var(--surface, #fff);
      border: 1.5px solid #D85A30;
      border-radius: 16px;
      padding: 14px 16px;
      z-index: 9998;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      font-family: 'DM Sans', sans-serif;
      animation: dialogSlideUp 0.35s cubic-bezier(.22,1,.36,1);
    }
    @keyframes dialogSlideUp {
      from { transform: translateX(-50%) translateY(30px); opacity:0; }
      to   { transform: translateX(-50%) translateY(0);    opacity:1; }
    }
    .reschedule-dialog.hiding {
      animation: dialogSlideDown 0.25s ease-in forwards;
    }
    @keyframes dialogSlideDown {
      to { transform: translateX(-50%) translateY(40px); opacity:0; }
    }
    .rd-header {
      display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px;
    }
    .rd-icon { font-size: 20px; line-height: 1; flex-shrink: 0; }
    .rd-body { display: flex; flex-direction: column; gap: 2px; }
    .rd-title { font-size: 13px; font-weight: 600; color: #D85A30; }
    .rd-task  { font-size: 14px; font-weight: 500; color: var(--text, #1a1a18); }
    .rd-sub   { font-size: 12px; color: var(--text3, #888780); }
    .rd-actions { display: flex; gap: 6px; }
    .rd-btn {
      flex: 1; padding: 9px 6px;
      border-radius: 10px; border: 0.5px solid;
      font-size: 12px; font-weight: 500;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer; transition: all 0.15s;
      text-align: center; line-height: 1.2;
    }
    .rd-btn.primary {
      background: #5B5BD6; color: white; border-color: #5B5BD6;
    }
    .rd-btn.primary:hover { opacity: 0.88; }
    .rd-btn.secondary {
      background: #FAEEDA; color: #412402; border-color: #BA7517;
    }
    .rd-btn.secondary:hover { background: #f5e0c0; }
    .rd-btn.ghost {
      background: transparent; color: var(--text3, #888780);
      border-color: rgba(0,0,0,0.12);
    }
    .rd-btn.ghost:hover { background: var(--surface2, #f5f5f3); }
  `;
  document.head.appendChild(s);
})();

let dialogQueue = [];   // pending dialogs
let dialogActive = false;

function queueRescheduleDialog(taskIdx, minutesLate) {
  // Don't queue duplicates
  if (dialogQueue.some(d => d.idx === taskIdx)) return;
  dialogQueue.push({ idx: taskIdx, minutesLate });
  if (!dialogActive) showNextDialog();
}

function showNextDialog() {
  if (dialogQueue.length === 0) { dialogActive = false; return; }
  dialogActive = true;
  const { idx, minutesLate } = dialogQueue.shift();

  // Task might have been completed or deleted since queueing
  const t = tasks[idx];
  if (!t || t.done) { showNextDialog(); return; }

  const [h, m]    = t.time.split(':').map(Number);
  const newH1     = h + 1 >= 24 ? null : h + 1;  // +1h, null if would pass midnight
  const newTime1  = newH1 !== null
    ? String(newH1).padStart(2,'0') + ':' + String(m).padStart(2,'0')
    : null;

  const tomorrowDate = (() => {
    const d = new Date(t.date + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    return toDateStr(d);
  })();

  const icon = CAT_ICON[t.category];
  const dialog = document.createElement('div');
  dialog.className = 'reschedule-dialog';
  dialog.innerHTML = `
    <div class="rd-header">
      <div class="rd-icon">⏰</div>
      <div class="rd-body">
        <div class="rd-title">Bạn đã bỏ lỡ ${minutesLate} phút!</div>
        <div class="rd-task">${icon} ${t.text}</div>
        <div class="rd-sub">Dự kiến lúc ${t.time} — muốn dời không?</div>
      </div>
    </div>
    <div class="rd-actions">
      ${newTime1
        ? `<button class="rd-btn primary" id="rd-1h">Dời → ${newTime1}</button>`
        : `<button class="rd-btn primary" id="rd-tomorrow">Dời → ngày mai</button>`
      }
      <button class="rd-btn secondary" id="rd-tomorrow2">Sang mai ${t.time}</button>
      <button class="rd-btn ghost" id="rd-skip">Bỏ qua</button>
    </div>
  `;

  function dismissDialog(action) {
    dialog.classList.add('hiding');
    setTimeout(() => {
      dialog.remove();
      dialogActive = false;
      showNextDialog();
    }, 260);

    if (action === 'reschedule1h' && newTime1) {
      tasks[idx].time = newTime1;
      save(); renderCalendar();
      showToast('✅ Đã dời giờ', `${icon} ${t.text} → ${newTime1}`, 'exact');
    } else if (action === 'tomorrow') {
      tasks[idx].date = tomorrowDate;
      save(); renderCalendar();
      const d = new Date(tomorrowDate + 'T00:00:00');
      const label = d.getDate() + '/' + (d.getMonth()+1);
      showToast('📅 Đã dời sang mai', `${icon} ${t.text} → ${label} ${t.time}`, 'early');
    }
    // 'skip' — do nothing
  }

  if (newTime1) {
    dialog.querySelector('#rd-1h').addEventListener('click', () => dismissDialog('reschedule1h'));
  } else {
    dialog.querySelector('#rd-tomorrow').addEventListener('click', () => dismissDialog('tomorrow'));
  }
  dialog.querySelector('#rd-tomorrow2').addEventListener('click', () => dismissDialog('tomorrow'));
  dialog.querySelector('#rd-skip').addEventListener('click',     () => dismissDialog('skip'));

  document.body.appendChild(dialog);

  // Auto-dismiss after 20 seconds if no action
  setTimeout(() => {
    if (document.body.contains(dialog)) dismissDialog('skip');
  }, 20000);
}

// Hook into the existing checkNotifications loop
const _origCheck = checkNotifications;
function checkNotificationsWithReschedule() {
  _origCheck();

  const now    = new Date();
  const dateStr = toDateStr(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  getEffectiveTasks(dateStr).forEach(t => {
    if (!t.time || t.done) return;
    const [h, m]  = t.time.split(':').map(Number);
    const taskMin = h * 60 + m;
    const diff    = taskMin - nowMin;  // negative = overdue

    // Ask to reschedule exactly once, when 15–25 min overdue
    if (diff >= -25 && diff <= -15) {
      const key = 'reschedule:' + t.id;
      if (!askedReschedule.has(key)) {
        askedReschedule.add(key);
        saveAsked();
        const realIdx = tasks.indexOf(t);
        if (realIdx !== -1) queueRescheduleDialog(realIdx, Math.abs(diff));
      }
    }
  });
}

// Replace the interval with the enhanced version
setInterval(checkNotificationsWithReschedule, 30 * 1000);

// ===== Game Engine =====
function saveGame() { localStorage.setItem('gameState_v4', JSON.stringify(game)); }

function getLevelInfo(xp) {
  let cur = LEVELS[0], next = LEVELS[1];
  for (let i = LEVELS.length-1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) { cur = LEVELS[i]; next = LEVELS[i+1]||null; break; }
  }
  return { cur, next };
}

function calcXPForTask(task) {
  let xp = XP_PER_TASK + (XP_BONUS_CAT[task.category] || 0);
  if (task.time) {
    const now = new Date();
    const [h,m] = task.time.split(':').map(Number);
    const taskMin = h*60+m, nowMin = now.getHours()*60+now.getMinutes();
    if (nowMin <= taskMin) xp += XP_BONUS_TIME; // done on time or early
  }
  return xp;
}

function updateStreak() {
  const todayStr = toDateStr(today);
  if (game.lastDoneDate === todayStr) return; // already counted today
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);
  const yesterdayStr = toDateStr(yesterday);
  if (game.lastDoneDate === yesterdayStr || game.lastDoneDate === '') {
    game.streak = (game.lastDoneDate === '') ? 1 : game.streak + 1;
  } else {
    game.streak = 1; // streak broken
  }
  game.lastDoneDate = todayStr;
}

function checkPerfectDay() {
  const todayStr = toDateStr(today);
  const todayTasks = getEffectiveTasks(todayStr);
  if (todayTasks.length > 0 && todayTasks.every(t => t.done)) {
    game.perfectDays = (game.perfectDays || 0) + 1;
  }
}

function checkAchievements() {
  const newUnlocks = [];
  ACHIEVEMENTS.forEach(a => {
    if (!game.achievements.includes(a.id) && a.check(game)) {
      game.achievements.push(a.id);
      newUnlocks.push(a);
    }
  });
  return newUnlocks;
}

function onTaskDone(task) {
  const xpGained = calcXPForTask(task);
  const oldLevel = getLevelInfo(game.xp).cur.level;
  game.xp        += xpGained;
  game.totalDone += 1;
  game.catDone[task.category] = (game.catDone[task.category]||0) + 1;
  updateStreak();
  checkPerfectDay();
  const newLevelInfo = getLevelInfo(game.xp);
  const leveledUp    = newLevelInfo.cur.level > oldLevel;
  const newUnlocks   = checkAchievements();
  // Check new theme unlocks
  const newThemes = THEMES.filter(th => th.id !== 'default' && !game.achievements.includes('theme:'+th.id) && th.unlockCond(game));
  newThemes.forEach(th => game.achievements.push('theme:'+th.id));
  saveGame();
  showCelebration({ xpGained, leveledUp, newLevel: newLevelInfo.cur, newUnlocks, newThemes });
  updateXPBar();
}

// ===== XP Bar in header =====
function renderXPBar() {
  const existing = document.getElementById('xpBarWrap');
  if (existing) existing.remove();
  const { cur, next } = getLevelInfo(game.xp);
  const pct = next ? Math.round(((game.xp - cur.minXP) / (next.minXP - cur.minXP)) * 100) : 100;
  const wrap = document.createElement('div');
  wrap.id = 'xpBarWrap';
  wrap.innerHTML = `
    <div id="xpBarInner">
      <div id="xpLevelBadge" title="Level ${cur.level}: ${cur.name}">${cur.icon} Lv.${cur.level}</div>
      <div id="xpTrack"><div id="xpFill" style="width:${pct}%"></div></div>
      <div id="xpText">${game.xp} XP</div>
      <div id="streakBadge" title="Streak ${game.streak} ngày">🔥${game.streak}</div>
    </div>
  `;
  wrap.querySelector('#xpLevelBadge').addEventListener('click', openGameModal);
  wrap.querySelector('#streakBadge').addEventListener('click', openGameModal);
  document.querySelector('.app-header').insertAdjacentElement('afterend', wrap);
}

function updateXPBar() { renderXPBar(); }

// ===== Celebration Popup =====
function showCelebration({ xpGained, leveledUp, newLevel, newUnlocks, newThemes }) {
  spawnConfetti(leveledUp ? 60 : 20);

  const popup = document.createElement('div');
  popup.id = 'celebPopup';

  let html = `<div class="celeb-xp">+${xpGained} XP ✨</div>`;
  if (leveledUp) {
    html += `<div class="celeb-level">${newLevel.icon} Lên Level ${newLevel.level}!<br><span>${newLevel.name}</span></div>`;
  }
  if (newUnlocks.length) {
    newUnlocks.forEach(a => {
      html += `<div class="celeb-badge">${a.icon} Huy hiệu: <b>${a.name}</b></div>`;
    });
  }
  if (newThemes.length) {
    newThemes.forEach(th => {
      html += `<div class="celeb-badge">${th.icon} Mở khóa theme: <b>${th.name}</b></div>`;
    });
  }
  if (game.streak > 1) {
    html += `<div class="celeb-streak">🔥 Streak ${game.streak} ngày!</div>`;
  }

  popup.innerHTML = html;
  document.body.appendChild(popup);
  setTimeout(() => { popup.classList.add('celeb-hide'); setTimeout(()=>popup.remove(), 400); }, leveledUp ? 3000 : 1800);
}

// ===== Game Modal (Profile + Themes + Achievements) =====
function openGameModal() {
  renderGameModal();
  document.getElementById('gameModal').classList.add('open');
}
function closeGameModal() {
  document.getElementById('gameModal').classList.remove('open');
}

function renderGameModal() {
  const { cur, next } = getLevelInfo(game.xp);
  const pct = next ? Math.round(((game.xp - cur.minXP)/(next.minXP - cur.minXP))*100) : 100;
  const xpToNext = next ? (next.minXP - game.xp) : 0;

  // Profile section
  document.getElementById('gm-level-icon').textContent = cur.icon;
  document.getElementById('gm-level-name').textContent = `Level ${cur.level} · ${cur.name}`;
  document.getElementById('gm-xp').textContent         = `${game.xp} XP${next ? ` · còn ${xpToNext} XP lên Lv.${next.level}` : ' · MAX'}`;
  document.getElementById('gm-streak').textContent     = game.streak;
  document.getElementById('gm-done').textContent       = game.totalDone;
  document.getElementById('gm-perfect').textContent    = game.perfectDays || 0;
  document.getElementById('gm-xpbar').style.width      = pct + '%';

  // Themes
  const themeGrid = document.getElementById('gmThemeGrid');
  themeGrid.innerHTML = '';
  THEMES.forEach(th => {
    const unlocked = th.unlockCond(game);
    const active   = game.activeTheme === th.id;
    const tile = document.createElement('div');
    tile.className = 'gm-theme-tile' + (active ? ' active' : '') + (unlocked ? '' : ' locked');
    tile.innerHTML = `
      <div class="gm-theme-icon">${th.icon}</div>
      <div class="gm-theme-name">${th.name}</div>
      <div class="gm-theme-lock">${unlocked ? (active ? '✓ Đang dùng' : 'Chọn') : th.unlock}</div>
    `;
    if (unlocked && !active) tile.addEventListener('click', () => { applyTheme(th.id); renderGameModal(); });
    themeGrid.appendChild(tile);
  });

  // Achievements
  const achGrid = document.getElementById('gmAchGrid');
  achGrid.innerHTML = '';
  ACHIEVEMENTS.forEach(a => {
    const unlocked = game.achievements.includes(a.id);
    const tile = document.createElement('div');
    tile.className = 'gm-ach-tile' + (unlocked ? '' : ' locked');
    tile.innerHTML = `
      <div class="gm-ach-icon">${a.icon}</div>
      <div class="gm-ach-name">${a.name}</div>
      <div class="gm-ach-desc">${a.desc}</div>
    `;
    achGrid.appendChild(tile);
  });
}

function applyTheme(themeId) {
  game.activeTheme = themeId;
  saveGame();
  const theme = THEMES.find(t => t.id === themeId);
  const root  = document.documentElement;
  // Reset to default first
  THEMES.forEach(t => { if (t.vars) Object.keys(t.vars).forEach(k => root.style.removeProperty(k)); });
  if (theme && theme.vars) {
    Object.entries(theme.vars).forEach(([k,v]) => root.style.setProperty(k, v));
  }
}

// Apply saved theme on load
applyTheme(game.activeTheme || 'default');

// ===== AI Sub-task System =====
// In-memory subtask state for add/edit modals
let addSubtasks  = [];   // [{id, text, done}]
let editSubtasks = [];

function makeSubtaskId() { return 'st_' + Date.now() + '_' + Math.random().toString(36).slice(2,6); }

// Call Anthropic API to generate sub-tasks
async function generateSubtasks(taskText, category) {
  const catContext = { work:'công việc văn phòng', health:'sức khỏe/thể chất', finance:'tài chính/chi tiêu' }[category] || 'công việc';
  const prompt = `Bạn là trợ lý năng suất. Nhiệm vụ: "${taskText}" (danh mục: ${catContext}).
Hãy tạo 4-6 sub-task cụ thể, thực tế để hoàn thành nhiệm vụ này.
Trả về JSON thuần (không markdown), đúng format:
{"subtasks": ["sub-task 1", "sub-task 2", "sub-task 3", "sub-task 4"]}
Sub-task phải ngắn gọn (5-8 từ), hành động rõ ràng, theo thứ tự logic.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!response.ok) throw new Error('API error ' + response.status);
  const data = await response.json();
  const raw  = data.content.map(b => b.text || '').join('').trim();
  const clean = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);
  return (parsed.subtasks || []).map(text => ({ id: makeSubtaskId(), text, done: false }));
}

// Render subtask list inside a container
function renderSubtaskList(listEl, subtasks, onChange) {
  listEl.innerHTML = '';
  subtasks.forEach((st, i) => {
    const item = document.createElement('div');
    item.className = 'subtask-item';
    item.style.animationDelay = (i * 0.05) + 's';
    item.innerHTML = `
      <div class="subtask-check ${st.done ? 'checked' : ''}" data-id="${st.id}">${st.done ? '✓' : ''}</div>
      <input class="subtask-text-input ${st.done ? 'done-text' : ''}" value="${escHtml(st.text)}" data-id="${st.id}" placeholder="Tên sub-task...">
      <button class="subtask-del-btn" data-id="${st.id}">✕</button>
    `;
    // Toggle done
    item.querySelector('.subtask-check').addEventListener('click', () => {
      st.done = !st.done;
      onChange();
    });
    // Edit text
    item.querySelector('.subtask-text-input').addEventListener('input', e => {
      st.text = e.target.value;
    });
    // Delete
    item.querySelector('.subtask-del-btn').addEventListener('click', () => {
      const idx = subtasks.indexOf(st);
      if (idx !== -1) subtasks.splice(idx, 1);
      onChange();
    });
    listEl.appendChild(item);
  });
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function addManualSubtask(subtasks, listEl, onChange) {
  subtasks.push({ id: makeSubtaskId(), text: '', done: false });
  onChange();
  // Focus last input after render
  setTimeout(() => {
    const inputs = listEl.querySelectorAll('.subtask-text-input');
    if (inputs.length) inputs[inputs.length-1].focus();
  }, 60);
}

// Wire up ADD modal AI button
async function triggerAddSubtasks() {
  const text = document.getElementById('taskInput').value.trim();
  if (!text) { document.getElementById('taskInput').focus(); return; }
  const panel   = document.getElementById('subtaskPanel');
  const loading = document.getElementById('subtaskLoading');
  const listEl  = document.getElementById('subtaskList');
  const btn     = document.getElementById('aiSubtaskBtn');

  panel.style.display = 'flex';
  loading.style.display = 'flex';
  listEl.innerHTML = '';
  btn.classList.add('loading');

  try {
    addSubtasks = await generateSubtasks(text, selectedCat);
  } catch(e) {
    addSubtasks = [
      { id: makeSubtaskId(), text: 'Chuẩn bị tài liệu', done: false },
      { id: makeSubtaskId(), text: 'Thực hiện nhiệm vụ',  done: false },
      { id: makeSubtaskId(), text: 'Kiểm tra kết quả',    done: false },
    ];
  }
  loading.style.display = 'none';
  btn.classList.remove('loading');
  renderSubtaskList(listEl, addSubtasks, () => renderSubtaskList(listEl, addSubtasks, () => {}));
}

document.getElementById('aiSubtaskBtn').addEventListener('click', triggerAddSubtasks);
document.getElementById('subtaskRegenBtn').addEventListener('click', triggerAddSubtasks);
document.getElementById('subtaskAddManualBtn').addEventListener('click', () => {
  document.getElementById('subtaskPanel').style.display = 'flex';
  addManualSubtask(addSubtasks, document.getElementById('subtaskList'),
    () => renderSubtaskList(document.getElementById('subtaskList'), addSubtasks, () => {}));
});

// Wire up EDIT modal AI button
async function triggerEditSubtasks() {
  const text  = document.getElementById('editTaskInput').value.trim();
  if (!text) { document.getElementById('editTaskInput').focus(); return; }
  const panel   = document.getElementById('editSubtaskPanel');
  const loading = document.getElementById('editSubtaskLoading');
  const listEl  = document.getElementById('editSubtaskList');
  const btn     = document.getElementById('editAiSubtaskBtn');

  panel.style.display = 'flex';
  loading.style.display = 'flex';
  listEl.innerHTML = '';
  btn.classList.add('loading');

  try {
    const generated = await generateSubtasks(text, editCat);
    // Merge: keep existing, append new ones not already present
    const existingTexts = editSubtasks.map(s => s.text.toLowerCase());
    generated.forEach(s => {
      if (!existingTexts.includes(s.text.toLowerCase())) editSubtasks.push(s);
    });
  } catch(e) {
    if (!editSubtasks.length) {
      editSubtasks = [{ id: makeSubtaskId(), text: 'Bước 1', done: false }];
    }
  }
  loading.style.display = 'none';
  btn.classList.remove('loading');
  renderSubtaskList(listEl, editSubtasks, () => renderSubtaskList(listEl, editSubtasks, () => {}));
}

document.getElementById('editAiSubtaskBtn').addEventListener('click', triggerEditSubtasks);
document.getElementById('editSubtaskRegenBtn').addEventListener('click', async () => {
  editSubtasks = [];
  await triggerEditSubtasks();
});
document.getElementById('editSubtaskAddManualBtn').addEventListener('click', () => {
  document.getElementById('editSubtaskPanel').style.display = 'flex';
  addManualSubtask(editSubtasks, document.getElementById('editSubtaskList'),
    () => renderSubtaskList(document.getElementById('editSubtaskList'), editSubtasks, () => {}));
});

// ===== Icon & Image System =====
const EMOJI_SETS = [
  { label: 'Công việc', emojis: ['💼','📋','📊','📝','💻','📞','🤝','📌','🎯','📈','🖥','✉️','📅','🏢','⚙️','🔧'] },
  { label: 'Sức khỏe', emojis: ['💪','🏃','🧘','🥗','💊','🏋️','🚴','🧠','❤️','🛌','🥤','🏊','🤸','🍎','🧴','🩺'] },
  { label: 'Chi tiêu',  emojis: ['💰','🛒','💳','🏦','🧾','💵','🎁','🛍','🏠','🚗','✈️','🍽','📱','💡','🔑','💎'] },
  { label: 'Học tập',  emojis: ['📚','✏️','🎓','🔬','📐','🗂','📖','🧮','💡','🎨','🎵','🎭','📷','🌍','🔭','🧩'] },
  { label: 'Vui vẻ',   emojis: ['🎉','🎮','🎬','🎤','⚽','🏖','🌟','🍕','🎂','🏆','🎸','🌈','🐾','🌺','🦋','🎪'] },
];

let selectedIcon     = '💼';
let selectedEditIcon = '💼';
let selectedImageB64 = null;
let selectedEditImageB64 = null;

// Build picker into a container element
function buildEmojiPicker(containerId, btnId, onSelect) {
  const container = document.getElementById(containerId);
  const btn       = document.getElementById(btnId);
  container.innerHTML = '';
  EMOJI_SETS.forEach(set => {
    const lbl = document.createElement('div');
    lbl.className = 'emoji-section-label';
    lbl.textContent = set.label;
    container.appendChild(lbl);
    const row = document.createElement('div');
    row.className = 'emoji-row';
    set.emojis.forEach(e => {
      const eb = document.createElement('button');
      eb.className = 'emoji-btn';
      eb.textContent = e;
      eb.type = 'button';
      eb.addEventListener('click', ev => {
        ev.stopPropagation();
        container.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
        eb.classList.add('selected');
        btn.textContent = e;
        onSelect(e);
        container.style.display = 'none';
      });
      row.appendChild(eb);
    });
    container.appendChild(row);
  });
}

function toggleEmojiPicker(pickerId, btnId) {
  const p = document.getElementById(pickerId);
  p.style.display = p.style.display === 'none' ? 'flex' : 'none';
}

// Setup add modal icon picker
buildEmojiPicker('emojiPicker', 'iconPickBtn', e => { selectedIcon = e; });
document.getElementById('iconPickBtn').addEventListener('click', e => {
  e.stopPropagation(); toggleEmojiPicker('emojiPicker', 'iconPickBtn');
});

// Setup edit modal icon picker
buildEmojiPicker('editEmojiPicker', 'editIconPickBtn', e => { selectedEditIcon = e; });
document.getElementById('editIconPickBtn').addEventListener('click', e => {
  e.stopPropagation(); toggleEmojiPicker('editEmojiPicker', 'editIconPickBtn');
});

// Close pickers when clicking outside
document.addEventListener('click', () => {
  document.getElementById('emojiPicker').style.display     = 'none';
  document.getElementById('editEmojiPicker').style.display = 'none';
});

// Image upload — Add modal
function setupImageUpload(inputId, previewId, placeholderId, removeBtnId, onLoad, onRemove) {
  const input      = document.getElementById(inputId);
  const preview    = document.getElementById(previewId);
  const placeholder= document.getElementById(placeholderId);
  const removeBtn  = document.getElementById(removeBtnId);

  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Ảnh tối đa 2MB nhé!'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      // Resize to max 400px wide before storing
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 400, maxH = 300;
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const b64 = canvas.toDataURL('image/jpeg', 0.7);
        preview.src = b64;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        removeBtn.style.display = 'inline-block';
        onLoad(b64);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  removeBtn.addEventListener('click', e => {
    e.preventDefault();
    input.value = '';
    preview.src = '';
    preview.style.display = 'none';
    placeholder.style.display = 'flex';
    removeBtn.style.display = 'none';
    onRemove();
  });
}

setupImageUpload('taskImageInput','imgPreview','imgUploadPlaceholder','imgRemoveBtn',
  b64 => { selectedImageB64 = b64; },
  ()  => { selectedImageB64 = null; }
);
setupImageUpload('editTaskImageInput','editImgPreview','editImgUploadPlaceholder','editImgRemoveBtn',
  b64 => { selectedEditImageB64 = b64; },
  ()  => { selectedEditImageB64 = null; }
);

// Image lightbox
function openLightbox(src) {
  const lb = document.createElement('div');
  lb.id = 'imgLightbox';
  lb.innerHTML = `<img src="${src}" alt="Task image">`;
  lb.addEventListener('click', () => lb.remove());
  document.body.appendChild(lb);
}

// ===== Undo / Action History =====
const MAX_HISTORY = 30;
let actionHistory = JSON.parse(localStorage.getItem('actionHistory_v4') || '[]');

function saveHistory() {
  localStorage.setItem('actionHistory_v4', JSON.stringify(actionHistory.slice(0, MAX_HISTORY)));
}

function pushHistory(action, label, snapshot, extra) {
  actionHistory.unshift({
    id:       Date.now(),
    action,           // 'add' | 'delete' | 'edit' | 'done' | 'undone' | 'reschedule'
    label,            // human-readable task name
    snapshot,         // full tasks array deep-copy for undo
    extra,            // optional metadata
    time:     new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    undone:   false
  });
  if (actionHistory.length > MAX_HISTORY) actionHistory.pop();
  saveHistory();
}

function snapshotTasks() {
  return JSON.parse(JSON.stringify(tasks));
}

function undoAction(histIdx) {
  const entry = actionHistory[histIdx];
  if (!entry || entry.undone) return;
  tasks = JSON.parse(JSON.stringify(entry.snapshot));
  entry.undone = true;
  save();
  saveHistory();
  renderCalendar();
  renderCountdownWidget();
  updateStats();
  if (activeDayStr) renderDayTaskList();
  showToast('↩️ Đã hoàn tác', '"' + entry.label + '"', 'early');
  renderHistoryList();
}

// Override save-mutating functions to push history
const _origSave = save;
function saveWithHistory(action, label) {
  // snapshot is taken BEFORE mutation — caller must call pushHistory(action, label, snapshot) manually
}

// Show undo toast after destructive actions
function showUndoToast(label, histIdx) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = `position:fixed;bottom:24px;right:24px;display:flex;flex-direction:column;gap:10px;z-index:9999;max-width:320px;`;
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.style.cssText = `background:var(--coral-light);border:1.5px solid var(--coral);border-radius:12px;padding:10px 14px;display:flex;align-items:center;gap:10px;animation:toastIn 0.3s ease-out;font-family:'DM Sans',sans-serif;`;
  toast.innerHTML = `
    <div style="flex:1;">
      <div style="font-size:12px;font-weight:600;color:var(--coral);">🗑 Đã xóa</div>
      <div style="font-size:12px;color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;">${label}</div>
    </div>
    <button style="background:var(--coral);color:white;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;" id="undoBtn-${histIdx}">↩ Undo</button>
  `;
  toast.querySelector(`#undoBtn-${histIdx}`).addEventListener('click', () => {
    undoAction(histIdx);
    toast.remove();
  });
  container.appendChild(toast);
  let timer = setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease-in forwards';
    setTimeout(() => toast.remove(), 300);
  }, 8000);
  toast.querySelector(`#undoBtn-${histIdx}`).addEventListener('click', () => clearTimeout(timer));
}

// History modal
function openHistoryModal() {
  renderHistoryList();
  document.getElementById('historyModal').classList.add('open');
}
function closeHistoryModal() {
  document.getElementById('historyModal').classList.remove('open');
}

function renderHistoryList() {
  const list = document.getElementById('historyList');
  list.innerHTML = '';
  if (!actionHistory.length) {
    list.innerHTML = '<div class="empty-state">Chưa có hành động nào được ghi lại.</div>';
    return;
  }
  const iconMap   = { add: '➕', delete: '🗑', edit: '✏️', done: '✅', undone: '↩️', reschedule: '📅' };
  const labelMap  = { add: 'Thêm', delete: 'Xóa', edit: 'Sửa', done: 'Hoàn thành', undone: 'Bỏ hoàn thành', reschedule: 'Dời giờ' };
  const classMap  = { add: 'add', delete: 'delete', edit: 'edit', done: 'done', undone: 'undone', reschedule: 'edit' };

  actionHistory.forEach((entry, i) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    const canUndo = !entry.undone && ['add','delete','edit','reschedule'].includes(entry.action);
    item.innerHTML = `
      <div class="history-icon ${classMap[entry.action]}">${iconMap[entry.action]}</div>
      <div class="history-info">
        <div class="history-action">${labelMap[entry.action]}${entry.undone ? ' · Đã hoàn tác' : ''}</div>
        <div class="history-text">${entry.label}</div>
      </div>
      <div class="history-time">${entry.time}</div>
      ${canUndo ? `<button class="history-undo-btn" data-idx="${i}">↩ Undo</button>` : ''}
    `;
    if (canUndo) {
      item.querySelector('.history-undo-btn').addEventListener('click', e => {
        undoAction(parseInt(e.currentTarget.dataset.idx));
        closeHistoryModal();
      });
    }
    list.appendChild(item);
  });
}

document.getElementById('openHistoryBtn').addEventListener('click', openHistoryModal);
document.getElementById('historyModalClose').addEventListener('click', closeHistoryModal);
document.getElementById('historyModal').addEventListener('click', e => {
  if (e.target === document.getElementById('historyModal')) closeHistoryModal();
});
document.getElementById('clearHistoryBtn').addEventListener('click', () => {
  actionHistory = [];
  saveHistory();
  renderHistoryList();
});

// ===== Chat Assistant =====
const CHAT_SUGGESTIONS = [
  'Hôm nay tôi có gì?',
  'Task nào sắp tới?',
  'Tuần này bao nhiêu việc?',
  'Tôi đã làm gì hôm nay?',
  'Task nào trễ nhất?',
  'Tổng kết tháng này?',
];

let chatMessages = [];

function openChatModal() {
  document.getElementById('chatModal').classList.add('open');
  if (chatMessages.length === 0) {
    addBotMessage(greetUser());
    renderSuggestions();
  }
  setTimeout(() => document.getElementById('chatInput').focus(), 200);
}
function closeChatModal() {
  document.getElementById('chatModal').classList.remove('open');
}

function greetUser() {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Chào buổi sáng' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const todayTasks = getEffectiveTasks(toDateStr(today)).filter(t => !t.done);
  if (todayTasks.length === 0) return `${greet}! 👋 Hôm nay bạn chưa có nhiệm vụ nào. Muốn thêm không?`;
  return `${greet}! 👋 Hôm nay bạn còn <b>${todayTasks.length}</b> nhiệm vụ chưa làm. Hỏi tôi bất cứ điều gì nhé!`;
}

function renderSuggestions() {
  const el = document.getElementById('chatSuggestions');
  el.innerHTML = '';
  CHAT_SUGGESTIONS.forEach(s => {
    const chip = document.createElement('button');
    chip.className = 'chat-suggestion-chip';
    chip.textContent = s;
    chip.addEventListener('click', () => {
      el.innerHTML = '';
      sendChatMessage(s);
    });
    el.appendChild(chip);
  });
}

function addUserMessage(text) {
  const el = document.getElementById('chatMessages');
  const msg = document.createElement('div');
  msg.className = 'chat-msg user';
  msg.innerHTML = `
    <div class="chat-msg-avatar">🧑</div>
    <div class="chat-bubble">${text}</div>
  `;
  el.appendChild(msg);
  el.scrollTop = el.scrollHeight;
}

function addBotMessage(html) {
  const el = document.getElementById('chatMessages');
  const msg = document.createElement('div');
  msg.className = 'chat-msg bot';
  msg.innerHTML = `
    <div class="chat-msg-avatar">✨</div>
    <div class="chat-bubble">${html}</div>
  `;
  el.appendChild(msg);
  el.scrollTop = el.scrollHeight;
}

function showTyping() {
  const el = document.getElementById('chatMessages');
  const typing = document.createElement('div');
  typing.className = 'chat-msg bot';
  typing.id = 'chatTyping';
  typing.innerHTML = `
    <div class="chat-msg-avatar">✨</div>
    <div class="chat-typing"><span></span><span></span><span></span></div>
  `;
  el.appendChild(typing);
  el.scrollTop = el.scrollHeight;
}
function hideTyping() {
  const t = document.getElementById('chatTyping');
  if (t) t.remove();
}

function formatTaskPill(t) {
  const icon = CAT_ICON[t.category];
  const time = t.time ? ` · ${t.time}` : '';
  return `<span class="task-pill${t.done?' done':''}">${icon} ${t.text}${time}</span>`;
}

function processQuery(raw) {
  const q = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

  const todayStr  = toDateStr(today);
  const todayAll  = getEffectiveTasks(todayStr);
  const todayDone = todayAll.filter(t => t.done);
  const todayPend = todayAll.filter(t => !t.done);

  const now    = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  // === Hôm nay có gì ===
  if (/(hom nay|today|ngay hom nay|co gi)/.test(q)) {
    if (todayAll.length === 0) return 'Hôm nay bạn chưa có nhiệm vụ nào cả! 🎉 Thêm một task mới nhé?';
    let r = `Hôm nay bạn có <b>${todayAll.length}</b> nhiệm vụ:<br><br>`;
    if (todayPend.length) {
      r += `<b>⏳ Chưa làm (${todayPend.length}):</b><br>`;
      todayPend.slice(0,5).forEach(t => r += formatTaskPill(t) + ' ');
      if (todayPend.length > 5) r += `<br>...và ${todayPend.length-5} task nữa`;
    }
    if (todayDone.length) {
      r += `<br><br><b>✅ Đã xong (${todayDone.length}):</b><br>`;
      todayDone.slice(0,3).forEach(t => r += formatTaskPill(t) + ' ');
    }
    return r;
  }

  // === Task sắp tới ===
  if (/(sap|upcoming|tiep theo|sap den|sap toi|gio)/.test(q)) {
    const upcoming = todayPend
      .filter(t => t.time)
      .sort((a,b) => a.time.localeCompare(b.time))
      .filter(t => { const [h,m] = t.time.split(':').map(Number); return (h*60+m) >= nowMin; });
    if (!upcoming.length) return 'Không còn task nào có giờ hôm nay nữa! Bạn làm tốt lắm 👏';
    const next = upcoming[0];
    const [h,m] = next.time.split(':').map(Number);
    const diffMin = (h*60+m) - nowMin;
    let r = `Task gần nhất là:<br>${formatTaskPill(next)}<br><br>`;
    if (diffMin <= 0) r += `⚡ <b>Đang diễn ra ngay bây giờ!</b>`;
    else if (diffMin < 60) r += `⏳ Còn <b>${diffMin} phút</b> nữa.`;
    else r += `🗓 Còn <b>${Math.floor(diffMin/60)} giờ ${diffMin%60} phút</b> nữa.`;
    if (upcoming.length > 1) {
      r += `<br><br>Tiếp theo: `;
      upcoming.slice(1,3).forEach(t => r += formatTaskPill(t) + ' ');
    }
    return r;
  }

  // === Tôi đã làm gì ===
  if (/(da lam|hoan thanh|xong|done)/.test(q)) {
    if (!todayDone.length) return 'Hôm nay bạn chưa hoàn thành task nào. Cố lên! 💪';
    let r = `Hôm nay bạn đã xong <b>${todayDone.length}</b> task:<br><br>`;
    todayDone.forEach(t => r += formatTaskPill(t) + ' ');
    const pct = todayAll.length > 0 ? Math.round(todayDone.length/todayAll.length*100) : 0;
    r += `<br><br>Tỉ lệ hoàn thành hôm nay: <b>${pct}%</b> 🔥`;
    return r;
  }

  // === Task trễ ===
  if (/(tre|qua gio|missed|chua lam|late)/.test(q)) {
    const late = todayPend.filter(t => {
      if (!t.time) return false;
      const [h,m] = t.time.split(':').map(Number);
      return (h*60+m) < nowMin;
    });
    if (!late.length) return 'Không có task nào bị trễ hôm nay! Bạn đang rất đúng giờ 🎯';
    let r = `Có <b>${late.length}</b> task đã qua giờ hôm nay:<br><br>`;
    late.forEach(t => {
      const [h,m] = t.time.split(':').map(Number);
      const mins  = nowMin - (h*60+m);
      r += formatTaskPill(t) + ` <span style="color:var(--coral);font-size:11px;">trễ ${mins} phút</span><br>`;
    });
    return r;
  }

  // === Tuần này ===
  if (/(tuan nay|tuan nay|this week|7 ngay)/.test(q)) {
    const weekTasks = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today); d.setDate(d.getDate() - d.getDay() + i);
      const ds = toDateStr(d);
      getEffectiveTasks(ds).forEach(t => { if (!weekTasks.includes(t)) weekTasks.push(t); });
    }
    const wDone = weekTasks.filter(t => t.done).length;
    const pct   = weekTasks.length > 0 ? Math.round(wDone/weekTasks.length*100) : 0;
    return `Tuần này bạn có <b>${weekTasks.length}</b> nhiệm vụ.<br>✅ Hoàn thành: <b>${wDone}</b> (${pct}%)<br>⏳ Còn lại: <b>${weekTasks.length-wDone}</b>`;
  }

  // === Tháng này ===
  if (/(thang nay|thang|month|tong ket)/.test(q)) {
    const monthKey = todayStr.slice(0,7);
    const monthTasks = tasks.filter(t => t.date && t.date.startsWith(monthKey));
    const mDone = monthTasks.filter(t => t.done).length;
    const pct   = monthTasks.length > 0 ? Math.round(mDone/monthTasks.length*100) : 0;
    const cats  = ['work','health','finance'];
    let r = `Tháng này bạn có <b>${monthTasks.length}</b> nhiệm vụ.<br>`;
    r += `✅ Hoàn thành: <b>${mDone}</b> · Tỉ lệ: <b>${pct}%</b><br><br>`;
    r += `<b>Theo danh mục:</b><br>`;
    cats.forEach(c => {
      const ct = monthTasks.filter(t => t.category === c);
      if (ct.length) r += `${CAT_ICON[c]} ${CAT_LABEL[c]}: ${ct.length} task (${ct.filter(t=>t.done).length} xong)<br>`;
    });
    return r;
  }

  // === Tổng cộng ===
  if (/(tong|all|tat ca|bao nhieu)/.test(q)) {
    const total = tasks.length;
    const done  = tasks.filter(t => t.done).length;
    const pct   = total > 0 ? Math.round(done/total*100) : 0;
    return `Tổng cộng bạn có <b>${total}</b> nhiệm vụ trong hệ thống.<br>✅ Đã xong: <b>${done}</b> (${pct}%)<br>⏳ Còn lại: <b>${total-done}</b>`;
  }

  // === Fallback ===
  const responses = [
    `Tôi chưa hiểu câu hỏi đó lắm 😅 Thử hỏi:<br>• "Hôm nay tôi có gì?"<br>• "Task nào sắp tới?"<br>• "Tôi đã làm gì hôm nay?"`,
    `Hmm, tôi chưa hiểu rõ. Bạn thử hỏi về hôm nay, tuần này, hoặc nhấn vào gợi ý bên dưới nhé!`,
  ];
  return responses[Math.floor(Math.random()*responses.length)];
}

function sendChatMessage(text) {
  const msg = (text || document.getElementById('chatInput').value).trim();
  if (!msg) return;
  document.getElementById('chatInput').value = '';
  document.getElementById('chatSuggestions').innerHTML = '';
  addUserMessage(msg);
  showTyping();
  // Simulate thinking delay (200–600ms)
  const delay = 200 + Math.random() * 400;
  setTimeout(() => {
    hideTyping();
    const reply = processQuery(msg);
    addBotMessage(reply);
  }, delay);
}

document.getElementById('openChatBtn').addEventListener('click', openChatModal);
document.getElementById('chatModalClose').addEventListener('click', closeChatModal);
document.getElementById('chatModal').addEventListener('click', e => {
  if (e.target === document.getElementById('chatModal')) closeChatModal();
});
document.getElementById('chatSendBtn').addEventListener('click', () => sendChatMessage());
document.getElementById('chatInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendChatMessage();
});

// ===== Countdown Widget =====
let countdownInterval = null;

function getTodayTimedTasks() {
  const dateStr = toDateStr(today);
  return getEffectiveTasks(dateStr)
    .filter(t => t.time && !t.done)
    .sort((a, b) => a.time.localeCompare(b.time));
}

function getTaskState(taskMin, nowMin) {
  const diff = taskMin - nowMin;
  if      (diff > 60)             return 'future';  // more than 1h away
  else if (diff > 0)              return 'soon';    // within 1h
  else if (diff >= -5)            return 'now';     // ±5 min = RIGHT NOW
  else                            return 'late';    // overdue
}

function stateLabel(state, diffSec) {
  if (state === 'now')    return '⚡ Đến giờ rồi!';
  if (state === 'soon')   return '⏳ Còn lại';
  if (state === 'late')   return '⚠️ Đã trễ';
  return '🗓 Sắp tới';
}

function formatCountdown(totalSec) {
  const sign = totalSec < 0 ? '-' : '';
  const abs  = Math.abs(totalSec);
  const h    = Math.floor(abs / 3600);
  const m    = Math.floor((abs % 3600) / 60);
  const s    = abs % 60;
  if (h > 0) {
    return sign + h + ' giờ ' + String(m).padStart(2,'0') + ' phút ' + String(s).padStart(2,'0') + ' giây';
  }
  if (m > 0) {
    return sign + m + ' phút ' + String(s).padStart(2,'0') + ' giây';
  }
  return sign + s + ' giây';
}

function renderCountdownWidget() {
  const widget = document.getElementById('countdownWidget');
  const timedTasks = getTodayTimedTasks();

  if (timedTasks.length === 0) {
    widget.style.display = 'none';
    return;
  }

  const now     = new Date();
  const nowMin  = now.getHours() * 60 + now.getMinutes();
  const nowSec  = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  // Pick the "focus" task: first non-done task within ±2h of now
  // Priority: overdue < now < upcoming
  let focus = null;

  // 1. Is there a task happening right now (within ±5 min)?
  focus = timedTasks.find(t => {
    const [h,m] = t.time.split(':').map(Number);
    const diff  = (h*60+m) - nowMin;
    return diff >= -5 && diff <= 5;
  });

  // 2. Next upcoming task today
  if (!focus) {
    focus = timedTasks.find(t => {
      const [h,m] = t.time.split(':').map(Number);
      return (h*60+m) > nowMin;
    });
  }

  // 3. Most recent overdue task (last one before now)
  if (!focus) {
    const overdue = timedTasks.filter(t => {
      const [h,m] = t.time.split(':').map(Number);
      return (h*60+m) < nowMin;
    });
    focus = overdue[overdue.length - 1] || null;
  }

  if (!focus) { widget.style.display = 'none'; return; }

  const [fh, fm] = focus.time.split(':').map(Number);
  const taskSec  = fh * 3600 + fm * 60;
  const diffSec  = taskSec - nowSec;
  const diffMin  = Math.round(diffSec / 60);
  const state    = getTaskState(fh*60+fm, nowMin);

  // Remaining tasks after focus (up to 2)
  const upcoming = timedTasks
    .filter(t => t !== focus)
    .slice(0, 2);

  // Progress for "soon" state: how far through the countdown window (60min → 0min)
  let progress = 0;
  if (state === 'soon') {
    progress = Math.round(Math.max(0, Math.min(100, ((60*60 - diffSec) / (60*60)) * 100)));
  } else if (state === 'now') {
    progress = 100;
  } else if (state === 'late') {
    progress = Math.round(Math.min(100, (Math.abs(diffSec) / (60*60)) * 100));
  }

  const icon = CAT_ICON[focus.category];
  const countdownText = state === 'now'
    ? 'Bắt đầu ngay!'
    : formatCountdown(diffSec);

  widget.style.display = 'block';
  widget.className = 'state-' + state;

  widget.innerHTML = `
    <div class="cd-wrap state-${state}">
      <div class="cd-pulse state-${state}">${icon}</div>
      <div class="cd-info">
        <div class="cd-task-name">${focus.text}</div>
        <div class="cd-time-label">${stateLabel(state, diffSec)} · ${focus.time}</div>
        <div class="cd-countdown state-${state}">${countdownText}</div>
        ${state !== 'future' ? `
          <div class="cd-progress-wrap">
            <div class="cd-progress-fill state-${state}" style="width:${progress}%"></div>
          </div>` : ''}
        ${state === 'now' ? `<div class="cd-sub state-${state}">Đang diễn ra · ${CAT_LABEL[focus.category]}</div>` : ''}
        ${state === 'late' ? `<div class="cd-sub state-${state}">Trễ ${Math.abs(diffMin)} phút · ${CAT_LABEL[focus.category]}</div>` : ''}
        ${state === 'soon' ? `<div class="cd-sub state-${state}">${CAT_LABEL[focus.category]}</div>` : ''}
        ${state === 'future' ? `<div class="cd-sub state-${state}">${CAT_LABEL[focus.category]}</div>` : ''}
      </div>
      ${upcoming.length > 0 ? `
        <div class="cd-next-list">
          ${upcoming.map(t => `<div class="cd-next-item">${t.text.slice(0,14)}${t.text.length>14?'…':''}<span>${t.time}</span></div>`).join('')}
        </div>` : ''}
    </div>
  `;
}

function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  renderCountdownWidget();
  countdownInterval = setInterval(renderCountdownWidget, 1000);
}

// ===== Timeline =====
const TL_HOUR_START  = 0;   // 0:00
const TL_HOUR_END    = 24;  // 24:00
const TL_PX_PER_HOUR_BASE = 64; // px per hour at zoom 1×
const TL_TASK_DURATION_DEFAULT = 60; // minutes default duration

let tlDate     = toDateStr(today);
let tlZoom     = 1;          // 0.75 / 1 / 1.5 / 2 / 3
let tlNowTimer = null;
let tlDragState = null;      // active drag info

const TL_ZOOMS = [0.75, 1, 1.5, 2, 3];

function tlPxPerHour() { return TL_PX_PER_HOUR_BASE * tlZoom; }
function tlTotalH()    { return (TL_HOUR_END - TL_HOUR_START) * tlPxPerHour(); }

function minToY(min)   { return (min / 60) * tlPxPerHour(); }
function yToMin(y)     { return Math.round((y / tlPxPerHour()) * 60); }
function snapMin(min)  { return Math.round(min / 15) * 15; } // snap to 15min

function minToTimeStr(min) {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
}

function openTimelineModal() {
  tlDate = toDateStr(today);
  renderTimeline();
  document.getElementById('timelineModal').classList.add('open');
  // Scroll to current time - 2 hours
  setTimeout(() => {
    const now   = new Date();
    const nowMin = now.getHours()*60 + now.getMinutes();
    const scrollTo = Math.max(0, minToY(nowMin) - 120);
    document.getElementById('tlScrollWrap').scrollTop = scrollTo;
  }, 80);
}
function closeTimelineModal() {
  document.getElementById('timelineModal').classList.remove('open');
  if (tlNowTimer) { clearInterval(tlNowTimer); tlNowTimer = null; }
}

function renderTimeline() {
  updateTlDateLabel();
  buildTlGrid();
  renderTlTasks();
  updateTlNowLine();
  if (tlNowTimer) clearInterval(tlNowTimer);
  // Update now-line every 30s when modal open
  tlNowTimer = setInterval(() => {
    if (document.getElementById('timelineModal').classList.contains('open')) {
      updateTlNowLine();
    }
  }, 30000);
}

function updateTlDateLabel() {
  const d = new Date(tlDate + 'T00:00:00');
  const todayStr = toDateStr(today);
  const prefix = tlDate === todayStr ? 'Hôm nay, ' : '';
  document.getElementById('tlDateLabel').textContent =
    prefix + DAYS_FULL_VI[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth()+1);
  document.getElementById('tlZoomLabel').textContent = tlZoom + '×';
}

function buildTlGrid() {
  const hoursCol = document.getElementById('tlHoursCol');
  const lanes    = document.getElementById('tlLanes');
  const totalH   = tlTotalH();
  const pph      = tlPxPerHour();

  hoursCol.innerHTML = '';
  hoursCol.style.height = totalH + 'px';

  // Remove old grid lines (not task blocks)
  lanes.style.height = totalH + 'px';
  lanes.querySelectorAll('.tl-hour-line, .tl-click-zone').forEach(el => el.remove());

  for (let h = TL_HOUR_START; h <= TL_HOUR_END; h++) {
    const y = (h - TL_HOUR_START) * pph;

    // Hour label
    if (h < TL_HOUR_END) {
      const lbl = document.createElement('div');
      lbl.className = 'tl-hour-label';
      lbl.style.top = y + 'px';
      lbl.textContent = String(h).padStart(2,'0') + ':00';
      hoursCol.appendChild(lbl);
    }

    // Major hour line
    const line = document.createElement('div');
    line.className = 'tl-hour-line major';
    line.style.top = y + 'px';
    lanes.appendChild(line);

    // Half-hour dashed line
    if (h < TL_HOUR_END && pph >= 48) {
      const half = document.createElement('div');
      half.className = 'tl-hour-line half';
      half.style.top = (y + pph/2) + 'px';
      lanes.appendChild(half);
    }

    // Click zone for this hour slot
    if (h < TL_HOUR_END) {
      const zone = document.createElement('div');
      zone.className = 'tl-click-zone';
      zone.style.top  = y + 'px';
      zone.style.height = pph + 'px';
      zone.dataset.hour = h;
      zone.addEventListener('click', e => {
        if (tlDragState) return;
        const rect     = zone.getBoundingClientRect();
        const relY     = e.clientY - rect.top;
        const clickMin = snapMin(h * 60 + yToMin(relY));
        addTaskAtTime(clickMin);
      });
      lanes.appendChild(zone);
    }
  }
}

function renderTlTasks() {
  // Remove old task blocks
  document.getElementById('tlLanes').querySelectorAll('.tl-task-block').forEach(el => el.remove());

  const dayTasks = getEffectiveTasks(tlDate).filter(t => t.time);
  const pph      = tlPxPerHour();
  const lanes    = document.getElementById('tlLanes');

  // Collision detection — assign column lanes
  const cols = [];
  const positioned = dayTasks.map(t => {
    const [h,m] = t.time.split(':').map(Number);
    const startMin = h*60 + m;
    const durMin   = t.duration || TL_TASK_DURATION_DEFAULT;
    const endMin   = startMin + durMin;
    return { t, startMin, endMin, durMin };
  }).sort((a,b) => a.startMin - b.startMin);

  positioned.forEach(item => {
    let col = 0;
    while (cols[col] && cols[col] > item.startMin) col++;
    item.col   = col;
    cols[col]  = item.endMin;
    item.nCols = 1; // will be updated below
  });
  // Count max overlapping cols per group
  positioned.forEach(item => {
    let maxCol = item.col;
    positioned.forEach(other => {
      if (other !== item && other.startMin < item.endMin && other.endMin > item.startMin) {
        maxCol = Math.max(maxCol, other.col);
      }
    });
    item.nCols = maxCol + 1;
  });

  positioned.forEach(({ t, startMin, endMin, durMin, col, nCols }) => {
    const realIdx = tasks.indexOf(t);
    const block = document.createElement('div');
    block.className = 'tl-task-block cat-' + t.category + (t.done ? ' done-block' : '');
    block.dataset.idx = realIdx;

    const topY  = minToY(startMin);
    const blockH = Math.max(28, (durMin / 60) * pph - 3);
    const colW   = 1 / nCols;
    const colPad = 6;
    const totalW = lanes.offsetWidth - colPad * 2;

    block.style.top    = topY + 'px';
    block.style.height = blockH + 'px';
    block.style.left   = (colPad + col * colW * totalW) + 'px';
    block.style.right  = (colPad + (nCols - col - 1) * colW * totalW) + 'px';

    const icon = t.icon || CAT_ICON[t.category];
    block.innerHTML = `
      <div style="display:flex;align-items:center;gap:4px;min-width:0;">
        <span class="tl-task-icon">${icon}</span>
        <span class="tl-task-title">${t.text}</span>
      </div>
      ${blockH > 40 ? `<div class="tl-task-time">${t.time}${durMin !== TL_TASK_DURATION_DEFAULT ? ' · ' + durMin + 'p' : ''}</div>` : ''}
      <div class="tl-resize-handle" data-idx="${realIdx}"></div>
    `;

    // Double-click → open edit modal
    block.addEventListener('dblclick', e => {
      e.stopPropagation();
      closeTimelineModal();
      setTimeout(() => openEditModal(realIdx), 50);
    });

    // Drag to reschedule
    block.addEventListener('mousedown', e => {
      if (e.target.classList.contains('tl-resize-handle')) return;
      e.preventDefault();
      startTlDrag(e, realIdx, 'move', startMin);
    });
    block.addEventListener('touchstart', e => {
      if (e.target.classList.contains('tl-resize-handle')) return;
      e.preventDefault();
      startTlDrag(e.touches[0], realIdx, 'move', startMin);
    }, { passive: false });

    // Resize handle drag
    block.querySelector('.tl-resize-handle').addEventListener('mousedown', e => {
      e.stopPropagation(); e.preventDefault();
      startTlDrag(e, realIdx, 'resize', startMin, durMin);
    });
    block.querySelector('.tl-resize-handle').addEventListener('touchstart', e => {
      e.stopPropagation(); e.preventDefault();
      startTlDrag(e.touches[0], realIdx, 'resize', startMin, durMin);
    }, { passive: false });

    lanes.appendChild(block);
  });

  updateTlNowLine();
}

function updateTlNowLine() {
  const nowLine = document.getElementById('tlNowLine');
  if (tlDate !== toDateStr(today)) { nowLine.style.display = 'none'; return; }
  const now    = new Date();
  const nowMin = now.getHours()*60 + now.getMinutes();
  const y      = minToY(nowMin);
  nowLine.style.top     = y + 'px';
  nowLine.style.display = 'block';
  // Update time label
  let dotLabel = nowLine.querySelector('.tl-now-dot-label');
  if (!dotLabel) {
    dotLabel = document.createElement('div');
    dotLabel.className = 'tl-now-dot-label';
    nowLine.appendChild(dotLabel);
  }
  dotLabel.textContent = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
}

// ===== Drag & Drop =====
function startTlDrag(e, taskIdx, mode, origStartMin, origDurMin) {
  const lanes   = document.getElementById('tlLanes');
  const block   = lanes.querySelector(`.tl-task-block[data-idx="${taskIdx}"]`);
  const lanesRect = lanes.getBoundingClientRect();
  const startY   = e.clientY;
  const startMin = origStartMin;
  const startDur = origDurMin || TL_TASK_DURATION_DEFAULT;

  block.classList.add('dragging');

  // Drop line indicator
  const dropLine = document.createElement('div');
  dropLine.className = 'tl-drop-line';
  dropLine.style.top = minToY(startMin) + 'px';
  dropLine.dataset.time = minToTimeStr(startMin);
  lanes.appendChild(dropLine);

  tlDragState = { taskIdx, mode, startY, startMin, startDur, block, dropLine, lanesRect };

  const onMove = ev => {
    const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
    const dy      = clientY - startY;
    const dMin    = yToMin(dy);

    if (mode === 'move') {
      const newStart = Math.max(0, Math.min(23*60, snapMin(startMin + dMin)));
      const newY     = minToY(newStart);
      dropLine.style.top      = newY + 'px';
      dropLine.dataset.time   = minToTimeStr(newStart);
      block.style.top         = newY + 'px';
    } else {
      const newDur = Math.max(15, snapMin(startDur + dMin));
      const newH   = Math.max(28, (newDur / 60) * tlPxPerHour() - 3);
      block.style.height      = newH + 'px';
      dropLine.style.top      = minToY(startMin + newDur) + 'px';
      dropLine.dataset.time   = minToTimeStr(startMin + newDur);
    }
  };

  const onUp = ev => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup',   onUp);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend',  onUp);

    const clientY  = ev.changedTouches ? ev.changedTouches[0].clientY : ev.clientY;
    const dy       = clientY - startY;
    const dMin     = yToMin(dy);

    block.classList.remove('dragging');
    dropLine.remove();

    const snap2 = snapshotTasks();

    if (mode === 'move') {
      const newStart = Math.max(0, Math.min(23*60, snapMin(startMin + dMin)));
      if (newStart !== startMin) {
        const newTimeStr = minToTimeStr(newStart);
        tasks[taskIdx].time = newTimeStr;
        save();
        pushHistory('reschedule', tasks[taskIdx].text, snap2, { oldTime: minToTimeStr(startMin), newTime: newTimeStr });
        showTlSnapToast('📍 Đã dời → ' + newTimeStr);
        renderCountdownWidget();
      }
    } else {
      const newDur = Math.max(15, snapMin(startDur + dMin));
      if (newDur !== startDur) {
        tasks[taskIdx].duration = newDur;
        save();
        showTlSnapToast('↔ Thời lượng: ' + newDur + ' phút');
      }
    }

    tlDragState = null;
    renderTlTasks();
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup',   onUp);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend',  onUp);
}

function showTlSnapToast(msg) {
  const toast = document.getElementById('tlSnapToast');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 2000);
}

function addTaskAtTime(startMin) {
  const timeStr = minToTimeStr(startMin);
  // Pre-fill and open add modal with this time + date
  resetAddForm(tlDate);
  document.getElementById('taskDate').value = tlDate;
  document.getElementById('taskTime').value = timeStr;
  closeTimelineModal();
  document.getElementById('taskModal').classList.add('open');
  setTimeout(() => document.getElementById('taskInput').focus(), 200);
}

// Event listeners
document.getElementById('openTimelineBtn').addEventListener('click', openTimelineModal);
document.getElementById('timelineModalClose').addEventListener('click', closeTimelineModal);
document.getElementById('timelineModal').addEventListener('click', e => {
  if (e.target === document.getElementById('timelineModal')) closeTimelineModal();
});

document.getElementById('tlPrevDay').addEventListener('click', () => {
  const d = new Date(tlDate + 'T00:00:00'); d.setDate(d.getDate()-1);
  tlDate = toDateStr(d); renderTimeline();
});
document.getElementById('tlNextDay').addEventListener('click', () => {
  const d = new Date(tlDate + 'T00:00:00'); d.setDate(d.getDate()+1);
  tlDate = toDateStr(d); renderTimeline();
});

document.getElementById('tlZoomIn').addEventListener('click', () => {
  const i = TL_ZOOMS.indexOf(tlZoom);
  if (i < TL_ZOOMS.length-1) { tlZoom = TL_ZOOMS[i+1]; renderTimeline(); }
});
document.getElementById('tlZoomOut').addEventListener('click', () => {
  const i = TL_ZOOMS.indexOf(tlZoom);
  if (i > 0) { tlZoom = TL_ZOOMS[i-1]; renderTimeline(); }
});

// Re-render timeline when tasks change (if open)
function refreshTimelineIfOpen() {
  if (document.getElementById('timelineModal').classList.contains('open')) renderTlTasks();
}

// ===== Init =====
renderCalendar();
startCountdown();
renderXPBar();

// Game modal events
document.getElementById('openGameBtn').addEventListener('click', openGameModal);
document.getElementById('gameModalClose').addEventListener('click', closeGameModal);
document.getElementById('gameModal').addEventListener('click', e => {
  if (e.target === document.getElementById('gameModal')) closeGameModal();
});
document.getElementById('gmResetBtn').addEventListener('click', () => {
  if (confirm('Reset toàn bộ XP và tiến trình game?')) {
    game = { ...DEFAULT_GAME };
    saveGame();
    applyTheme('default');
    renderXPBar();
    renderGameModal();
  }
});
document.querySelectorAll('[data-gtab]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('[data-gtab]').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#gameModal .stats-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('gtab-' + tab.dataset.gtab).classList.add('active');
  });
});