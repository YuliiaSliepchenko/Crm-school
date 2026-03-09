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
  const TASKS_KEY = "skilled_crm_tasks_v1";
  const LEADS_KEY = "skilled_crm_leads_v1";
  const STUDENTS_KEY = "skilled_crm_students_v1";
  const MAIL_KEY = "skilled_crm_mail_v1";

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
  let tasks = [];
  let leads = []; // {id,name,phone,source,note,ts}
  let currentTeacher = "Платонова Юлія";
  let students = []; // {id,name,phone,note,ts}
  let leadsTab = "leads"; // "leads" | "students"

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

let studentCardState = { name: null, lessonId: null, anchor: null };
let lastPageId = "page-lessons";
let currentPageId = "page-lessons";
let mails = [];
let activeMailId = null;
let mailFilter = "all";
let mailSearch = "";

// демо "ви" як викладач (потім зробимо логін)
const ME = { id: "teacher_platonova", name: "Платонова Юлія" };

// демо список вчителів (ти потім відредагуєш)
const TEACHERS = [
  { id:"teacher_platonova", name:"Платонова Юлія" },
  { id:"teacher_ivan", name:"Соболєв Тарас" },
  { id:"teacher_olena", name:"Коваленко Олена" },
];


  // ---------------- DOM references ----------------
  const searchInput = $("#searchInput");
  const subjectFilter = $("#subjectFilter");
  const teacherFilter = $("#teacherFilter");
  const roleSelect = $("#roleSelect");
  const studentNameInput = $("#studentNameInput");
  const sidebar = $("#sidebar");


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

  // tasks refs
const tasksList = $("#tasksList");
const addTaskBtn = $("#addTaskBtn");
const tasksHint = $("#tasksHint");

  const timeCol = $("#timeCol");
  const dayLane = $("#dayLane");

  const monthGrid = $("#monthGrid");
  const weekTimeCol = $("#weekTimeCol");
  const weekDays = $("#weekDays");

  const listTable = $("#listTable");
  const statusTabs = document.querySelectorAll(".status-tab");

  const sidebarToggle = $("#sidebarToggle");
  const appRoot = document.querySelector(".app");

  // profile buttons
const btnDoneRegister = $("#btnDoneRegister");
const btnSalaryStatement = $("#btnSalaryStatement");

// report modal
const reportModal = $("#reportModal");
const reportTitle = $("#reportTitle");
const reportSummary = $("#reportSummary");
const reportTable = $("#reportTable");

  // top teacher picker
const teacherTopSelect = $("#teacherTopSelect");

// profile refs
const profileNameEl = $("#profileName");
const profileSchoolEl = $("#profileSchool");

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

    // student popover
  const studentCard = $("#studentCard");
  const scTitle = $("#scTitle");
  const scBody = $("#scBody");
  const scCloseBtn = $("#scCloseBtn");
  const scOpenBtn = $("#scOpenBtn");
  const scDoneBtn = $("#scDoneBtn");
  const scCancelBtn = $("#scCancelBtn");

  // student page
  const studentBackBtn = $("#studentBackBtn");
  const studentNameTitle = $("#studentNameTitle");
  const studentSchedule = $("#studentSchedule");
  const studentStats = $("#studentStats");
  const studentAddLessonBtn = $("#studentAddLessonBtn");
  const studentDeleteBtn = $("#studentDeleteBtn");

  // leads/students page refs
const leadsHint = $("#leadsHint");
const leadsSearch = $("#leadsSearch");
const leadsList = $("#leadsList");
const studentsList = $("#studentsList");
const addLeadBtn = $("#addLeadBtn");
const tabLeadsBtn = $("#tabLeadsBtn");
const tabStudentsBtn = $("#tabStudentsBtn");

// lead modal refs
const leadModal = $("#leadModal");
const leadModalTitle = $("#leadModalTitle");
const leadName = $("#leadName");
const leadPhone = $("#leadPhone");
const leadSource = $("#leadSource");
const leadNote = $("#leadNote");
const leadSaveBtn = $("#leadSaveBtn");
const leadConvertBtn = $("#leadConvertBtn");
const leadDeleteBtn = $("#leadDeleteBtn");

let selectedLeadId = null;

  // pages
const navLinks = document.querySelectorAll(".nav__item[data-page]");
const pages = document.querySelectorAll(".page");

const mailList = $("#mailList");
const mailSearchInput = $("#mailSearchInput");
const mailRefreshBtn = $("#mailRefreshBtn");
const mailEmpty = $("#mailEmpty");
const mailContent = $("#mailContent");

const mailSubject = $("#mailSubject");
const mailMeta = $("#mailMeta");
const mailName = $("#mailName");
const mailPhone = $("#mailPhone");
const mailEmail = $("#mailEmail");
const mailAge = $("#mailAge");
const mailType = $("#mailType");
const mailDate = $("#mailDate");
const mailText = $("#mailText");

const mailMarkReadBtn = $("#mailMarkReadBtn");
const mailInWorkBtn = $("#mailInWorkBtn");
const mailSpamBtn = $("#mailSpamBtn");
const mailDeleteBtn = $("#mailDeleteBtn");

const mailFilterButtons = document.querySelectorAll("[data-mail-filter]");

const mailNavBadge = $("#mailNavBadge");

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
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + delta);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
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
  localStorage.setItem(UI_KEY, JSON.stringify({ currentDayISO, ui, currentTeacher, currentPageId }));
  localStorage.setItem(CHAT_KEY, JSON.stringify({ chats, activeChatId }));
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  localStorage.setItem(MAIL_KEY, JSON.stringify({ mails, activeMailId, mailFilter, mailSearch }));
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
    currentTeacher = parsed.currentTeacher || currentTeacher;
    currentPageId = parsed.currentPageId || "page-lessons";
  }
} catch {}

    // tasks
try {
  const rawT = localStorage.getItem(TASKS_KEY);
  tasks = rawT ? JSON.parse(rawT) : seedTasks();
} catch {
  tasks = seedTasks();
}

try{
  const rawS = localStorage.getItem(STUDENTS_KEY);
  students = rawS ? JSON.parse(rawS) : [];
} catch { students = []; }

try{
  const rawL = localStorage.getItem(LEADS_KEY);
  leads = rawL ? JSON.parse(rawL) : [];
} catch { leads = []; }

// currentTeacher (з UI_KEY)
try {
  const rawUI = localStorage.getItem(UI_KEY);
  if (rawUI) {
    const parsed = JSON.parse(rawUI);
    currentTeacher = parsed.currentTeacher || currentTeacher;
  }
} catch {}

try {
  const rawMail = localStorage.getItem(MAIL_KEY);
  if (rawMail) {
    const parsed = JSON.parse(rawMail);
    mails = parsed.mails || [];
    activeMailId = parsed.activeMailId || null;
    mailFilter = parsed.mailFilter || "all";
    mailSearch = parsed.mailSearch || "";
  } else {
    mails = seedMails();
  }
} catch {
  mails = seedMails();
}

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

  function normalizeCurrentDayISO() {
  currentDayISO = normalizeLessonDate(currentDayISO) || isoToday();

  const validDates = [...new Set(
    (lessons || [])
      .map(l => normalizeLessonDate(l.date))
      .filter(Boolean)
  )].sort();

  if (!validDates.length) {
    currentDayISO = isoToday();
    return;
  }

  if (!validDates.includes(currentDayISO)) {
    const today = isoToday();
    currentDayISO = validDates.includes(today) ? today : validDates[0];
  }
}

function normalizeLessonDate(dateStr) {
  if (!dateStr) return "";

  // уже нормальний ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  // формат 04.03.2026 або 04/03/2026
  const m1 = String(dateStr).match(/^(\d{2})[./](\d{2})[./](\d{4})$/);
  if (m1) {
    const [, dd, mm, yyyy] = m1;
    return `${yyyy}-${mm}-${dd}`;
  }

  return "";
}

function normalizeLessonsDates() {
  lessons = (lessons || []).map(l => ({
    ...l,
    date: normalizeLessonDate(l.date) || isoToday()
  }));
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

function taskUid(){
  return "task_" + uid();
}

function seedTaskIfEmpty(){
  if (tasks.length) return;
  tasks = [
    { id: taskUid(), teacher: ME.name, title: "Підготувати матеріали до уроку", note:"Слайди + домашка", done:false, ts: Date.now() },
    { id: taskUid(), teacher: "Соболєв Тарас", title: "Перевірити домашні роботи", note:"Roblox Studio", done:false, ts: Date.now()-7200_000 },
  ];
}

function tasksForSelectedTeacher(){
  const tName = getSelectedTeacherName();
  return tasks.filter(t => t.teacher === tName);
}

function uniqueStudents(){
  const set = new Map();

  // students storage
  for (const s of (students||[])){
    const name = String(s.name||"").trim();
    if (!name) continue;
    if (!set.has(name)) set.set(name, { name });
  }

  // from lessons
  for (const l of lessons){
    for (const s of (l.students||[])){
      const name = String(s||"").trim();
      if (!name) continue;
      if (!set.has(name)) set.set(name, { name });
    }
  }

  return Array.from(set.values()).sort((a,b)=>a.name.localeCompare(b.name,"uk"));
}

function renderLeadsStudentsPage(){
  if (!leadsList || !studentsList) return;

  // показ/приховування колонок
if (leadsTab === "leads") {
  leadsList.parentElement.style.display = "";
  studentsList.parentElement.style.display = "none";
} else {
  leadsList.parentElement.style.display = "none";
  studentsList.parentElement.style.display = "";
}

  const q = (leadsSearch?.value || "").trim().toLowerCase();

  if (leadsHint){
    const tName = getSelectedTeacherName();
    leadsHint.textContent = `Викладач (фільтр зверху): ${tName}`;
  }

  // Leads
  const leadsFiltered = (leads||[])
    .slice()
    .sort((a,b)=> (b.ts||0) - (a.ts||0))
    .filter(x => {
      const hay = `${x.name||""} ${x.phone||""} ${x.source||""} ${x.note||""}`.toLowerCase();
      return !q || hay.includes(q);
    });

  leadsList.innerHTML = "";
  if (!leadsFiltered.length){
    leadsList.innerHTML = `<div class="muted" style="padding:6px 2px;">Лідів поки немає 🙂</div>`;
  } else {
    for (const l of leadsFiltered){
  const el = document.createElement("div");
  el.className = "lead-item";
  el.innerHTML = `
    <div class="lead-item__top">
      <div class="lead-item__name">${escapeHtml(l.name||"—")}</div>
      <div class="muted" style="font-weight:800;">${escapeHtml(l.phone||"")}</div>
    </div>
    <div class="lead-item__meta">${escapeHtml(l.source||"")}${l.note ? " • "+escapeHtml(l.note) : ""}</div>
  `;

  // ✅ клік по ліду
  el.addEventListener("click", () => openLeadModalEdit(l.id));
  el.addEventListener("click", () => openPersonModal({ kind:"lead", id: l.id }));
  el.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const st = students.find(x => norm(x.name) === norm(s.name));
  if (st) openPersonModal({ kind:"student", id:st.id });
});

  leadsList.appendChild(el);
}
  }

  // Students (from lessons)
  const studs = uniqueStudents().filter(s => !q || s.name.toLowerCase().includes(q));

  studentsList.innerHTML = "";
  if (!studs.length){
    studentsList.innerHTML = `<div class="muted" style="padding:6px 2px;">Учнів поки немає 🙂</div>`;
  } else {
    for (const s of studs){
      const el = document.createElement("div");
      el.className = "lead-item";
      el.innerHTML = `
        <div class="lead-item__top">
          <div class="lead-item__name">${escapeHtml(s.name)}</div>
          <div class="muted" style="font-weight:800;">Картка →</div>
        </div>
        <div class="lead-item__meta">Натисни, щоб відкрити картку учня</div>
      `;
      el.addEventListener("click", () => openStudentPage(s.name));
      el.addEventListener("click", () => openPersonModal({ kind:"lead", id:l.id }));
      studentsList.appendChild(el);
    }
  }
}

function addLeadFlow(){
  const name = prompt("Імʼя ліда:");
  if (!name) return;

  const phone = (prompt("Телефон (опційно):") || "").trim();
  const source = (prompt("Джерело (Instagram/Telegram/сайт…):") || "").trim();
  const note = (prompt("Нотатка (опційно):") || "").trim();

  const nName = norm(name);
  const nPhone = norm(phone);

  const exists = (leads || []).some(x => {
    const samePhone = nPhone && norm(x.phone) === nPhone;
    const sameNameSource = nName && norm(x.name) === nName && norm(x.source) === norm(source);
    return samePhone || sameNameSource;
  });

  if (exists){
    alert("Такий лід уже є 🙂 (перевір ім’я/телефон)");
    return;
  }

  leads.push({
    id:"lead_"+uid(),
    name:name.trim(),
    phone,
    source,
    note,
    ts:Date.now()
  });

  saveStorage();
  renderLeadsStudentsPage();
}

let personModalEl = null;
let personModalState = { kind:"lead", id:null }; // kind: lead|student

function ensurePersonModal(){
  if (personModalEl) return personModalEl;

  const wrap = document.createElement("div");
  wrap.id = "personModal";
  wrap.className = "modal";
  wrap.setAttribute("aria-hidden","true");

  wrap.innerHTML = `
    <div class="modal__backdrop" data-close="1"></div>
    <div class="modal__dialog" role="dialog" aria-modal="true" style="max-width:820px;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:10px;">
        <div id="pmTitle" style="font-weight:950; font-size:18px;">—</div>
        <button class="btn btn-ghost btn-sm" data-close="1" aria-label="Close">✕</button>
      </div>

      <div class="grid" style="gap:10px;">
        <div>
          <div class="muted" style="font-weight:800; margin:0 0 6px;">Ім’я</div>
          <input id="pmName" class="btn" style="width:100%; text-align:left; font-weight:800;" placeholder="Імʼя та прізвище" />
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div>
            <div class="muted" style="font-weight:800; margin:0 0 6px;">Телефон</div>
            <input id="pmPhone" class="btn" style="width:100%; text-align:left; font-weight:800;" placeholder="+380..." />
          </div>
          <div id="pmSourceWrap">
            <div class="muted" style="font-weight:800; margin:0 0 6px;">Джерело</div>
            <input id="pmSource" class="btn" style="width:100%; text-align:left; font-weight:800;" placeholder="Instagram/Telegram/сайт..." />
          </div>
        </div>

        <div>
          <div class="muted" style="font-weight:800; margin:0 0 6px;">Нотатка</div>
          <input id="pmNote" class="btn" style="width:100%; text-align:left; font-weight:800;" placeholder="Коментар..." />
        </div>

        <div id="pmHint" class="muted" style="margin-top:4px;"></div>

        <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-start; margin-top:6px;">
          <button id="pmSave" class="btn btn-primary">💾 Зберегти</button>
          <button id="pmConvert" class="btn btn-ghost" style="border-color:#bfdbfe;">🔁 Перетворити в учня</button>
          <button id="pmDelete" class="btn btn-ghost btn-sm" style="border-color:#fecaca;color:#b91c1c;">🗑 Видалити</button>
          <button class="btn btn-ghost btn-sm" data-close="1">Скасувати</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(wrap);
  personModalEl = wrap;

  // close handlers
  wrap.addEventListener("click", (e) => {
    if (e.target?.dataset?.close === "1") showPersonModal(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && personModalEl?.classList.contains("is-open")) showPersonModal(false);
  });

  // buttons
  $("#pmSave", wrap).addEventListener("click", savePersonFromModal);
  $("#pmDelete", wrap).addEventListener("click", deletePersonFromModal);
  $("#pmConvert", wrap).addEventListener("click", convertLeadToStudentFromModal);

  return personModalEl;
}

function showPersonModal(show){
  const m = ensurePersonModal();
  m.setAttribute("aria-hidden", show ? "false" : "true");
  m.classList.toggle("is-open", show);
}

function openPersonModal({ kind, id=null }){
  const m = ensurePersonModal();
  personModalState = { kind, id };

  const title = $("#pmTitle", m);
  const name = $("#pmName", m);
  const phone = $("#pmPhone", m);
  const sourceWrap = $("#pmSourceWrap", m);
  const source = $("#pmSource", m);
  const note = $("#pmNote", m);
  const hint = $("#pmHint", m);
  const btnConvert = $("#pmConvert", m);

  // load record
  let item = null;
  if (id){
    item = (kind === "lead" ? leads.find(x=>x.id===id) : students.find(x=>x.id===id)) || null;
  }

  if (kind === "lead"){
    title.textContent = item ? `Лід • ${item.name || "—"}` : "Новий лід";
    sourceWrap.style.display = "";
    btnConvert.style.display = item ? "" : "none";
    hint.textContent = item ? "Після конвертації лід стане учнем (і зʼявиться в вкладці “Учні”)." : "";
  } else {
    title.textContent = item ? `Учень • ${item.name || "—"}` : "Новий учень";
    sourceWrap.style.display = "none";
    btnConvert.style.display = "none";
    hint.textContent = "";
  }

  name.value = item?.name || "";
  phone.value = item?.phone || "";
  if (source) source.value = item?.source || "";
  note.value = item?.note || "";

  showPersonModal(true);
}

function savePersonFromModal(){
  const m = ensurePersonModal();
  const name = ($("#pmName", m).value || "").trim();
  const phone = ($("#pmPhone", m).value || "").trim();
  const source = ($("#pmSource", m)?.value || "").trim();
  const note = ($("#pmNote", m).value || "").trim();

  if (!name){
    alert("Вкажи імʼя 🙂");
    return;
  }

  const { kind, id } = personModalState;

  if (kind === "lead"){
    if (id){
      const idx = leads.findIndex(x=>x.id===id);
      if (idx>=0) leads[idx] = { ...leads[idx], name, phone, source, note };
    } else {
      leads.push({ id:"lead_"+uid(), name, phone, source, note, ts:Date.now() });
    }
  } else {
    if (id){
      const idx = students.findIndex(x=>x.id===id);
      if (idx>=0) students[idx] = { ...students[idx], name, phone, note };
    } else {
      students.push({ id:"student_"+uid(), name, phone, note, ts:Date.now() });
    }
  }

  saveStorage();
  renderLeadsStudentsPage();
  showPersonModal(false);
}

function deletePersonFromModal(){
  const { kind, id } = personModalState;
  if (!id) { showPersonModal(false); return; }

  const ok = confirm("Видалити запис?");
  if (!ok) return;

  if (kind === "lead") leads = leads.filter(x=>x.id!==id);
  else students = students.filter(x=>x.id!==id);

  saveStorage();
  renderLeadsStudentsPage();
  showPersonModal(false);
}

function convertLeadToStudentFromModal(){
  const { kind, id } = personModalState;
  if (kind !== "lead" || !id) return;

  const lead = leads.find(x=>x.id===id);
  if (!lead) return;

  // ✅ додаємо в учні
  const exists = students.some(s => norm(s.name) === norm(lead.name) || (lead.phone && norm(s.phone) === norm(lead.phone)));
  if (!exists){
    students.push({
      id:"student_"+uid(),
      name: lead.name,
      phone: lead.phone || "",
      note: lead.note || "",
      ts: Date.now()
    });
  }

  // ✅ видаляємо з лідів
  leads = leads.filter(x=>x.id!==id);

  // ✅ після конвертації: показати вкладку "Учні"
  leadsTab = "students";
  tabStudentsBtn?.classList.add("btn-primary");
  tabStudentsBtn?.classList.remove("btn-ghost");
  tabLeadsBtn?.classList.add("btn-ghost");
  tabLeadsBtn?.classList.remove("btn-primary");

  saveStorage();
  renderLeadsStudentsPage();
  showPersonModal(false);

  // ❌ НЕ створюємо урок автоматом
  // Якщо захочеш — додамо кнопку "Створити урок" прямо в модалці.
}

function openLeadCard(leadId){
  const lead = (leads || []).find(x => x.id === leadId);
  if (!lead) return;

  const action = prompt(
`Лід: ${lead.name}
Тел: ${lead.phone || "—"}
Джерело: ${lead.source || "—"}
Нотатка: ${lead.note || "—"}

Введи дію:
1 = Перетворити в учня (створити урок)
2 = Редагувати
3 = Видалити
(або Cancel)`
  );

  if (!action) return;

  if (action.trim() === "1"){
    // ✅ Створюємо урок і переносимо в “учні”
    openPage("page-lessons");
    openModalNew();
    setTimeout(() => {
      const first = studentsWrap?.querySelector('input[data-student]');
      if (first) first.value = lead.name || "";
      if (fTeacher) fTeacher.value = getSelectedTeacherName();
      if (fSubject) fSubject.value = "Пробний урок";
      if (fStatus) fStatus.value = "planned";
    }, 0);
    return;
  }

  if (action.trim() === "2"){
    const newName = prompt("Імʼя:", lead.name) ?? lead.name;
    const newPhone = prompt("Телефон:", lead.phone || "") ?? lead.phone;
    const newSource = prompt("Джерело:", lead.source || "") ?? lead.source;
    const newNote = prompt("Нотатка:", lead.note || "") ?? lead.note;

    lead.name = (newName || "").trim();
    lead.phone = (newPhone || "").trim();
    lead.source = (newSource || "").trim();
    lead.note = (newNote || "").trim();
    lead.ts = Date.now();

    saveStorage();
    renderLeadsStudentsPage();
    return;
  }

  if (action.trim() === "3"){
    const ok = confirm(`Видалити ліда "${lead.name}"?`);
    if (!ok) return;
    leads = leads.filter(x => x.id !== leadId);
    saveStorage();
    renderLeadsStudentsPage();
    return;
  }
}

function renderTasks(){
  if (!tasksList) return;

  const tName = getSelectedTeacherName();
  if (tasksHint) tasksHint.textContent = `Викладач: ${tName}`;

  const list = tasksForSelectedTeacher()
    .slice()
    .sort((a,b)=> (a.done - b.done) || (b.ts - a.ts));

  tasksList.innerHTML = "";

  if (!list.length){
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.style.padding = "10px 6px";
    empty.textContent = "Поки завдань нема. Натисни “➕ Додати завдання”.";
    tasksList.appendChild(empty);
    return;
  }

  for (const t of list){
    const row = document.createElement("div");
    row.className = "task" + (t.done ? " is-done" : "");

    const when = new Date(t.ts).toLocaleString("uk-UA", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" });

    row.innerHTML = `
      <div class="task__left">
        <input type="checkbox" ${t.done ? "checked":""} data-task-check="${t.id}" />
        <div>
          <div class="task__title">${escapeHtml(t.title)}</div>
          <div class="task__meta">${escapeHtml(t.note || "—")} • ${when}</div>
        </div>
      </div>

      <div class="task__right">
        <button class="task__btn task__btn--danger" data-task-del="${t.id}">🗑</button>
      </div>
    `;

    tasksList.appendChild(row);
  }

  // handlers (делегування)
  tasksList.querySelectorAll("[data-task-check]").forEach(ch => {
    on(ch, "change", () => {
      const id = ch.getAttribute("data-task-check");
      const item = tasks.find(x=>x.id===id);
      if (!item) return;
      item.done = ch.checked;
      saveStorage();
      renderTasks();
    });
  });

  tasksList.querySelectorAll("[data-task-del]").forEach(btn => {
    on(btn, "click", () => {
      const id = btn.getAttribute("data-task-del");
      tasks = tasks.filter(x=>x.id!==id);
      saveStorage();
      renderTasks();
    });
  });
}

function addTaskFlow(){
  const tName = getSelectedTeacherName();
  const title = prompt(`Нове завдання для: ${tName}\n\nВведи назву завдання:`);
  if (!title) return;

  const note = prompt("Коментар/деталі (можна пусто):") || "";

  tasks.push({
    id: taskUid(),
    teacher: tName,
    title: title.trim(),
    note: note.trim(),
    done: false,
    ts: Date.now()
  });

  saveStorage();
  renderTasks();
}

function getSelectedTeacherName(){
  // якщо нічого не вибрано — показуємо "Платонова Юлія" (ME)
  return ui.teacher || ME.name;
}

function renderProfileHeader(){
  if (!profileNameEl) return;

  const tName = getSelectedTeacherName();
  profileNameEl.textContent = tName;

  // якщо хочеш – можна змінювати підпис під ім’ям (школа/роль)
  if (profileSchoolEl){
    profileSchoolEl.textContent = "ItEnAi / ITENAI School";
  }
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

  function seedMails(){
  return [
    {
      id: "mail_" + uid(),
      name: "Олена Мельник",
      phone: "+380991112233",
      email: "test1@gmail.com",
      childAge: "10",
      subject: "Пробний урок з Roblox",
      formType: "trial_lesson",
      message: "Добрий день! Хочу записати дитину на пробний урок з Roblox. Цікавить вечірній час.",
      status: "new",
      isRead: false,
      source: "Formspree / site",
      createdAt: Date.now() - 1000 * 60 * 15
    },
    {
      id: "mail_" + uid(),
      name: "Ірина Коваленко",
      phone: "+380671234567",
      email: "test2@gmail.com",
      childAge: "8",
      subject: "Запит по курсу AI",
      formType: "course_question",
      message: "Підкажіть, будь ласка, чи підійде курс ШІ для дитини 8 років?",
      status: "in_progress",
      isRead: true,
      source: "Formspree / site",
      createdAt: Date.now() - 1000 * 60 * 60 * 3
    },
    {
      id: "mail_" + uid(),
      name: "Spam Test",
      phone: "",
      email: "spam@spam.com",
      childAge: "",
      subject: "Реклама послуг",
      formType: "other",
      message: "Небажане повідомлення.",
      status: "spam",
      isRead: true,
      source: "Other",
      createdAt: Date.now() - 1000 * 60 * 60 * 8
    }
  ];
}

function formatMailDate(ts){
  return new Date(ts).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function mailStatusBadge(status){
  if (status === "new") return `<span class="mail-badge mail-badge--new">Нове</span>`;
  if (status === "read") return `<span class="mail-badge mail-badge--read">Прочитане</span>`;
  if (status === "in_progress") return `<span class="mail-badge mail-badge--work">В роботі</span>`;
  if (status === "spam") return `<span class="mail-badge mail-badge--spam">Спам</span>`;
  return `<span class="mail-badge">${escapeHtml(status)}</span>`;
}

function filteredMails(){
  return (mails || [])
    .filter(m => {
      if (mailFilter === "all") return true;
      return m.status === mailFilter;
    })
    .filter(m => {
      const q = (mailSearch || "").trim().toLowerCase();
      if (!q) return true;
      const hay = `${m.name||""} ${m.email||""} ${m.phone||""} ${m.subject||""} ${m.message||""}`.toLowerCase();
      return hay.includes(q);
    })
    .sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function renderMailList(){
  if (!mailList) return;

  mailList.innerHTML = "";
  const list = filteredMails();

  if (!list.length){
    mailList.innerHTML = `<div class="muted" style="padding:10px;">Повідомлень поки немає 🙂</div>`;
    return;
  }

  for (const m of list){
    const item = document.createElement("div");
    item.className = "mail-item"
      + (m.id === activeMailId ? " is-active" : "")
      + (m.status === "new" ? " is-new" : "");

    item.innerHTML = `
      <div class="mail-item__top">
        <div class="mail-item__name">${escapeHtml(m.name || "Без імені")}</div>
        <div class="mail-item__date">${formatMailDate(m.createdAt)}</div>
      </div>
      <div class="mail-item__subject">${escapeHtml(m.subject || "Без теми")} ${mailStatusBadge(m.status)}</div>
      <div class="mail-item__snippet">${escapeHtml((m.message || "").slice(0, 90))}${(m.message || "").length > 90 ? "..." : ""}</div>
    `;

    on(item, "click", () => {
      activeMailId = m.id;
      if (m.status === "new") {
        m.status = "read";
        m.isRead = true;
      }
      saveStorage();
      renderMailPage();
    });

    mailList.appendChild(item);
  }
}

function renderMailNavBadge(){
  if (!mailNavBadge) return;
  const count = (mails || []).filter(m => m.status === "new").length;
  mailNavBadge.textContent = count;
  mailNavBadge.classList.toggle("is-hidden", count === 0);
}

function renderMailContent(){
  if (!mailEmpty || !mailContent) return;

  const m = mails.find(x => x.id === activeMailId);

  if (!m){
    mailEmpty.style.display = "";
    mailContent.style.display = "none";
    return;
  }

  mailEmpty.style.display = "none";
  mailContent.style.display = "block";

  if (mailSubject) mailSubject.textContent = m.subject || "Без теми";
  if (mailMeta) mailMeta.textContent = `${m.source || "site"} • ${formatMailDate(m.createdAt)}`;
  if (mailName) mailName.textContent = m.name || "—";
  if (mailPhone) mailPhone.textContent = m.phone || "—";
  if (mailEmail) mailEmail.textContent = m.email || "—";
  if (mailAge) mailAge.textContent = m.childAge || "—";
  if (mailType) mailType.textContent = m.formType || "—";
  if (mailDate) mailDate.textContent = formatMailDate(m.createdAt);
  if (mailText) mailText.textContent = m.message || "—";
}

function renderMailFilters(){
  mailFilterButtons.forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.mailFilter === mailFilter);
  });
}

function renderMailPage(){
  if (mailSearchInput) mailSearchInput.value = mailSearch || "";

  const list = filteredMails();

  if (!activeMailId && list.length) {
    activeMailId = list[0].id;
  }

  if (activeMailId && !list.some(m => m.id === activeMailId)) {
    activeMailId = list.length ? list[0].id : null;
  }

  renderMailFilters();
  renderMailList();
  renderMailContent();
}

function updateActiveMailStatus(status){
  const m = mails.find(x => x.id === activeMailId);
  if (!m) return;
  m.status = status;
  if (status !== "new") m.isRead = true;
  saveStorage();
  renderMailPage();
}

function deleteActiveMail(){
  if (!activeMailId) return;
  mails = mails.filter(x => x.id !== activeMailId);
  activeMailId = null;
  saveStorage();
  renderMailPage();
}

  function seedTasks(){
  return [
    { id: uid(), teacher: "Платонова Юлія", text: "Перевірити домашку у групи ШІ", done:false, createdAt: Date.now() },
    { id: uid(), teacher: "Соболєв Тарас", text: "Підготувати матеріал для Roblox уроку", done:false, createdAt: Date.now() },
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

    function escHtml(s){
    return String(s ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }
  function escAttr(s){ return escHtml(s); }

  // alias для всього коду, де використовується escapeHtml
function escapeHtml(s){ return escHtml(s); }
function escapeAttr(s){ return escAttr(s); }

  function metaLineHTML(lesson) {
    const st = lesson.students || [];
    const studentsHtml = st.length
      ? st.map(n => `<span class="student-link" data-student="${escAttr(n)}">${escHtml(n)}</span>`).join(", ")
      : "—";

    const note = lesson.note ? ` • ${escHtml(lesson.note)}` : "";
    return `${studentsHtml} • ${escHtml(lesson.teacher)}${note}`;
  }

  function metaLine(lesson){
  return metaLineHTML(lesson);
}

  function calcTopPx(startMin) {
    const rel = startMin - DAY_START;
    return (rel / 60) * PX_PER_HOUR + BASE_TOP_PX;
  }

  function calcHeightPx(durMin) {
    return Math.max((durMin / 60) * PX_PER_HOUR, 34);
  }

  function showLeadModal(show){
  if (!leadModal) return;
  leadModal.setAttribute("aria-hidden", show ? "false" : "true");
  leadModal.classList.toggle("is-open", show);
}

function openLeadModalNew(){
  selectedLeadId = null;
  if (leadModalTitle) leadModalTitle.textContent = "Новий лід";

  if (leadName) leadName.value = "";
  if (leadPhone) leadPhone.value = "";
  if (leadSource) leadSource.value = "";
  if (leadNote) leadNote.value = "";

  if (leadDeleteBtn) leadDeleteBtn.style.display = "none";
  if (leadConvertBtn) leadConvertBtn.style.display = "none"; // ще нема що конвертити
  showLeadModal(true);
}

function openLeadModalEdit(id){
  const l = (leads||[]).find(x => x.id === id);
  if (!l) return;

  selectedLeadId = id;
  if (leadModalTitle) leadModalTitle.textContent = `Лід • ${l.name || "—"}`;

  if (leadName) leadName.value = l.name || "";
  if (leadPhone) leadPhone.value = l.phone || "";
  if (leadSource) leadSource.value = l.source || "";
  if (leadNote) leadNote.value = l.note || "";

  if (leadDeleteBtn) leadDeleteBtn.style.display = "inline-block";
  if (leadConvertBtn) leadConvertBtn.style.display = "inline-block";
  showLeadModal(true);
}

function upsertLeadFromForm(){
  const name = (leadName?.value || "").trim();
  if (!name) { alert("Вкажи ім’я ліда 🙂"); return; }

  const phone = (leadPhone?.value || "").trim();
  const source = (leadSource?.value || "").trim();
  const note = (leadNote?.value || "").trim();

  if (selectedLeadId){
    const idx = leads.findIndex(x => x.id === selectedLeadId);
    if (idx >= 0){
      leads[idx] = { ...leads[idx], name, phone, source, note };
    }
  } else {
    leads.push({ id:"lead_"+uid(), name, phone, source, note, ts: Date.now() });
  }

  saveStorage();
  renderLeadsStudentsPage();
  showLeadModal(false);
}

function deleteLead(){
  if (!selectedLeadId) return;
  const l = leads.find(x => x.id === selectedLeadId);
  if (!l) return;
  if (!confirm(`Видалити ліда "${l.name}"?`)) return;

  leads = leads.filter(x => x.id !== selectedLeadId);
  selectedLeadId = null;

  saveStorage();
  renderLeadsStudentsPage();
  showLeadModal(false);
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
        <div class="event__meta">${metaLineHTML(lesson)}</div>
      `;

      on(el, "click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (e.shiftKey) {
    openModalFor(lesson.id);
    return;
  }

  const studentList = Array.isArray(lesson.students) ? lesson.students.filter(Boolean) : [];
  const firstStudent = studentList.length ? studentList[0] : "";

  if (firstStudent) {
    openStudentCard(el, firstStudent, lesson.id);
  } else {
    openModalFor(lesson.id);
  }
});
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
        ev.dataset.id = l.id;
        ev.style.left = "0";
        ev.style.right = "0";
        ev.innerHTML = `
          <div class="event__time">${l.start}</div>
          <div class="event__title">${l.subject}</div>
          <div class="event__meta">${metaLineHTML(l)}</div>
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
        <div class="event__meta">${metaLineHTML(l)}</div>
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

  function closeStudentCard(){
    if (!studentCard) return;
    studentCard.classList.remove("is-open");
    studentCard.setAttribute("aria-hidden","true");
    studentCardState = { name:null, lessonId:null, anchor:null };
  }

  function positionStudentCard(anchorEl){
    if (!studentCard || !anchorEl) return;
    const r = anchorEl.getBoundingClientRect();

    // базово справа від елемента + трохи вниз
    let left = r.right + 10;
    let top = r.top + 10;

    // якщо не влазить праворуч — показуємо ліворуч
    const cardW = studentCard.offsetWidth || 360;
    const cardH = studentCard.offsetHeight || 220;

    if (left + cardW > window.innerWidth - 8) left = r.left - cardW - 10;
    if (left < 8) left = 8;

    // якщо низ не влазить — піднімаємо
    if (top + cardH > window.innerHeight - 8) top = window.innerHeight - cardH - 8;
    if (top < 8) top = 8;

    studentCard.style.left = `${Math.round(left)}px`;
    studentCard.style.top  = `${Math.round(top)}px`;
  }

  function openStudentCard(anchorEl, studentName, lessonId){
    if (!studentCard) return;

    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    studentCardState = { name: studentName, lessonId, anchor: anchorEl };

    if (scTitle) scTitle.textContent = studentName;
    if (scBody){
      const startMin = hhmmToMin(lesson.start);
      const end = minToHHMM(startMin + Number(lesson.dur || 0));

      scBody.innerHTML = `
        <div class="student-card__row"><div class="student-card__k">Тип</div><div class="student-card__v">${escHtml(lesson.type)} • ${escHtml(STATUS_META[lesson.status]?.label || "")}</div></div>
        <div class="student-card__row"><div class="student-card__k">Час</div><div class="student-card__v"><b>${escHtml(lesson.start)} – ${escHtml(end)}</b> (${escHtml(lesson.dur)} хв.)</div></div>
        <div class="student-card__row"><div class="student-card__k">Педагог</div><div class="student-card__v">${escHtml(lesson.teacher)}</div></div>
        <div class="student-card__row"><div class="student-card__k">Предмет</div><div class="student-card__v">${escHtml(lesson.subject)}</div></div>
      `;
    }

    studentCard.classList.add("is-open");
    studentCard.setAttribute("aria-hidden","false");
    positionStudentCard(anchorEl);
  }

  function lessonsForStudent(name){
    const q = norm(name);
    return lessons.filter(l => (l.students || []).some(s => norm(s) === q));
  }

  function renderStudentPage(name){
    if (studentNameTitle) studentNameTitle.textContent = name;

    const list = lessonsForStudent(name).slice().sort((a,b)=>{
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return hhmmToMin(a.start) - hhmmToMin(b.start);
    });

    // stats
    const total = list.length;
    const minutes = list.reduce((acc,l)=>acc + Number(l.dur||0), 0);

    const byStatus = list.reduce((acc,l)=>{
      const k = statusToLabelKey(l.status);
      acc[k] = (acc[k]||0)+1;
      return acc;
    }, {planned:0, done:0, cancelled:0});

    const bySubject = list.reduce((acc,l)=>{
      acc[l.subject] = (acc[l.subject]||0)+1;
      return acc;
    }, {});
    const topSubjects = Object.entries(bySubject).sort((a,b)=>b[1]-a[1]).slice(0,4);

    if (studentStats){
      studentStats.innerHTML = `
        <div class="profile2__stat"><div>Уроків всього</div><div>${total}</div></div>
        <div class="profile2__stat"><div>Хвилин всього</div><div>${minutes}</div></div>
        <div class="profile2__stat"><div>Заплановано</div><div>${byStatus.planned||0}</div></div>
        <div class="profile2__stat"><div>Проведено</div><div>${byStatus.done||0}</div></div>
        <div class="profile2__stat"><div>Скасовано</div><div>${byStatus.cancelled||0}</div></div>
        <div class="spacer"></div>
        <div style="font-weight:950; margin:4px 0 6px;">Топ предмети</div>
        ${topSubjects.length ? topSubjects.map(([s,c]) =>
          `<div class="profile2__stat"><div>${escHtml(s)}</div><div>${c}</div></div>`
        ).join("") : `<div class="muted">Поки немає предметів 🙂</div>`}
      `;
    }

    // next 7 days schedule
    const startISO = isoToday();
    const endISO = addDays(startISO, 6);
    const fromD = parseISODate(startISO);
    const toD = parseISODate(endISO);

    const upcoming = list.filter(l=>{
      const d = parseISODate(l.date);
      return d >= fromD && d <= toD;
    });

    function dowShort(iso){
  const d = parseISODate(iso);
  const map = ["НД","ПН","ВТ","СР","ЧТ","ПТ","СБ"];
  return map[d.getDay()];
}

if (studentSchedule){
  if (!upcoming.length){
    studentSchedule.innerHTML = `<div class="muted">На найближчі 7 днів уроків немає 🙂</div>`;
  } else {
    const rows = upcoming
      .slice()
      .sort((a,b)=> (a.date!==b.date ? a.date.localeCompare(b.date) : hhmmToMin(a.start)-hhmmToMin(b.start)));

    studentSchedule.innerHTML = `
      <div class="sch7">
        ${rows.map(l=>{
          const startMin = hhmmToMin(l.start);
          const end = minToHHMM(startMin + Number(l.dur||0));
          const line1 = `${dowShort(l.date)} ${l.start} — ${end}`;
          const line2 = `${l.subject} (${l.type || "Індивідуальний"})`;
          const line3 = `${l.teacher} • ${l.date}`;
          return `
            <div class="sch7__item">
              <div class="sch7__row1">
                <div class="sch7__dow">${line1.split(" ")[0]}</div>
                <div class="sch7__time">${line1.slice(3)}</div>
              </div>
              <div class="sch7__sub">${escapeHtml(line2)}</div>
              <div class="sch7__muted">${escapeHtml(line3)}</div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }
}
  }

  function openStudentPage(name){
    closeStudentCard();
    lastPageId = document.querySelector(".page.is-active")?.id || "page-lessons";
    renderStudentPage(name);
    openPage("page-student");
  }

  function deleteCurrentStudent(){
  const name = (studentNameTitle?.textContent || "").trim();
  if (!name) return;

  const ok = confirm(`Видалити учня "${name}"?`);
  if (!ok) return;

  // 1. прибираємо зі списку students
  students = students.filter(s => norm(s.name) !== norm(name));

  // 2. прибираємо з усіх уроків
  lessons = lessons
    .map(l => ({
      ...l,
      students: (l.students || []).filter(s => norm(s) !== norm(name))
    }))
    .filter(l => (l.students || []).length > 0); // якщо урок був тільки з цим учнем — видаляємо урок

  saveStorage();
  rerenderAll();
  renderLeadsStudentsPage();
  openPage("page-leads");
}

function monthLabel(y,m){
  const months = ["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"];
  return `${months[m]} ${y}`;
}

function calcMonthStats(y,m, teacher){
  const from = new Date(y,m,1);
  const to = new Date(y,m+1,0);

  const list = lessons
    .filter(l => l.teacher === teacher)
    .filter(l => {
      const d = parseISODate(l.date);
      return d >= from && d <= to;
    });

  const sumMin = (arr) => arr.reduce((s,l)=>s+(Number(l.dur)||0),0);

  const ind = list.filter(l => (l.type||"") === "Індивідуальний");
  const grp = list.filter(l => (l.type||"") === "Груповий");

  const done = list.filter(l => l.status === "done" || l.status === "debt");
  const planned = list.filter(l => l.status === "planned");

  return {
    totalCount: list.length,
    totalMin: sumMin(list),

    indCount: ind.length,
    indMin: sumMin(ind),

    grpCount: grp.length,
    grpMin: sumMin(grp),

    doneCount: done.length,
    doneMin: sumMin(done),

    plannedCount: planned.length,
    plannedMin: sumMin(planned),
  };
}

function renderProfile(){
  const scheduleEl = $("#profileSchedule");
  const statsEl = $("#profileStats");
  if (!scheduleEl || !statsEl) return;

  // Розклад на 7 днів (по поточному currentDayISO)
  scheduleEl.innerHTML = "";
  const start = parseISODate(isoToday());

  for (let i=0;i<7;i++){
    const d = new Date(start);
    d.setDate(start.getDate()+i);
    const iso = toLocalISO(d);

    const dayLessons = lessons
      .filter(l => l.date === iso)
      .filter(l => l.teacher === currentTeacher)
      .sort((a,b)=>hhmmToMin(a.start)-hhmmToMin(b.start));

    const row = document.createElement("div");
    row.className = "profile2__dayrow";

    const left = document.createElement("div");
    left.className = "profile2__day";
    left.textContent = fmtDayHeader(iso).sub;

    const right = document.createElement("div");
    right.className = "profile2__lessons";

    if (!dayLessons.length){
      right.innerHTML = `<div class="muted">—</div>`;
    } else {
      for (const l of dayLessons){
        const st = (l.students||[])[0] || "—";
        const item = document.createElement("div");
        item.className = "profile2__lesson";
        
        item.innerHTML = `
  <span class="profile2__time">${l.start}</span>
  <span class="profile2__student" data-student="${escapeAttr(st)}">${escapeHtml(st)}</span>
  <span class="muted">• ${escapeHtml(l.subject)}</span>
`;
        
        const studentEl = item.querySelector(".profile2__student");
if (studentEl) {
  on(studentEl, "click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openStudentPage(st);
  });
}
        right.appendChild(item);
      }
    }

    row.appendChild(left);
    row.appendChild(right);
    scheduleEl.appendChild(row);
  }

  // Статистика (поточний + попередній місяць)
  statsEl.innerHTML = "";
  const cur = parseISODate(currentDayISO);
  const curY = cur.getFullYear();
  const curM = cur.getMonth();
  const prev = new Date(curY, curM-1, 1);

  const blocks = [
    { label: monthLabel(curY, curM), y: curY, m: curM },
    { label: monthLabel(prev.getFullYear(), prev.getMonth()), y: prev.getFullYear(), m: prev.getMonth() },
  ];

  for (const b of blocks){
    const data = calcMonthStats(b.y, b.m, currentTeacher);

    const wrap = document.createElement("div");
    wrap.innerHTML = `<div style="font-weight:950; margin:6px 0 8px;">${b.label}</div>`;

    const items = [
      ["Індивідуальні", `${data.indCount} шт`, `${data.indMin} хв`],
      ["Групові", `${data.grpCount} шт`, `${data.grpMin} хв`],
      ["Разом", `${data.totalCount} шт`, `${data.totalMin} хв`],
    ];

    for (const [name, a, c] of items){
      const el = document.createElement("div");
      el.className = "profile2__stat";
      el.innerHTML = `<span>${name}</span><span>${a} • ${c}</span>`;
      wrap.appendChild(el);
    }

    statsEl.appendChild(wrap);
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
  renderProfileHeader();
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

function showReportModal(show){
  if (!reportModal) return;
  reportModal.setAttribute("aria-hidden", show ? "false" : "true");
  reportModal.classList.toggle("is-open", show);
}

function renderReportTable(title, list){
  if (reportTitle) reportTitle.textContent = title;
  if (!reportTable || !reportSummary) return;

  reportTable.innerHTML = "";
  const head = document.createElement("div");
  head.className = "report-row report-h";
  head.innerHTML = `<div>Дата</div><div>Час</div><div>Учні / Тема</div><div>Статус</div>`;
  reportTable.appendChild(head);

  const totalMin = list.reduce((s,l)=>s+(Number(l.dur)||0),0);
  reportSummary.textContent = `Викладач: ${currentTeacher} • Записів: ${list.length} • Разом: ${totalMin} хв`;

  if (!list.length){
    const empty = document.createElement("div");
    empty.className = "week__empty";
    empty.textContent = "Поки що немає записів 🙂";
    reportTable.appendChild(empty);
  } else {
    for (const l of list){
      const row = document.createElement("div");
      row.className = "report-row";
      const st = (l.students||[]).join(", ") || "—";
      row.innerHTML = `
        <div><b>${l.date}</b></div>
        <div>${l.start}</div>
        <div><b>${st}</b><div class="muted">${l.subject} • ${l.dur} хв</div></div>
        <div><span class="badge">${STATUS_META[l.status]?.label || l.status}</span></div>
      `;
      reportTable.appendChild(row);
    }
  }

  showReportModal(true);
}

function openDoneRegister(){
  const cur = parseISODate(currentDayISO);
  const y = cur.getFullYear(), m = cur.getMonth();
  const from = new Date(y,m,1);
  const to = new Date(y,m+1,0);

  const list = lessons
    .filter(l => l.teacher === currentTeacher)
    .filter(l => {
      const d = parseISODate(l.date);
      return d >= from && d <= to;
    })
    .filter(l => l.status === "done" || l.status === "debt")
    .sort((a,b)=> (a.date!==b.date ? a.date.localeCompare(b.date) : hhmmToMin(a.start)-hhmmToMin(b.start)));

  renderReportTable("Реєстр проведених уроків", list);
}

function openSalaryStatement(){
  // демо як список проведених (потім додамо тариф/розрахунок)
  openDoneRegister();
  if (reportTitle) reportTitle.textContent = "Виписка по зарплаті (демо)";
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
    if (fTeacher) fTeacher.value = getSelectedTeacherName();
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
  return ui.view || "day";
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
  const safePages = [
    "page-lessons",
    "page-profile",
    "page-leads",
    "page-chat",
    "page-student",
    "page-mail"
  ];

  const realPageId = safePages.includes(pageId) ? pageId : "page-lessons";
  currentPageId = realPageId;

  pages.forEach(p => p.classList.remove("is-active"));

  const target = document.getElementById(realPageId);
  if (target) target.classList.add("is-active");

  document.querySelectorAll(".nav__item").forEach(a => a.classList.remove("active"));
  document.querySelectorAll(`.nav__item[data-page="${realPageId}"]`).forEach(a => a.classList.add("active"));

  if (realPageId === "page-lessons") {
    setMode(ui.mode || "calendar");
    setView(ui.view || "day");
    rerenderAll();
  }

  if (realPageId === "page-profile") {
    renderProfileHeader();
    renderProfile();
  }

  if (realPageId === "page-leads") {
    renderLeadsStudentsPage();
  }

  if (realPageId === "page-chat") {
  if (typeof renderChatContacts === "function") renderChatContacts();
  if (typeof renderChatRoom === "function") renderChatRoom();
}

  if (realPageId === "page-mail") {
    renderMailPage();
  }

  saveStorage();
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
    on(todayBtn, "click", () => {
      currentDayISO = isoToday();
      saveStorage();
      rerenderAll();
    });

    on(addTaskBtn, "click", addTaskFlow);
    on(prevBtn, "click", () => navDelta(-1));
    on(nextBtn, "click", () => navDelta(+1));

    // chat
on(newChatBtn, "click", openNewChatFlow);
on(chatSendBtn, "click", sendChatMessage);
on(chatInput, "keydown", (e) => {
  if (e.key === "Enter") sendChatMessage();
});

on(addLeadBtn, "click", addLeadFlow);
on(leadsSearch, "input", renderLeadsStudentsPage);
on(tabLeadsBtn, "click", () => {
  leadsTab = "leads";
  tabLeadsBtn.classList.add("btn-primary");
  tabLeadsBtn.classList.remove("btn-ghost");
  tabStudentsBtn.classList.add("btn-ghost");
  tabStudentsBtn.classList.remove("btn-primary");
  renderLeadsStudentsPage();
});

on(tabStudentsBtn, "click", () => {
  leadsTab = "students";
  tabStudentsBtn.classList.add("btn-primary");
  tabStudentsBtn.classList.remove("btn-ghost");
  tabLeadsBtn.classList.add("btn-ghost");
  tabLeadsBtn.classList.remove("btn-primary");
  renderLeadsStudentsPage();
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
  ui.teacher = teacherTopSelect.value;           // фільтр уроків
  currentTeacher = ui.teacher || "Платонова Юлія"; // профіль/звіт/задачі
  saveStorage();
  rerenderAll();
  renderProfile();
});

// profile reports
on(btnDoneRegister, "click", openDoneRegister);
on(btnSalaryStatement, "click", openSalaryStatement);

// close report modal
on(reportModal, "click", (e) => {
  if (e.target?.dataset?.close === "1") showReportModal(false);
});

// lead modal
on(addLeadBtn, "click", () => {
  if (leadsTab === "students") openPersonModal({ kind:"student" });
  else openPersonModal({ kind:"lead" });
});

on(mailSearchInput, "input", () => {
  mailSearch = mailSearchInput.value || "";
  saveStorage();
  renderMailPage();
});

mailFilterButtons.forEach(btn => {
  on(btn, "click", () => {
    mailFilter = btn.dataset.mailFilter || "all";
    saveStorage();
    renderMailPage();
  });
});

on(mailRefreshBtn, "click", () => {
  renderMailPage();
});

on(mailMarkReadBtn, "click", () => updateActiveMailStatus("read"));
on(mailInWorkBtn, "click", () => updateActiveMailStatus("in_progress"));
on(mailSpamBtn, "click", () => updateActiveMailStatus("spam"));
on(mailDeleteBtn, "click", deleteActiveMail);

on(leadSaveBtn, "click", upsertLeadFromForm);
on(leadDeleteBtn, "click", deleteLead);
on(leadConvertBtn, "click", convertLeadToStudentFromModal);

on(leadModal, "click", (e) => {
  if (e.target?.dataset?.close === "1") showLeadModal(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    showLeadModal(false);
  }
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

function renderTasksPage(){
  const page = $("#page-tasks");
  if (!page) return;

  page.innerHTML = `
    <div class="card" style="padding:14px 16px;">
      <div style="display:flex; gap:10px; align-items:center; justify-content:space-between; flex-wrap:wrap;">
        <div>
          <div style="font-weight:950;">Завдання</div>
          <div class="muted">Викладач: <b>${currentTeacher}</b></div>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
          <input id="taskInput" class="btn" style="width:340px; font-weight:700;" placeholder="Нове завдання..." />
          <button id="taskAddBtn" class="btn btn-primary">➕ Додати</button>
        </div>
      </div>
      <div id="tasksList" style="margin-top:12px;"></div>
    </div>
  `;

  const taskInput = $("#taskInput");
  const taskAddBtn = $("#taskAddBtn");
  const tasksList = $("#tasksList");

  function renderList(){
    tasksList.innerHTML = "";

    const list = tasks
      .filter(t => t.teacher === currentTeacher)
      .sort((a,b)=> (a.done===b.done ? b.createdAt-a.createdAt : (a.done?1:-1)));

    if (!list.length){
      tasksList.innerHTML = `<div class="muted" style="padding:10px 0;">Поки що завдань немає 🙂</div>`;
      return;
    }

    for (const t of list){
      const row = document.createElement("div");
      row.className = "list-row";
      row.style.gridTemplateColumns = "36px 1fr 110px";
      row.innerHTML = `
        <div><input type="checkbox" ${t.done?"checked":""} data-id="${t.id}" /></div>
        <div style="${t.done?"text-decoration:line-through; opacity:.7;":""}"><b>${escapeHtml(t.text)}</b></div>
        <div style="text-align:right;">
          <button class="btn btn-ghost btn-sm" data-del="${t.id}" style="border-color:#fecaca;color:#b91c1c;">Видалити</button>
        </div>
      `;
      tasksList.appendChild(row);
    }

    tasksList.querySelectorAll('input[type="checkbox"][data-id]').forEach(ch => {
      ch.addEventListener("change", () => {
        const id = ch.dataset.id;
        const item = tasks.find(x=>x.id===id);
        if (!item) return;
        item.done = ch.checked;
        saveStorage();
        renderList();
      });
    });

    tasksList.querySelectorAll('button[data-del]').forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.del;
        tasks = tasks.filter(x=>x.id!==id);
        saveStorage();
        renderList();
      });
    });
  }

  function addTask(){
    const text = (taskInput.value || "").trim();
    if (!text) return;
    tasks.push({ id: uid(), teacher: currentTeacher, text, done:false, createdAt: Date.now() });
    taskInput.value = "";
    saveStorage();
    renderList();
  }

  on(taskAddBtn, "click", addTask);
  on(taskInput, "keydown", (e)=>{ if (e.key==="Enter") addTask(); });

  renderList();
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

    // click on student name inside events (day/week/month)
    document.addEventListener("click", (e) => {
      const t = e.target;
      if (!t) return;

      // close popover on outside click
      if (studentCard?.classList.contains("is-open")) {
        const insideCard = studentCard.contains(t);
        const insideLink = t.classList?.contains("student-link");
        if (!insideCard && !insideLink) closeStudentCard();
      }

      // open popover by clicking student link
      if (t.classList && t.classList.contains("student-link")) {
        e.preventDefault();
        e.stopPropagation();
        const name = t.dataset.student;
        const eventEl = t.closest(".event");
        const lessonId = eventEl?.dataset?.id;
        if (name && lessonId) openStudentCard(t, name, lessonId);
      }
    });

    on(scCloseBtn, "click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  closeStudentCard();
});

    on(scOpenBtn, "click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (!studentCardState.name) return;
  openStudentPage(studentCardState.name);
});

    on(scDoneBtn, "click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  const id = studentCardState.lessonId;
  const l = lessons.find(x => x.id === id);
  if (!l) return;

  l.status = "done";
  saveStorage();
  rerenderAll();
  closeStudentCard();
});

    on(scCancelBtn, "click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  const id = studentCardState.lessonId;
  const l = lessons.find(x => x.id === id);
  if (!l) return;

  l.status = "cancelled";
  saveStorage();
  rerenderAll();
  closeStudentCard();
});

    // keep popover position on resize/scroll
    window.addEventListener("resize", () => {
      if (studentCardState.anchor && studentCard?.classList.contains("is-open")) {
        positionStudentCard(studentCardState.anchor);
      }
    }, { passive:true });

    window.addEventListener("scroll", () => {
      if (studentCardState.anchor && studentCard?.classList.contains("is-open")) {
        positionStudentCard(studentCardState.anchor);
      }
    }, { passive:true, capture:true });

    // student page buttons
    on(studentBackBtn, "click", () => openPage(lastPageId || "page-lessons"));
on(studentDeleteBtn, "click", deleteCurrentStudent);

on(studentAddLessonBtn, "click", () => {
      // швидко відкриємо модал "новий урок" і підставимо учня
      openPage("page-lessons");
      openModalNew();
      // підставимо імʼя учня в перший інпут
      const name = studentNameTitle?.textContent || "";
      setTimeout(() => {
        const first = studentsWrap?.querySelector('input[data-student]');
        if (first && name) first.value = name;
      }, 0);
    });

    // drag-drop lane
    on(dayLane, "dragover", onLaneDragOver);
    on(dayLane, "drop", onLaneDrop);
  }

  // ---------------- Boot ----------------
  function init() {
  loadStorage();
  normalizeLessonsDates();
  normalizeCurrentDayISO();
  wireEvents();
  // ensureDemoChats();
  saveStorage();

  statusTabs.forEach(b => {
    b.classList.toggle(
      "is-active",
      (b.dataset.status || "planned") === (ui.listStatus || "planned")
    );
  });

  renderProfileHeader();
  renderTopTeacherSelect();

  setMode(ui.mode || "calendar");
  setView(ui.view || "day");
  applyUIToControls();

  openPage(currentPageId || "page-lessons");
}

  // ensure DOM ready even if script moved
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();