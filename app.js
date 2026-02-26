(() => {
  // ---------------- DOM helpers ----------------
  const $ = (sel, root = document) => root.querySelector(sel);

  function on(el, ev, fn) {
    if (!el) return;
    el.addEventListener(ev, fn);
  }

  // ---------------- Constants ----------------
  const STORAGE_KEY = "skilled_crm_lessons_v2";
  const UI_KEY = "skilled_crm_ui_v2";
  const CHAT_KEY = "skilled_crm_chat_v1";

  const DAY_START = 7 * 60;   // 07:00
  const DAY_END = 21 * 60;    // 21:00
  const SLOT = 60;            // labels each 30 min
  const PX_PER_HOUR = 3.2 * 16; // must match CSS: 3.2rem per hour
  const BASE_TOP_PX = 0.75 * 16;

  const STATUS_META = {
    planned: { label: "Заплановано", className: "" },
    cancelled: { label: "Скасований", className: "event--warn" },
    done: { label: "Проведено та оплачено", className: "event--accent" },
    debt: { label: "Проведено в борг", className: "event--warn" },
    missed: { label: "Пропуск", className: "event--warn" },
    free: { label: "Безкоштовний", className: "event--ok" },
  };

  // ---------------- State ----------------
  let lessons = [];
  let selectedId = null;
  let dragId = null;

  let currentDayISO = isoToday();
  let ui = {
  search: "",
  subject: "",
  teacher: "",
  role: "teacher",
  studentName: "",
  view: "day",        // month | week | day
  mode: "calendar",   // calendar | list
  listStatus: "planned", // planned | done | cancelled
};
let chats = {};      // { threadId: {id, title, members:[...], messages:[{ts, from, text}]} }
let activeChatId = null;

// демо "ви" як викладач (потім зробимо логін)
const ME = { id: "teacher_platonova", name: "Платонова Юлія" };

// демо список вчителів (ти потім відредагуєш)
const TEACHERS = [
  { id:"teacher_platonova", name:"Платонова Юлія" },
  { id:"teacher_ivan", name:"Соболєв Тарас" },
  { id:"teacher_olena", name:"Коваленко Олена" },
  { id:"teacher_andrii", name:"Шевченко Андрій" },
];


  // ---------------- DOM references ----------------
  const searchInput = $("#searchInput");
  const subjectFilter = $("#subjectFilter");
  const teacherFilter = $("#teacherFilter");
  const roleSelect = $("#roleSelect");
  const studentNameInput = $("#studentNameInput");
  const sidebar = $("#sidebar");
  const burgerBtn = $("#burgerBtn");


  const addLessonBtn = $("#addLessonBtn");
  const todayBtn = $("#todayBtn");

  const prevBtn = $("#prevBtn");
  const nextBtn = $("#nextBtn");

  const viewCalBtn = $("#viewCalBtn");
  const viewListBtn = $("#viewListBtn");

  const tabMonth = $("#tab-month");
  const tabWeek = $("#tab-week");
  const tabDay = $("#tab-day");

  const titleBig = $("#titleBig");
  const titleSub = $("#titleSub");
  const dayTitle = $("#dayTitle");
  const daySubtitle = $("#daySubtitle");

  const timeCol = $("#timeCol");
  const dayLane = $("#dayLane");

  const monthGrid = $("#monthGrid");
  const weekTimeCol = $("#weekTimeCol");
  const weekDays = $("#weekDays");

  const listTable = $("#listTable");
  const statusTabs = document.querySelectorAll(".status-tab");

  const sidebarToggle = $("#sidebarToggle");
  const appRoot = document.querySelector(".app");

  // top teacher picker
const teacherTopSelect = $("#teacherTopSelect");

// chat refs
const newChatBtn = $("#newChatBtn");
const chatMsgs = $("#chatMsgs");
const chatTitle = $("#chatTitle");
const chatSub = $("#chatSub");
const chatComposer = $("#chatComposer");
const chatInput = $("#chatInput");
const chatSendBtn = $("#chatSendBtn");

  const modal = $("#lessonModal");
  const modalTitle = $("#modalTitle");
  const saveBtn = $("#saveBtn");
  const deleteBtn = $("#deleteBtn");

  const fDate = $("#fDate");
  const fStart = $("#fStart");
  const fDur = $("#fDur");
  const fSubject = $("#fSubject");
  const fTeacher = $("#fTeacher");
  const fType = $("#fType");
  const fStatus = $("#fStatus");
  const fNote = $("#fNote");

  // multi-student
  const fIsGroup = $("#fIsGroup");
  const addStudentBtn = $("#addStudentBtn");
  const studentsWrap = $("#studentsWrap");

  // pages
const navLinks = document.querySelectorAll(".nav__item[data-page]");
const pages = document.querySelectorAll(".page");


  // ---------------- Utils ----------------
  function isoToday() {
  const d = new Date();                 // локальний час
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;            // локальний ISO
}

  function parseISODate(iso) {
    const [y,m,dd] = iso.split("-").map(Number);
    return new Date(y, m-1, dd);
  }

  function toLocalISO(d){
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

  function addDays(iso, delta) {
    const d = parseISODate(iso);
    d.setDate(d.getDate() + delta);
    return toLocalISO(d);
}

  function addMonths(iso, delta) {
    const d = parseISODate(iso);
    d.setMonth(d.getMonth() + delta);
    return toLocalISO(d);
}


  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function hhmmToMin(hhmm) {
    const [h,m] = hhmm.split(":").map(Number);
    return h*60 + m;
  }

  function minToHHMM(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  }

  function uid() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function norm(s) {
    return String(s || "").trim().toLowerCase();
  }

  function fmtMonthYear(iso) {
    const d = parseISODate(iso);
    const months = ["СІЧЕНЬ","ЛЮТИЙ","БЕРЕЗЕНЬ","КВІТЕНЬ","ТРАВЕНЬ","ЧЕРВЕНЬ","ЛИПЕНЬ","СЕРПЕНЬ","ВЕРЕСЕНЬ","ЖОВТЕНЬ","ЛИСТОПАД","ГРУДЕНЬ"];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  function fmtDayHeader(iso) {
    const d = parseISODate(iso);
    const days = ["неділя","понеділок","вівторок","середа","четвер","п’ятниця","субота"];
    const months = ["січня","лютого","березня","квітня","травня","червня","липня","серпня","вересня","жовтня","листопада","грудня"];
    return {
      title: `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} р.`,
      sub: days[d.getDay()],
    };
  }

  // ---------------- Storage ----------------
  function saveStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
    localStorage.setItem(UI_KEY, JSON.stringify({ currentDayISO, ui }));
    localStorage.setItem(CHAT_KEY, JSON.stringify({ chats, activeChatId }));
  }

  function loadStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      lessons = raw ? JSON.parse(raw) : seedLessons();
    } catch {
      lessons = seedLessons();
    }

    try {
      const rawUI = localStorage.getItem(UI_KEY);
      if (rawUI) {
        const parsed = JSON.parse(rawUI);
        currentDayISO = parsed.currentDayISO || currentDayISO;
        ui = { ...ui, ...(parsed.ui || {}) };
      }
    } catch {}
    try{
  const rawChat = localStorage.getItem(CHAT_KEY);
  if (rawChat){
    const parsed = JSON.parse(rawChat);
    chats = parsed.chats || {};
    activeChatId = parsed.activeChatId || null;
  } else {
    chats = {};
    activeChatId = null;
  }
} catch {
  chats = {};
  activeChatId = null;
}
  }

  function renderTopTeacherSelect(){
  if (!teacherTopSelect) return;

  teacherTopSelect.innerHTML = `<option value="">Усі викладачі</option>`;
  for (const t of TEACHERS){
    const opt = document.createElement("option");
    opt.value = t.name;
    opt.textContent = t.name;
    teacherTopSelect.appendChild(opt);
  }

  teacherTopSelect.value = ui.teacher || "";
}

  // ---------------- Data model ----------------
  function mkLesson({ date, start, dur, subject, students, teacher, type, status, note }) {
    return {
      id: uid(),
      date,
      start,
      dur: Number(dur) || 50,
      subject: subject || "Урок",
      students: Array.isArray(students) ? students.filter(Boolean) : [],
      teacher: teacher || "",
      type: type || "Індивідуальний",
      status: status || "planned",
      note: note || "",
    };
  }

  function seedLessons() {
    const t = isoToday();
    return [
      mkLesson({ date: t, start: "16:00", dur: 50, subject: "ШІ з використанням Python", students:["Головко Нікіта"], teacher: "Платонова Юлія", type:"Індивідуальний", status:"planned" }),
      mkLesson({ date: t, start: "18:00", dur: 50, subject: "Англійська Basic", students:["Лук’янчук Міша"], teacher: "Платонова Юлія", type:"Індивідуальний", status:"planned" }),
      mkLesson({ date: t, start: "19:00", dur: 50, subject: "Основи ШІ", students:["Фощан Гліб"], teacher: "Платонова Юлія", type:"Індивідуальний", status:"debt", note:"14 років" }),
    ];
  }

  // ---------------- Filters ----------------
  function matchesFilters(lesson) {
    const q = norm(ui.search);
    if (q) {
      const hay = norm([
        lesson.subject,
        lesson.teacher,
        lesson.type,
        lesson.note,
        ...(lesson.students || [])
      ].join(" "));
      if (!hay.includes(q)) return false;
    }

    if (ui.subject && lesson.subject !== ui.subject) return false;
    if (ui.teacher && lesson.teacher !== ui.teacher) return false;

    if (ui.role === "student") {
      const s = norm(ui.studentName);
      if (!s) return false;
      const found = (lesson.students || []).some(st => norm(st).includes(s));
      if (!found) return false;
    }

    return true;
  }

  function lessonsForDay(iso) {
    return lessons
      .filter(l => l.date === iso)
      .filter(matchesFilters)
      .slice()
      .sort((a,b) => hhmmToMin(a.start) - hhmmToMin(b.start));
  }

  // ---------------- Render helpers ----------------
  function eventClass(status) {
    return (STATUS_META[status]?.className || "");
  }

  function metaLine(lesson) {
    const st = lesson.students || [];
    const main = st[0] || "—";
    const more = st.length > 1 ? ` +${st.length - 1}` : "";
    const note = lesson.note ? ` • ${lesson.note}` : "";
    return `${main}${more} • ${lesson.teacher}${note}`;
  }

  function calcTopPx(startMin) {
    const rel = startMin - DAY_START;
    return (rel / 60) * PX_PER_HOUR + BASE_TOP_PX;
  }

  function calcHeightPx(durMin) {
    return Math.max((durMin / 60) * PX_PER_HOUR, 34);
  }

  // ---------------- UI: time column ----------------
  function renderTimeCol() {
    if (!timeCol) return;
    timeCol.innerHTML = "";
    for (let m = DAY_START; m <= DAY_END; m += SLOT) {
      const div = document.createElement("div");
      div.className = "day__time";
      div.textContent = minToHHMM(m);
      timeCol.appendChild(div);
    }
  }

  // ---------------- UI: titles ----------------
  function renderTitles() {
    if (titleBig) titleBig.textContent = fmtMonthYear(currentDayISO);

    // just a helpful line:
    if (titleSub) titleSub.textContent = `(поточний день: ${currentDayISO})`;

    const { title, sub } = fmtDayHeader(currentDayISO);
    if (dayTitle) dayTitle.textContent = title;
    if (daySubtitle) daySubtitle.textContent = sub;
  }

  // ---------------- UI: filters ----------------
  function renderFiltersOptions() {
    if (!subjectFilter || !teacherFilter) return;

    const subjects = Array.from(new Set(lessons.map(l => l.subject))).sort((a,b)=>a.localeCompare(b,"uk"));
    const teachers = Array.from(new Set(lessons.map(l => l.teacher).filter(Boolean))).sort((a,b)=>a.localeCompare(b,"uk"));

    subjectFilter.innerHTML = "";
    teacherFilter.innerHTML = "";

    const opt0s = document.createElement("option");
    opt0s.value = "";
    opt0s.textContent = "Усі предмети";
    subjectFilter.appendChild(opt0s);

    for (const s of subjects) {
      const opt = document.createElement("option");
      opt.value = s;          // <-- ВАЖЛИВО: value = реальний рядок, без escape
      opt.textContent = s;
      subjectFilter.appendChild(opt);
    }

    const opt0t = document.createElement("option");
    opt0t.value = "";
    opt0t.textContent = "Усі викладачі";
    teacherFilter.appendChild(opt0t);

    for (const t of teachers) {
      const opt = document.createElement("option");
      opt.value = t;          // <-- value = реальний рядок
      opt.textContent = t;
      teacherFilter.appendChild(opt);
    }

    subjectFilter.value = ui.subject || "";
    teacherFilter.value = ui.teacher || "";
  }

  function applyUIToControls() {
    if (searchInput) searchInput.value = ui.search || "";
    if (roleSelect) roleSelect.value = ui.role || "teacher";

    if (studentNameInput) {
      if (ui.role === "student") {
        studentNameInput.style.display = "inline-block";
        studentNameInput.value = ui.studentName || "";
      } else {
        studentNameInput.style.display = "none";
        studentNameInput.value = "";
      }
    }
  // якщо list mode — показуємо panel--list (нижче буде логіка в setViewMode)

    // set active tab by ui.view
    if (ui.view === "month" && tabMonth) tabMonth.checked = true;
    if (ui.view === "week" && tabWeek) tabWeek.checked = true;
    if (ui.view === "day" && tabDay) tabDay.checked = true;
  }

  // ---------------- UI: Day render ----------------
  function renderDay() {
    if (!dayLane) return;
    dayLane.innerHTML = "";

    const list = lessonsForDay(currentDayISO);

    if (list.length === 0) {
      const empty = document.createElement("div");
      empty.className = "week__empty";
      empty.textContent =
        (ui.role === "student" && !ui.studentName)
          ? "Введи ім’я учня справа, щоб показати його уроки 🙂"
          : "Немає уроків. Натисни ➕ Урок, щоб додати.";
      dayLane.appendChild(empty);
      return;
    }

    for (const lesson of list) {
      const startMin = hhmmToMin(lesson.start);
      const top = calcTopPx(startMin);
      const height = calcHeightPx(lesson.dur);

      const el = document.createElement("div");
      el.className = `event event--block ${eventClass(lesson.status)}`.trim();
      el.style.top = `${top}px`;
      el.style.height = `${height}px`;
      el.draggable = true;
      el.dataset.id = lesson.id;

      el.innerHTML = `
        <div class="event__time">${lesson.start} – ${minToHHMM(startMin + lesson.dur)}</div>
        <div class="event__title">${lesson.subject}</div>
        <div class="event__meta">${metaLine(lesson)}</div>
      `;

      on(el, "click", () => openModalFor(lesson.id));
      on(el, "dragstart", onDragStart);

      dayLane.appendChild(el);
    }
  }

  function renderMonth(){
  if (!monthGrid) return;
  monthGrid.innerHTML = "";

  const d = parseISODate(currentDayISO);
  const year = d.getFullYear();
  const month = d.getMonth();

  // head (пн..нд)
  const heads = ["пн","вт","ср","чт","пт","сб","нд"];
  for (const h of heads){
    const hd = document.createElement("div");
    hd.className = "month-grid__head";
    hd.textContent = h;
    monthGrid.appendChild(hd);
  }

  // перший день місяця
  const first = new Date(year, month, 1);
  // JS: 0=нд..6=сб -> робимо 0=пн..6=нд
  const firstDow = (first.getDay() + 6) % 7;

  // скільки днів у місяці
  const daysInMonth = new Date(year, month+1, 0).getDate();

  // починаємо з дати, яка попадає в першу клітинку календаря
  const startDate = new Date(year, month, 1 - firstDow);

  // 6 тижнів * 7 днів = 42 клітинки
  for (let i=0; i<42; i++){
    const cellDate = new Date(startDate);
    cellDate.setDate(startDate.getDate() + i);
    const iso = toLocalISO(cellDate);

    const cell = document.createElement("div");
    cell.className = "day-cell" + (cellDate.getMonth() !== month ? " is-muted" : "");

    const top = document.createElement("div");
    top.className = "day-cell__top";

    const num = document.createElement("div");
    num.className = "day-cell__num";
    num.textContent = cellDate.getDate();

    top.appendChild(num);
    cell.appendChild(top);

    const dayLessons = lessons
      .filter(l => l.date === iso)
      .filter(matchesFilters)
      .sort((a,b)=>hhmmToMin(a.start)-hhmmToMin(b.start));

    if (dayLessons.length === 0){
      const empty = document.createElement("div");
      empty.className = "day-cell__empty";
      empty.textContent = "";
      cell.appendChild(empty);
    } else {
      const show = dayLessons.slice(0,3);
      for (const l of show){
        const ev = document.createElement("div");
        ev.className = `event ${eventClass(l.status)}`.trim();
        ev.style.position = "relative";
        ev.style.left = "0";
        ev.style.right = "0";
        ev.innerHTML = `
          <div class="event__time">${l.start}</div>
          <div class="event__title">${l.subject}</div>
          <div class="event__meta">${metaLine(l)}</div>
        `;
        on(ev, "click", () => openModalFor(l.id));
        cell.appendChild(ev);
      }

      if (dayLessons.length > 3){
        const more = document.createElement("div");
        more.className = "day-cell__more";
        more.textContent = `+${dayLessons.length - 3} (показати день)`;
        on(more, "click", () => {
          ui.view = "day";
          ui.mode = "calendar";
          currentDayISO = iso;
          saveStorage();
          rerenderAll();
        });
        cell.appendChild(more);
      }
    }

    // клік по клітинці -> відкриваємо день
    on(cell, "dblclick", () => {
      ui.view = "day";
      ui.mode = "calendar";
      currentDayISO = iso;
      saveStorage();
      rerenderAll();
    });

    monthGrid.appendChild(cell);
  }
}

function renderWeekTime(){
  if (!weekTimeCol) return;
  weekTimeCol.innerHTML = "";
  // такий самий таймлайн як day, тільки week css
  for (let m = DAY_START; m <= DAY_END; m += SLOT) {
    const div = document.createElement("div");
    div.className = "week__time";
    div.textContent = minToHHMM(m);
    weekTimeCol.appendChild(div);
  }
}

function startOfWeekISO(iso){
  const d = parseISODate(iso);
  const dow = (d.getDay() + 6) % 7; // 0=пн
  d.setDate(d.getDate() - dow);
  return toLocalISO(d);
}

function renderWeek(){
  if (!weekDays) return;
  weekDays.innerHTML = "";
  renderWeekTime();

  const startISO = startOfWeekISO(currentDayISO);
  const start = parseISODate(startISO);

  for (let i=0; i<7; i++){
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + i);
    const iso = toLocalISO(dayDate);

    const col = document.createElement("div");
    col.className = "week__day";

    const head = document.createElement("div");
    head.className = "week__dayhead";
    head.textContent = `${String(dayDate.getDate()).padStart(2,"0")}.${String(dayDate.getMonth()+1).padStart(2,"0")}`;
    col.appendChild(head);

    const dayLessons = lessons
      .filter(l => l.date === iso)
      .filter(matchesFilters)
      .sort((a,b)=>hhmmToMin(a.start)-hhmmToMin(b.start));

    for (const l of dayLessons){
      const startMin = hhmmToMin(l.start);
      const top = calcTopPx(startMin);
      const height = calcHeightPx(l.dur);

      const el = document.createElement("div");
      el.className = `event event--block ${eventClass(l.status)}`.trim();
      el.style.top = `${top}px`;
      el.style.height = `${height}px`;
      el.style.left = "8px";
      el.style.right = "8px";
      el.dataset.id = l.id;

      el.innerHTML = `
        <div class="event__time">${l.start}</div>
        <div class="event__title">${l.subject}</div>
        <div class="event__meta">${metaLine(l)}</div>
      `;
      on(el, "click", () => openModalFor(l.id));
      col.appendChild(el);
    }

    // dblclick -> перейти в day цього дня
    on(col, "dblclick", () => {
      ui.view = "day";
      ui.mode = "calendar";
      currentDayISO = iso;
      saveStorage();
      rerenderAll();
    });

    weekDays.appendChild(col);
  }
}

function statusToLabelKey(status){
  // щоб у списку можна було мати "Скасований"
  if (status === "cancelled") return "cancelled";
  if (status === "done") return "done";
  return "planned";
}

function renderList(){
  if (!listTable) return;
  listTable.innerHTML = "";

  // шапка
  const header = document.createElement("div");
  header.className = "list-row list-h";
  header.innerHTML = `<div>Дата/час</div><div>Учень/тема</div><div>Предмет</div>`;
  listTable.appendChild(header);

  // збираємо уроки за період (day/week/month)
  const v = ui.view;
  let fromISO = currentDayISO;
  let toISO = currentDayISO;

  if (v === "week"){
    fromISO = startOfWeekISO(currentDayISO);
    const fromD = parseISODate(fromISO);
    const toD = new Date(fromD); toD.setDate(fromD.getDate()+6);
    toISO = toLocalISO(toD);
  } else if (v === "month"){
    const d = parseISODate(currentDayISO);
    const y = d.getFullYear(), m = d.getMonth();
    fromISO = toLocalISO(new Date(y,m,1));
    toISO = toLocalISO(new Date(y,m+1,0));
  }

  const fromD = parseISODate(fromISO);
  const toD = parseISODate(toISO);

  const list = lessons
    .filter(matchesFilters)
    .filter(l => {
      const ld = parseISODate(l.date);
      return ld >= fromD && ld <= toD;
    })
    .filter(l => statusToLabelKey(l.status) === ui.listStatus)
    .sort((a,b)=>{
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return hhmmToMin(a.start) - hhmmToMin(b.start);
    });

  if (list.length === 0){
    const empty = document.createElement("div");
    empty.className = "week__empty";
    empty.textContent = "Нічого не знайдено в цьому періоді 🙂";
    listTable.appendChild(empty);
    return;
  }

  for (const l of list){
    const row = document.createElement("div");
    row.className = "list-row";
    const students = (l.students || []);
    const sLine = students.length ? students.join(", ") : "—";

    row.innerHTML = `
      <div><b>${l.date}</b><div class="muted">${l.start} • ${l.dur} хв</div></div>
      <div><b>${sLine}</b><div class="muted">${l.teacher}</div></div>
      <div><b>${l.subject}</b><div class="muted">${l.type}</div></div>
    `;
    on(row, "click", () => openModalFor(l.id));
    listTable.appendChild(row);
  }
}

 // Functions render ALL
  function setActiveIcons(){
  if (viewCalBtn) viewCalBtn.classList.toggle("is-active", ui.mode === "calendar");
  if (viewListBtn) viewListBtn.classList.toggle("is-active", ui.mode === "list");
}

function rerenderAll() {
  renderTitles();
  renderFiltersOptions();
  renderTopTeacherSelect();
  applyUIToControls();
  setActiveIcons();
  

  // календарні види
  if (ui.mode === "calendar"){
    renderTimeCol();

    if (ui.view === "day") renderDay();
    if (ui.view === "week") renderWeek();
    if (ui.view === "month") renderMonth();
  }

  // список
  if (ui.mode === "list"){
    renderList();
  }
}


  // ---------------- Modal: multi-students ----------------
  function showModal(show) {
    if (!modal) return;
    modal.setAttribute("aria-hidden", show ? "false" : "true");
    modal.classList.toggle("is-open", show);
  }

  function studentsGetFromUI() {
    if (!studentsWrap) return [];
    return Array.from(studentsWrap.querySelectorAll("input[data-student]"))
      .map(i => i.value.trim())
      .filter(Boolean);
  }

  function studentsSetUI(list) {
    if (!studentsWrap) return;
    studentsWrap.innerHTML = "";
    const arr = (list && list.length) ? list : [""];

    for (const name of arr) {
      addStudentInput(name);
    }
  }

  function addStudentInput(value = "") {
    if (!studentsWrap) return;

    const row = document.createElement("div");
    row.className = "students-row";

    const inp = document.createElement("input");
    inp.dataset.student = "1";
    inp.placeholder = "ПІБ учня";
    inp.value = value;
    inp.style.flex = "1";
    inp.style.border = "1px solid var(--line)";
    inp.style.borderRadius = "12px";
    inp.style.padding = "10px 12px";
    inp.style.fontWeight = "700";

    const del = document.createElement("button");
    del.type = "button";
    del.className = "btn btn-ghost btn-sm";
    del.textContent = "−";
    del.title = "Прибрати учня";

    on(del, "click", () => {
      row.remove();
      // не даємо лишитись зовсім без інпутів
      if (studentsWrap.querySelectorAll("input[data-student]").length === 0) {
        addStudentInput("");
      }
    });

    row.appendChild(inp);
    row.appendChild(del);
    studentsWrap.appendChild(row);
  }

  function openModalFor(id) {
    const l = lessons.find(x => x.id === id);
    if (!l) return;

    selectedId = id;

    if (modalTitle) modalTitle.textContent = `Урок • ${l.subject}`;
    if (fDate) fDate.value = l.date;
    if (fStart) fStart.value = l.start;
    if (fDur) fDur.value = l.dur;

    if (fSubject) fSubject.value = l.subject;
    if (fTeacher) fTeacher.value = l.teacher;
    if (fType) fType.value = l.type;
    if (fStatus) fStatus.value = l.status;
    if (fNote) fNote.value = l.note || "";

    if (fIsGroup) fIsGroup.checked = (l.students || []).length > 1 || l.type === "Груповий";

    studentsSetUI(l.students || [""]);

    if (deleteBtn) deleteBtn.style.display = "inline-block";
    showModal(true);
  }

  function openModalNew() {
    selectedId = null;

    if (modalTitle) modalTitle.textContent = "Новий урок";
    if (fDate) fDate.value = currentDayISO;
    if (fStart) fStart.value = "16:00";
    if (fDur) fDur.value = 50;

    if (fSubject) fSubject.value = "";
    if (fTeacher) fTeacher.value = "Платонова Юлія";
    if (fType) fType.value = "Індивідуальний";
    if (fStatus) fStatus.value = "planned";
    if (fNote) fNote.value = "";

    if (fIsGroup) fIsGroup.checked = false;
    studentsSetUI([""]);

    if (deleteBtn) deleteBtn.style.display = "none";
    showModal(true);
  }

  function closeModal() { showModal(false); }

  function upsertFromForm() {
    const date = fDate?.value || currentDayISO;
    const start = fStart?.value || "16:00";
    const dur = clamp(Number(fDur?.value || 50), 10, 240);

    const subject = (fSubject?.value || "").trim() || "Урок";
    const teacher = (fTeacher?.value || "").trim();
    const status = fStatus?.value || "planned";
    const note = (fNote?.value || "").trim();

    const students = studentsGetFromUI();
    if (!students.length) {
      alert("Додай хоча б одного учня 🙂");
      return;
    }
    if (!teacher) {
      alert("Вкажи викладача 🙂");
      return;
    }

    const isGroup = !!fIsGroup?.checked;
    const type = isGroup ? "Груповий" : (fType?.value || "Індивідуальний");

    if (selectedId) {
      const idx = lessons.findIndex(x => x.id === selectedId);
      if (idx >= 0) {
        lessons[idx] = { ...lessons[idx], date, start, dur, subject, students, teacher, type, status, note };
      }
    } else {
      lessons.push(mkLesson({ date, start, dur, subject, students, teacher, type, status, note }));
    }

    saveStorage();
    rerenderAll();
    closeModal();
  }

  function deleteSelected() {
    if (!selectedId) return;
    const l = lessons.find(x => x.id === selectedId);
    if (!l) return;

    const ok = confirm(`Видалити урок "${l.subject}"?`);
    if (!ok) return;

    lessons = lessons.filter(x => x.id !== selectedId);
    selectedId = null;
    saveStorage();
    rerenderAll();
    closeModal();
  }

  // ---------------- Drag & drop ----------------
  function onDragStart(e) {
    dragId = e.currentTarget?.dataset?.id || null;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", dragId || "");
  }

  function onLaneDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onLaneDrop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    if (!id) return;

    const lesson = lessons.find(x => x.id === id);
    if (!lesson) return;

    const rect = dayLane.getBoundingClientRect();
    const y = e.clientY - rect.top;

    let relMin = Math.round((y - BASE_TOP_PX) / PX_PER_HOUR * 60);

    // snap 10 min
    relMin = Math.round(relMin / 10) * 10;

    const newStartMin = clamp(DAY_START + relMin, DAY_START, DAY_END - lesson.dur);
    lesson.start = minToHHMM(newStartMin);
    lesson.date = currentDayISO;

    saveStorage();
    rerenderAll();
  }

  // ---------------- View switching + navigation ----------------
  function setView(v) {
    ui.view = v;
    if (v === "month" && tabMonth) tabMonth.checked = true;
    if (v === "week" && tabWeek) tabWeek.checked = true;
    if (v === "day" && tabDay) tabDay.checked = true;
    saveStorage();
  }

  function setMode(m){
  ui.mode = m; // calendar | list

  // показ панелей через radio: використовуємо існуючі таби для period
  // а list panel покажемо окремо: через клас на body/app не треба — зробимо через CSS+JS простіше:
  const listPanel = document.querySelector(".panel--list");
  const monthPanel = document.querySelector(".panel--month");
  const weekPanel = document.querySelector(".panel--week");
  const dayPanel = document.querySelector(".panel--day");

  if (m === "list"){
    if (listPanel) listPanel.style.display = "block";
    if (monthPanel) monthPanel.style.display = "none";
    if (weekPanel) weekPanel.style.display = "none";
    if (dayPanel) dayPanel.style.display = "none";
  } else {
    if (listPanel) listPanel.style.display = "none";
    // повертаємо керування radio tabs:
    if (monthPanel) monthPanel.style.display = "";
    if (weekPanel) weekPanel.style.display = "";
    if (dayPanel) dayPanel.style.display = "";
  }

  saveStorage();
}

  function getActiveView() {
    if (tabMonth?.checked) return "month";
    if (tabWeek?.checked) return "week";
    return "day";
  }

  function navDelta(sign) {
    const v = getActiveView();
    if (v === "day") currentDayISO = addDays(currentDayISO, sign * 1);
    else if (v === "week") currentDayISO = addDays(currentDayISO, sign * 7);
    else currentDayISO = addMonths(currentDayISO, sign * 1);

    saveStorage();
    rerenderAll();
  }

  function openPage(pageId) {
  pages.forEach(p => p.classList.remove("is-active"));
  const target = document.getElementById(pageId);
  if (target) target.classList.add("is-active");

  // active menu highlight
  document.querySelectorAll(".nav__item").forEach(a => a.classList.remove("active"));
  document.querySelectorAll(`.nav__item[data-page="${pageId}"]`).forEach(a => a.classList.add("active"));

  // якщо відкрили уроки — перемальовуємо календар (на всяк)
  if (pageId === "page-lessons") rerenderAll();
}

  // ---------------- Wire events ----------------
  function wireEvents() {
    navLinks.forEach(a => {
  on(a, "click", (e) => {
    e.preventDefault();
    openPage(a.dataset.page);
  });
});
    on(sidebarToggle, "click", () => {
    if (!appRoot) return;
      appRoot.classList.toggle("sidebar-collapsed");
    });
    on(addLessonBtn, "click", openModalNew);
    on(burgerBtn, "click", () => {
    sidebar?.classList.toggle("is-hidden");
    });
    on(todayBtn, "click", () => {
      currentDayISO = isoToday();
      saveStorage();
      rerenderAll();
    });

    on(prevBtn, "click", () => navDelta(-1));
    on(nextBtn, "click", () => navDelta(+1));

    // chat
on(newChatBtn, "click", openNewChatFlow);
on(chatSendBtn, "click", sendChatMessage);
on(chatInput, "keydown", (e) => {
  if (e.key === "Enter") sendChatMessage();
});

    // view icons
      on(viewCalBtn, "click", () => {
      setMode("calendar");
      ui.mode = "calendar";
      saveStorage();
      rerenderAll();
    });

    on(viewListBtn, "click", () => {
      setMode("list");
      ui.mode = "list";
      saveStorage();
      rerenderAll();
    });

    on(teacherTopSelect, "change", () => {
  ui.teacher = teacherTopSelect.value;
  saveStorage();
  rerenderAll();
});

function chatThreadTitleByMembers(memberIds){
  const names = memberIds
    .map(id => TEACHERS.find(t=>t.id===id)?.name || id)
    .filter(n => n !== ME.name);
  return names.length ? names.join(", ") : "Чат";
}

function ensureDemoChats(){
  // якщо нема жодного — створимо 1 демо
  if (Object.keys(chats).length) return;

  const id = "chat_demo";
  chats[id] = {
    id,
    members: [ME.id, "teacher_olena"],
    title: "Коваленко Олена",
    messages: [
      { ts: Date.now()-3600_000, from:"teacher_olena", text:"Привіт! Ти сьогодні вільна на 18:00?" },
      { ts: Date.now()-3500_000, from:ME.id, text:"Так, можу 🙂" },
    ]
  };
  activeChatId = id;
}

function renderChatContacts(){
  const wrap = document.querySelector(".chat__contacts");
  if (!wrap) return;

  // показуємо тільки чати, де є я
  const threads = Object.values(chats)
    .filter(t => t.members.includes(ME.id))
    .sort((a,b) => (b.messages?.at(-1)?.ts||0) - (a.messages?.at(-1)?.ts||0));

  wrap.innerHTML = "";

  for (const t of threads){
    const btn = document.createElement("button");
    btn.className = "chat__contact" + (t.id === activeChatId ? " is-active" : "");
    btn.type = "button";

    btn.innerHTML = `
      <div class="chat__ava">🙂</div>
      <div>
        <div class="chat__name">${t.title || "Чат"}</div>
        <div class="chat__hint muted">${t.id === activeChatId ? "Відкрито" : "Натисніть, щоб відкрити"}</div>
      </div>
    `;

    on(btn, "click", () => {
      activeChatId = t.id;
      saveStorage();
      renderChatContacts();
      renderChatRoom();
    });

    wrap.appendChild(btn);
  }

  // якщо нема чатів
  if (!threads.length){
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.style.padding = "10px 12px";
    empty.textContent = "Чатів поки нема. Натисни “+ Новий чат”.";
    wrap.appendChild(empty);
  }
}

function renderChatRoom(){
  if (!chatMsgs) return;

  const t = chats[activeChatId];

  if (!t){
    chatMsgs.innerHTML = `<div class="chat__empty muted">Оберіть чат зліва або створіть новий 🙂</div>`;
    if (chatComposer) chatComposer.style.display = "none";
    if (chatTitle) chatTitle.textContent = "Чат";
    if (chatSub) chatSub.textContent = "—";
    return;
  }

  if (chatComposer) chatComposer.style.display = "flex";
  if (chatTitle) chatTitle.textContent = t.title || "Чат";
  if (chatSub) chatSub.textContent = "Викладачі";

  chatMsgs.innerHTML = "";

  for (const m of (t.messages || [])){
    const div = document.createElement("div");
    const isMe = m.from === ME.id;
    div.className = "msg" + (isMe ? " msg--me" : "");
    const fromName = TEACHERS.find(x=>x.id===m.from)?.name || "—";
    const when = new Date(m.ts).toLocaleString("uk-UA", { hour:"2-digit", minute:"2-digit" });

    div.innerHTML = `
      <div>${escapeHtml(m.text)}</div>
      <div class="msg__meta">${isMe ? "Ви" : fromName} • ${when}</div>
    `;
    chatMsgs.appendChild(div);
  }

  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

function escapeHtml(s){
  return String(s||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function createChatWith(teacherId){
  const members = [ME.id, teacherId].sort();
  // не створювати дублікати
  const existing = Object.values(chats).find(t => {
    const ms = (t.members||[]).slice().sort();
    return JSON.stringify(ms) === JSON.stringify(members);
  });
  if (existing){
    activeChatId = existing.id;
    return;
  }

  const id = "chat_" + uid();
  chats[id] = {
    id,
    members,
    title: chatThreadTitleByMembers(members),
    messages: [
      { ts: Date.now(), from: ME.id, text: "Привіт! 👋" }
    ]
  };
  activeChatId = id;
}

function openNewChatFlow(){
  // простий prompt-варіант (без модалок, щоб не ламати)
  const options = TEACHERS.filter(t=>t.id!==ME.id).map(t=>t.name).join("\n");
  const picked = prompt("З ким створити чат? Введіть ім’я як у списку:\n\n" + options);
  if (!picked) return;

  const t = TEACHERS.find(x => x.name.toLowerCase() === picked.trim().toLowerCase());
  if (!t) {
    alert("Не знайшла такого викладача. Спробуй ще раз 🙂");
    return;
  }

  createChatWith(t.id);
  saveStorage();
  renderChatContacts();
  renderChatRoom();
}

function sendChatMessage(){
  const t = chats[activeChatId];
  if (!t) return;
  const text = (chatInput?.value || "").trim();
  if (!text) return;

  t.messages = t.messages || [];
  t.messages.push({ ts: Date.now(), from: ME.id, text });
  if (chatInput) chatInput.value = "";

  saveStorage();
  renderChatContacts();
  renderChatRoom();
}

    // tabs clicks (labels are handled by HTML, but we sync ui.view)
    on(tabMonth, "change", () => { if (tabMonth.checked) setView("month"); });
    on(tabWeek, "change", () => { if (tabWeek.checked) setView("week"); });
    on(tabDay, "change", () => { if (tabDay.checked) setView("day"); });

    // modal controls
    on(saveBtn, "click", upsertFromForm);
    on(deleteBtn, "click", deleteSelected);

    on(modal, "click", (e) => {
      if (e.target?.dataset?.close === "1") closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    // multi-student
    on(addStudentBtn, "click", () => addStudentInput(""));
    on(fIsGroup, "change", () => {
      // якщо група — просто лишаємо inputs як є
      // якщо не група — залишаємо лише 1 учня
      if (!fIsGroup.checked) {
        const list = studentsGetFromUI();
        studentsSetUI([list[0] || ""]);
      }
    });

    // filters
    on(searchInput, "input", () => {
  ui.search = searchInput.value;
  saveStorage();
  rerenderAll();
});

    on(subjectFilter, "change", () => {
  ui.subject = subjectFilter.value;
  saveStorage();
  rerenderAll();
});

    on(teacherFilter, "change", () => {
  ui.teacher = teacherFilter.value;
  if (teacherTopSelect) teacherTopSelect.value = ui.teacher || "";
  saveStorage();
  rerenderAll();
});

    on(roleSelect, "change", () => {
      ui.role = roleSelect.value;
      if (ui.role !== "student") ui.studentName = "";
      saveStorage();
      rerenderAll();
    });

    on(studentNameInput, "input", () => {
  ui.studentName = studentNameInput.value;
  saveStorage();
  rerenderAll();
});

    statusTabs.forEach(btn => {
  on(btn, "click", () => {
    statusTabs.forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    ui.listStatus = btn.dataset.status || "planned";
    saveStorage();
    renderList();
  });
});

    // drag-drop lane
    on(dayLane, "dragover", onLaneDragOver);
    on(dayLane, "drop", onLaneDrop);
  }

  // ---------------- Boot ----------------
  function init() {
    loadStorage();
    wireEvents();
    ensureDemoChats();

    openPage("page-lessons"); // стартова вкладка

    // активна вкладка списку
    statusTabs.forEach(b => b.classList.toggle("is-active", (b.dataset.status || "planned") === (ui.listStatus || "planned")));

    setMode(ui.mode || "calendar");
    rerenderAll();
  }

  // ensure DOM ready even if script moved
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();