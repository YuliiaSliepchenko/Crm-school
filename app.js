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

  const DAY_START = 7 * 60;   // 07:00
  const DAY_END = 21 * 60;    // 21:00
  const SLOT = 30;            // labels each 30 min
  const PX_PER_HOUR = 3.2 * 16; // must match CSS: 3.2rem per hour
  const BASE_TOP_PX = 0.75 * 16;

  const STATUS_META = {
    planned: { label: "Заплановано", className: "" },
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
    role: "teacher",     // teacher | student
    studentName: "",
    view: "day",         // month | week | day
  };

  // ---------------- DOM references ----------------
  const searchInput = $("#searchInput");
  const subjectFilter = $("#subjectFilter");
  const teacherFilter = $("#teacherFilter");
  const roleSelect = $("#roleSelect");
  const studentNameInput = $("#studentNameInput");

  const addLessonBtn = $("#addLessonBtn");
  const todayBtn = $("#todayBtn");

  const prevBtn = $("#prevBtn");
  const nextBtn = $("#nextBtn");

  const viewMonthBtn = $("#viewMonthBtn");
  const viewWeekBtn = $("#viewWeekBtn");

  const tabMonth = $("#tab-month");
  const tabWeek = $("#tab-week");
  const tabDay = $("#tab-day");

  const titleBig = $("#titleBig");
  const titleSub = $("#titleSub");
  const dayTitle = $("#dayTitle");
  const daySubtitle = $("#daySubtitle");

  const timeCol = $("#timeCol");
  const dayLane = $("#dayLane");

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

  // ---------------- Utils ----------------
  function isoToday() {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d.toISOString().slice(0,10);
  }

  function parseISODate(iso) {
    const [y,m,dd] = iso.split("-").map(Number);
    return new Date(y, m-1, dd);
  }

  function addDays(iso, delta) {
    const d = parseISODate(iso);
    d.setDate(d.getDate() + delta);
    return d.toISOString().slice(0,10);
  }

  function addMonths(iso, delta) {
    const d = parseISODate(iso);
    d.setMonth(d.getMonth() + delta);
    return d.toISOString().slice(0,10);
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

  function rerenderAll() {
    renderTitles();
    renderFiltersOptions();
    applyUIToControls();
    renderTimeCol();
    renderDay();
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

  // ---------------- Wire events ----------------
  function wireEvents() {
    on(addLessonBtn, "click", openModalNew);
    on(todayBtn, "click", () => {
      currentDayISO = isoToday();
      saveStorage();
      rerenderAll();
    });

    on(prevBtn, "click", () => navDelta(-1));
    on(nextBtn, "click", () => navDelta(+1));

    // view icons
    on(viewMonthBtn, "click", () => { setView("month"); rerenderAll(); });
    on(viewWeekBtn, "click", () => { setView("week"); rerenderAll(); });

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
      renderDay();
    });

    on(subjectFilter, "change", () => {
      ui.subject = subjectFilter.value;
      saveStorage();
      renderDay();
    });

    on(teacherFilter, "change", () => {
      ui.teacher = teacherFilter.value;
      saveStorage();
      renderDay();
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
      renderDay();
    });

    // drag-drop lane
    on(dayLane, "dragover", onLaneDragOver);
    on(dayLane, "drop", onLaneDrop);
  }

  // ---------------- Boot ----------------
  function init() {
    loadStorage();
    wireEvents();
    rerenderAll();
  }

  // ensure DOM ready even if script moved
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();