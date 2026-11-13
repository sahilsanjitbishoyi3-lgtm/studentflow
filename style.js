
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const STORE_KEY = 'studentflow_workspace_v3';

  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const shiftISO = days => {
    const d = new Date();
    d.setDate(d.getDate()+days);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const fmtDate = (iso,opts={day:'numeric',month:'short',year:'numeric'}) => {
    if(!iso) return '—';
    const d = new Date(`${iso}T00:00:00`);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN',opts);
  };

  const escapeHTML = value =>
    String(value??'').replace(/[&<>"']/g,c=>({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[c]));

  const initials = name =>
    String(name||'Student').trim().split(/\s+/).slice(0,2)
      .map(x=>x[0]||'').join('').toUpperCase();

  const palette = [
    '#8069ed','#3daaa8','#b16dd9',
    '#bd8a43','#4c8fc9','#ce6f91'
  ];

  // DEFAULT DEMO DATA
  const defaultData = () => ({
    students: [
      {
        id:'sf-1',
        studentId:'STU-1001',
        name:'Aarav Mehta',
        course:'Computer Science',
        email:'aarav.mehta@example.com',
        phone:'',
        status:'Active',
        joined:shiftISO(-42)
      },
      {
        id:'sf-2',
        studentId:'STU-1002',
        name:'Ananya Das',
        course:'Business Studies',
        email:'ananya.das@example.com',
        phone:'',
        status:'Active',
        joined:shiftISO(-35)
      },
      {
        id:'sf-3',
        studentId:'STU-1003',
        name:'Rohan Patel',
        course:'Computer Science',
        email:'rohan.patel@example.com',
        phone:'',
        status:'Active',
        joined:shiftISO(-28)
      },
      {
        id:'sf-4',
        studentId:'STU-1004',
        name:'Diya Nair',
        course:'Data Analytics',
        email:'diya.nair@example.com',
        phone:'',
        status:'Inactive',
        joined:shiftISO(-18)
      },
      {
        id:'sf-5',
        studentId:'STU-1005',
        name:'Kabir Singh',
        course:'Business Studies',
        email:'kabir.singh@example.com',
        phone:'',
        status:'Active',
        joined:shiftISO(-10)
      },
      {
        id:'sf-6',
        studentId:'STU-1006',
        name:'Meera Rao',
        course:'Data Analytics',
        email:'meera.rao@example.com',
        phone:'',
        status:'Active',
        joined:shiftISO(-4)
      }
    ],

    events: [
      {
        id:'ev-1',
        title:'Project review session',
        date:shiftISO(2),
        category:'Academic',
        description:'Review progress on current student projects.'
      },
      {
        id:'ev-2',
        title:'Monthly class meeting',
        date:shiftISO(5),
        category:'Meeting',
        description:'Discuss upcoming academic activities.'
      },
      {
        id:'ev-3',
        title:'Assignment submission',
        date:shiftISO(9),
        category:'Reminder',
        description:'Final date to submit the assignment.'
      }
    ],

    attendance:{},

    notifications:[
      {
        id:'n-1',
        title:'Welcome to StudentFlow',
        message:'Your workspace is ready. Add students and start organising your records.',
        time:new Date().toISOString(),
        read:false
      }
    ]
  });

  // LOAD SAVED DATA
  let data;

  try {
    const saved = localStorage.getItem(STORE_KEY);
    data = saved ? JSON.parse(saved) : defaultData();

    if(!data || !Array.isArray(data.students) || !Array.isArray(data.events)) {
      data = defaultData();
    }

    data.attendance = data.attendance || {};
    data.notifications = data.notifications || [];
  } catch {
    data = defaultData();
  }

  let attendanceDate = todayISO();
  let selectedCalendarDate = todayISO();
  let calendarMonth = new Date();
  calendarMonth.setDate(1);

  // SAVE DATA
  function save() {
    try {
      localStorage.setItem(STORE_KEY,JSON.stringify(data));
    } catch {
      toast('Could not save. Browser storage may be full.','error');
    }
  }

  // TOAST MESSAGE
  function toast(message,type='success') {
    const node = document.createElement('div');
    node.className = `toast ${type}`;
    node.textContent = message;
    $('toastRegion').appendChild(node);
    setTimeout(()=>node.remove(),3200);
  }

  // NOTIFICATIONS
  function addNotification(title,message) {
    data.notifications.unshift({
      id:`n-${Date.now()}`,
      title,
      message,
      time:new Date().toISOString(),
      read:false
    });

    data.notifications = data.notifications.slice(0,20);
    save();
    renderNotifications();
  }

  function renderNotifications() {
    const items = data.notifications || [];

    $('notificationList').innerHTML = items.length
      ? items.map(n=>`
        <div class="notification-item">
          <span class="notification-symbol">✦</span>
          <div>
            <strong>${escapeHTML(n.title)}</strong>
            <p>${escapeHTML(n.message)}</p>
            <time>${new Date(n.time).toLocaleString('en-IN',{
              day:'numeric',
              month:'short',
              hour:'numeric',
              minute:'2-digit'
            })}</time>
          </div>
        </div>
      `).join('')
      : '<div class="notification-empty">You’re all caught up.</div>';

    $('notificationDot').style.display =
      items.some(n=>!n.read) ? 'block' : 'none';
  }

  // ATTENDANCE HELPERS
  function getAttendance(date=attendanceDate) {
    return data.attendance[date] || {};
  }

  function attendanceCounts(date=attendanceDate) {
    const records = getAttendance(date);
    let present = 0;
    let absent = 0;

    data.students.forEach(s=>{
      if(records[s.id] === 'Present') present++;
      if(records[s.id] === 'Absent') absent++;
    });

    return {
      present,
      absent,
      unmarked:Math.max(0,data.students.length-present-absent),
      total:data.students.length
    };
  }

  function setDonut(el,rate) {
    el.style.background =
      `conic-gradient(var(--cyan) ${rate*3.6}deg,#29344b ${rate*3.6}deg)`;
  }

  // STUDENT DISPLAY HELPERS
  function hash(str) {
    let h = 0;
    for(let i=0;i<str.length;i++) {
      h=((h<<5)-h)+str.charCodeAt(i)|0;
    }
    return h;
  }

  function studentCell(s) {
    const color = palette[Math.abs(hash(s.id))%palette.length];

    return `
      <div class="student-cell">
        <span class="student-avatar"
          style="background:${color}33;color:${color}">
          ${escapeHTML(initials(s.name))}
        </span>
        <span>
          <strong>${escapeHTML(s.name)}</strong>
          <small>${escapeHTML(s.email||'No email added')}</small>
        </span>
      </div>
    `;
  }

  function statusPill(status) {
    return `
      <span class="status-pill ${status==='Active'?'status-active':'status-inactive'}">
        ${escapeHTML(status)}
      </span>
    `;
  }

  // DASHBOARD
  function renderDashboard() {
    const c = attendanceCounts(todayISO());
    const rate = c.total ? Math.round(c.present/c.total*100) : 0;

    $('statStudents').textContent = data.students.length;
    $('statPresent').textContent = c.present;
    $('presentSub').textContent =
      `${c.present} of ${c.total} students marked present`;

    $('statRate').textContent = `${rate}%`;
    $('statEvents').textContent =
      data.events.filter(e=>e.date>=todayISO()).length;

    $('navStudentCount').textContent = data.students.length;

    $('donutPercent').textContent = `${rate}%`;
    setDonut($('attendanceDonut'),rate);

    $('legendPresent').textContent = c.present;
    $('legendAbsent').textContent = c.absent;
    $('legendUnmarked').textContent = c.unmarked;

    const recent = [...data.students]
      .sort((a,b)=>b.joined.localeCompare(a.joined))
      .slice(0,5);

    $('recentStudentsBody').innerHTML = recent.map(s=>`
      <tr>
        <td>${studentCell(s)}</td>
        <td>${escapeHTML(s.course)}</td>
        <td>${statusPill(s.status)}</td>
        <td>${fmtDate(s.joined,{day:'numeric',month:'short'})}</td>
      </tr>
    `).join('');

    $('recentEmpty').hidden = recent.length>0;

    const events = data.events
      .filter(e=>e.date>=todayISO())
      .sort((a,b)=>a.date.localeCompare(b.date))
      .slice(0,3);

    $('upcomingList').innerHTML = events.map(e=>{
      const d = new Date(`${e.date}T00:00:00`);

      return `
        <div class="upcoming-item">
          <div class="event-datebox">
            <strong>${d.getDate()}</strong>
            <small>${d.toLocaleDateString('en-IN',{
              month:'short'
            }).toUpperCase()}</small>
          </div>
          <div>
            <strong>${escapeHTML(e.title)}</strong>
            <small>${escapeHTML(e.category)} · ${fmtDate(e.date)}</small>
          </div>
        </div>
      `;
    }).join('');

    $('eventsEmpty').hidden = events.length>0;
  }

  // STUDENT FILTERS
  function renderCourseFilter() {
    const select = $('courseFilter');
    const current = select.value;

    const courses = [...new Set(
      data.students.map(s=>s.course).filter(Boolean)
    )].sort();

    select.innerHTML =
      '<option value="all">All classes</option>' +
      courses.map(c=>`
        <option value="${escapeHTML(c)}">${escapeHTML(c)}</option>
      `).join('');

    select.value = courses.includes(current) ? current : 'all';
  }

  function filteredStudents() {
    const q = $('studentSearch').value.trim().toLowerCase();
    const course = $('courseFilter').value;
    const status = $('statusFilter').value;

    return data.students.filter(s=>
      (!q || [s.name,s.email,s.studentId,s.course]
        .some(v=>(v||'').toLowerCase().includes(q))) &&
      (course==='all' || s.course===course) &&
      (status==='all' || s.status===status)
    ).sort((a,b)=>a.name.localeCompare(b.name));
  }

  function renderStudents() {
    renderCourseFilter();

    const list = filteredStudents();

    $('directoryCount').textContent = list.length;
    $('directoryMeta').textContent =
      `Showing ${list.length} of ${data.students.length} records`;

    $('studentsTableBody').innerHTML = list.map(s=>`
      <tr>
        <td>${studentCell(s)}</td>
        <td>${escapeHTML(s.studentId)}</td>
        <td>${escapeHTML(s.course)}</td>
        <td>${escapeHTML(s.email||'—')}</td>
        <td>${statusPill(s.status)}</td>
        <td>${fmtDate(s.joined)}</td>
        <td>
          <div class="row-actions">
            <button class="row-action" data-edit-student="${s.id}">Edit</button>
            <button class="row-action delete" data-delete-student="${s.id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

    $('studentsEmpty').hidden = list.length>0;
  }

  // ATTENDANCE PAGE
  function renderAttendance() {
    const c = attendanceCounts(attendanceDate);

    $('attPresent').textContent = c.present;
    $('attAbsent').textContent = c.absent;
    $('attUnmarked').textContent = c.unmarked;
    $('attendanceDate').value = attendanceDate;

    $('attendanceTableBody').innerHTML =
      data.students.slice()
        .sort((a,b)=>a.name.localeCompare(b.name))
        .map(s=>{
          const status = getAttendance()[s.id] || 'Unmarked';

          return `
            <tr>
              <td>${studentCell(s)}</td>
              <td>${escapeHTML(s.studentId)}</td>
              <td>${escapeHTML(s.course)}</td>
              <td>
                <div class="attendance-choice">
                  <button data-attendance="Present"
                    data-student="${s.id}"
                    class="${status==='Present'?'selected-present':''}">
                    ✓ Present
                  </button>
                  <button data-attendance="Absent"
                    data-student="${s.id}"
                    class="${status==='Absent'?'selected-absent':''}">
                    – Absent
                  </button>
                  <button data-attendance="Unmarked"
                    data-student="${s.id}"
                    class="${status==='Unmarked'?'selected-unmarked':''}">
                    Clear
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');

    $('attendanceEmpty').hidden = data.students.length>0;
  }

  // CALENDAR
  function renderCalendar() {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const first = new Date(year,month,1);
    const start = first.getDay();
    const days = new Date(year,month+1,0).getDate();
    const prevDays = new Date(year,month,0).getDate();

    $('monthTitle').textContent =
      calendarMonth.toLocaleDateString('en-IN',{
        month:'long',
        year:'numeric'
      });

    let html = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
      .map(d=>`<div class="calendar-weekday">${d}</div>`)
      .join('');

    for(let i=0;i<42;i++) {
      let date;
      let muted = false;

      if(i<start) {
        date = new Date(year,month-1,prevDays-start+i+1);
        muted = true;
      } else if(i>=start+days) {
        date = new Date(year,month+1,i-start-days+1);
        muted = true;
      } else {
        date = new Date(year,month,i-start+1);
      }

      const iso =
        `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

      const has = data.events.some(e=>e.date===iso);

      html += `
        <button class="calendar-day
          ${muted?'muted':''}
          ${iso===todayISO()?'today':''}
          ${iso===selectedCalendarDate?'selected':''}
          ${has?'has-event':''}"
          data-calendar-date="${iso}">
          ${date.getDate()}
        </button>
      `;
    }

    $('calendarGrid').innerHTML = html;
    renderSelectedDay();
  }

  function renderSelectedDay() {
    const events = data.events
      .filter(e=>e.date===selectedCalendarDate)
      .sort((a,b)=>a.title.localeCompare(b.title));

    $('selectedDayTitle').textContent =
      fmtDate(selectedCalendarDate,{
        weekday:'short',
        day:'numeric',
        month:'long'
      });

    $('selectedDayEvents').innerHTML = events.length
      ? events.map(e=>`
        <article class="selected-event">
          <strong>${escapeHTML(e.title)}</strong>
          <small>${escapeHTML(e.category)} · ${fmtDate(e.date)}</small>
          ${e.description?`<p>${escapeHTML(e.description)}</p>`:''}
          <div class="selected-event-actions">
            <button data-edit-event="${e.id}">Edit</button>
            <button data-delete-event="${e.id}">Delete</button>
          </div>
        </article>
      `).join('')
      : '<div class="calendar-empty">No events for this day.</div>';
  }

  // REPORTS
  function renderReports() {
    const active = data.students.filter(s=>s.status==='Active').length;
    const c = attendanceCounts(attendanceDate);
    const rate = c.total ? Math.round(c.present/c.total*100) : 0;

    $('reportTotal').textContent = data.students.length;
    $('reportActive').textContent = active;
    $('reportEvents').textContent = data.events.length;

    $('reportRate').textContent = `${rate}%`;
    setDonut($('reportDonut'),rate);

    $('reportAttendanceCount').textContent =
      `${c.present} / ${c.total}`;

    $('reportAttendanceDate').textContent = fmtDate(attendanceDate);

    const groups = {};
    data.students.forEach(s=>{
      groups[s.course] = (groups[s.course]||0)+1;
    });

    const entries = Object.entries(groups)
      .sort((a,b)=>b[1]-a[1]);

    $('courseChart').innerHTML = entries.length
      ? entries.map(([name,count])=>`
        <div class="bar-row">
          <span class="bar-label">${escapeHTML(name)}</span>
          <div class="bar-track">
            <div class="bar-fill"
              style="width:${count/data.students.length*100}%"></div>
          </div>
          <span class="bar-value">${count}</span>
        </div>
      `).join('')
      : '<div class="calendar-empty">No course data yet.</div>';
  }

  function renderAll() {
    renderDashboard();
    renderStudents();
    renderAttendance();
    renderCalendar();
    renderReports();
    renderNotifications();
  }

  // PAGE NAVIGATION
  function navigate(page) {
    document.querySelectorAll('.page-view').forEach(v=>{
      v.classList.toggle('active',v.id===`page-${page}`);
    });

    document.querySelectorAll('.nav-link').forEach(b=>{
      b.classList.toggle('active',b.dataset.page===page);
    });

    const labels = {
      dashboard:'Overview',
      students:'Students',
      attendance:'Attendance',
      calendar:'Calendar',
      reports:'Reports'
    };

    $('breadcrumbCurrent').textContent = labels[page] || 'Overview';
    location.hash = page;
  }

  // MODALS
  function openModal(id) {
    $(id).classList.add('open');
    $(id).setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(id) {
    $(id).classList.remove('open');
    $(id).setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  function nextStudentCode() {
    let max = 1000;

    data.students.forEach(s=>{
      const m = (s.studentId||'').match(/(\d+)$/);
      if(m) max = Math.max(max,Number(m[1]));
    });

    return `STU-${max+1}`;
  }

  function openStudentModal(student=null) {
    $('studentForm').reset();
    $('studentRecordId').value = student?.id || '';

    $('studentModalTitle').textContent =
      student ? 'Edit student' : 'Add a student';

    $('studentSubmitBtn').textContent =
      student ? 'Update student' : 'Save student';

    $('studentName').value = student?.name || '';
    $('studentId').value = student?.studentId || nextStudentCode();
    $('studentCourse').value = student?.course || '';
    $('studentEmail').value = student?.email || '';
    $('studentPhone').value = student?.phone || '';
    $('studentStatus').value = student?.status || 'Active';
    $('studentJoinDate').value = student?.joined || todayISO();

    openModal('studentModal');
    setTimeout(()=>$('studentName').focus(),80);
  }

  function deleteStudent(id) {
    const s = data.students.find(x=>x.id===id);

    if(!s || !confirm(`Delete ${s.name}? This cannot be undone.`)) return;

    data.students = data.students.filter(x=>x.id!==id);

    Object.values(data.attendance).forEach(day=>{
      delete day[id];
    });

    save();
    renderAll();
    toast('Student deleted');

    addNotification(
      'Student removed',
      `${s.name} was removed from your directory.`
    );
  }

  function openEventModal(event=null,date=selectedCalendarDate) {
    $('eventForm').reset();
    $('eventRecordId').value = event?.id || '';

    $('eventModalTitle').textContent =
      event ? 'Edit event' : 'Add an event';

    $('eventTitle').value = event?.title || '';
    $('eventDate').value = event?.date || date;
    $('eventCategory').value = event?.category || 'Academic';
    $('eventDescription').value = event?.description || '';

    openModal('eventModal');
    setTimeout(()=>$('eventTitle').focus(),80);
  }

  // EXPORT CSV
  function exportCSV() {
    const rows = [
      ['Student ID','Full Name','Course / Class','Email','Phone','Status','Join Date'],
      ...data.students.map(s=>[
        s.studentId,s.name,s.course,s.email||'',
        s.phone||'',s.status,s.joined
      ])
    ];

    const csv = rows.map(row=>
      row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')
    ).join('\r\n');

    const blob = new Blob(['\ufeff'+csv],{
      type:'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `studentflow-students-${todayISO()}.csv`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
    toast('CSV export downloaded');
  }

  // RESPONSIVE MOBILE NAVIGATION
  document.querySelectorAll('[data-page]').forEach(b=>{
    b.addEventListener('click',()=>navigate(b.dataset.page));
  });

  const menuToggle = $('menuToggle');
  const sidebar = $('sidebar');

  function closeMobileMenu() {
    sidebar.classList.remove('open');
    document.body.classList.remove('mobile-menu-open');
    menuToggle.setAttribute('aria-expanded','false');
  }

  function toggleMobileMenu() {
    const open = sidebar.classList.toggle('open');

    document.body.classList.toggle('mobile-menu-open',open);
    menuToggle.setAttribute('aria-expanded',String(open));
  }

  menuToggle.addEventListener('click',toggleMobileMenu);

  document.querySelectorAll('.nav-link,.tip-card button,[data-page]')
    .forEach(b=>{
      b.addEventListener('click',()=>{
        if(innerWidth<=800) closeMobileMenu();
      });
    });

  document.addEventListener('click',e=>{
    if(
      innerWidth<=800 &&
      sidebar.classList.contains('open') &&
      !sidebar.contains(e.target) &&
      !menuToggle.contains(e.target)
    ) {
      closeMobileMenu();
    }
  });

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape') {
      closeMobileMenu();

      document.querySelectorAll('.modal-backdrop.open')
        .forEach(m=>closeModal(m.id));

      $('notificationPopover').classList.remove('open');
    }
  });

  window.addEventListener('resize',()=>{
    if(innerWidth>800) closeMobileMenu();
  });

  // NOTIFICATION CONTROLS
  $('notificationBtn').addEventListener('click',e=>{
    e.stopPropagation();
    $('notificationPopover').classList.toggle('open');
  });

  document.addEventListener('click',e=>{
    if(
      !$('notificationPopover').contains(e.target) &&
      !$('notificationBtn').contains(e.target)
    ) {
      $('notificationPopover').classList.remove('open');
    }
  });

  $('markReadBtn').addEventListener('click',()=>{
    data.notifications.forEach(n=>n.read=true);
    save();
    renderNotifications();
    toast('Notifications marked as read');
  });

  $('topDate').textContent = new Date().toLocaleDateString('en-IN',{
    weekday:'short',
    day:'numeric',
    month:'short',
    year:'numeric'
  });

  $('footerYear').textContent = new Date().getFullYear();

  // STUDENT CRUD
  ['quickAddBtn','addStudentBtn'].forEach(id=>{
    $(id).addEventListener('click',()=>openStudentModal());
  });

  $('studentForm').addEventListener('submit',e=>{
    e.preventDefault();

    const recordId = $('studentRecordId').value;

    const student = {
      id:recordId || `stu-${Date.now()}`,
      studentId:$('studentId').value.trim(),
      name:$('studentName').value.trim(),
      course:$('studentCourse').value.trim(),
      email:$('studentEmail').value.trim(),
      phone:$('studentPhone').value.trim(),
      status:$('studentStatus').value,
      joined:$('studentJoinDate').value
    };

    if(!student.name || !student.studentId || !student.course || !student.joined) {
      toast('Please complete the required fields','error');
      return;
    }

    if(data.students.some(s=>
      s.studentId.toLowerCase()===student.studentId.toLowerCase() &&
      s.id!==recordId
    )) {
      toast('That student ID is already in use','error');
      $('studentId').focus();
      return;
    }

    if(recordId) {
      const i = data.students.findIndex(s=>s.id===recordId);
      if(i>=0) data.students[i] = student;
    } else {
      data.students.push(student);
    }

    save();
    closeModal('studentModal');
    renderAll();
    toast(recordId?'Student updated':'Student added');

    addNotification(
      recordId?'Student updated':'New student added',
      `${student.name} ${recordId?'was updated':'was added'} in ${student.course}.`
    );
  });

  $('studentsTableBody').addEventListener('click',e=>{
    const edit = e.target.closest('[data-edit-student]');
    const del = e.target.closest('[data-delete-student]');

    if(edit) {
      const s = data.students.find(x=>x.id===edit.dataset.editStudent);
      if(s) openStudentModal(s);
    }

    if(del) deleteStudent(del.dataset.deleteStudent);
  });

  ['studentSearch','courseFilter','statusFilter'].forEach(id=>{
    $(id).addEventListener(
      id==='studentSearch'?'input':'change',
      renderStudents
    );
  });

  ['exportStudentsBtn','reportExportBtn','backupExportBtn'].forEach(id=>{
    $(id).addEventListener('click',exportCSV);
  });

  // ATTENDANCE CONTROLS
  $('attendanceDate').value = attendanceDate;

  $('attendanceDate').addEventListener('change',()=>{
    attendanceDate = $('attendanceDate').value || todayISO();
    renderAttendance();
    renderReports();
  });

  $('attendanceTableBody').addEventListener('click',e=>{
    const b = e.target.closest('[data-attendance]');
    if(!b) return;

    const id = b.dataset.student;
    const value = b.dataset.attendance;

    if(!data.attendance[attendanceDate]) {
      data.attendance[attendanceDate] = {};
    }

    if(value==='Unmarked') {
      delete data.attendance[attendanceDate][id];
    } else {
      data.attendance[attendanceDate][id] = value;
    }

    save();
    renderAttendance();
    renderDashboard();
    renderReports();
  });

  $('markAllPresent').addEventListener('click',()=>{
    if(!data.attendance[attendanceDate]) {
      data.attendance[attendanceDate] = {};
    }

    data.students.forEach(s=>{
      data.attendance[attendanceDate][s.id] = 'Present';
    });

    save();
    renderAll();
    toast('All students marked present');
  });

  $('resetAttendance').addEventListener('click',()=>{
    if(!confirm('Clear all attendance marks for this date?')) return;

    delete data.attendance[attendanceDate];
    save();
    renderAll();
    toast('Attendance reset');
  });

  $('saveAttendanceBtn').addEventListener('click',()=>{
    save();
    toast(`Attendance saved for ${fmtDate(attendanceDate)}`);

    addNotification(
      'Attendance saved',
      `Attendance for ${fmtDate(attendanceDate)} has been saved.`
    );
  });

  // CALENDAR CONTROLS
  $('prevMonth').addEventListener('click',()=>{
    calendarMonth.setMonth(calendarMonth.getMonth()-1);
    renderCalendar();
  });

  $('nextMonth').addEventListener('click',()=>{
    calendarMonth.setMonth(calendarMonth.getMonth()+1);
    renderCalendar();
  });

  $('todayBtn').addEventListener('click',()=>{
    selectedCalendarDate = todayISO();
    calendarMonth = new Date();
    calendarMonth.setDate(1);
    renderCalendar();
  });

  $('calendarGrid').addEventListener('click',e=>{
    const b = e.target.closest('[data-calendar-date]');
    if(!b) return;

    selectedCalendarDate = b.dataset.calendarDate;

    const d = new Date(`${selectedCalendarDate}T00:00:00`);
    calendarMonth = new Date(d.getFullYear(),d.getMonth(),1);

    renderCalendar();
  });

  $('addEventBtn').addEventListener('click',()=>openEventModal());

  $('addEventForDay').addEventListener('click',()=>{
    openEventModal(null,selectedCalendarDate);
  });

  $('eventForm').addEventListener('submit',e=>{
    e.preventDefault();

    const recordId = $('eventRecordId').value;

    const event = {
      id:recordId || `ev-${Date.now()}`,
      title:$('eventTitle').value.trim(),
      date:$('eventDate').value,
      category:$('eventCategory').value,
      description:$('eventDescription').value.trim()
    };

    if(!event.title || !event.date) {
      toast('Please add an event title and date','error');
      return;
    }

    if(recordId) {
      const i = data.events.findIndex(x=>x.id===recordId);
      if(i>=0) data.events[i] = event;
    } else {
      data.events.push(event);
    }

    selectedCalendarDate = event.date;

    const d = new Date(`${event.date}T00:00:00`);
    calendarMonth = new Date(d.getFullYear(),d.getMonth(),1);

    save();
    closeModal('eventModal');
    renderAll();
    toast(recordId?'Event updated':'Event added');

    addNotification(
      recordId?'Event updated':'New calendar event',
      `${event.title} · ${fmtDate(event.date)}`
    );
  });

  $('selectedDayEvents').addEventListener('click',e=>{
    const edit = e.target.closest('[data-edit-event]');
    const del = e.target.closest('[data-delete-event]');

    if(edit) {
      const event = data.events.find(x=>x.id===edit.dataset.editEvent);
      if(event) openEventModal(event);
    }

    if(del) {
      const event = data.events.find(x=>x.id===del.dataset.deleteEvent);

      if(event && confirm(`Delete event “${event.title}”?`)) {
        data.events = data.events.filter(x=>x.id!==event.id);
        save();
        renderAll();
        toast('Event deleted');
      }
    }
  });

  // RESET DEMO DATA
  $('resetDemoBtn').addEventListener('click',()=>{
    if(!confirm('This will replace your current students, events and attendance with the original demo data. Continue?')) return;

    data = defaultData();
    attendanceDate = todayISO();
    selectedCalendarDate = todayISO();
    calendarMonth = new Date();
    calendarMonth.setDate(1);

    save();
    renderAll();
    toast('Demo workspace restored');
  });

  // CLOSE MODALS
  document.querySelectorAll('[data-close]').forEach(b=>{
    b.addEventListener('click',()=>closeModal(b.dataset.close));
  });

  document.querySelectorAll('.modal-backdrop').forEach(backdrop=>{
    backdrop.addEventListener('click',e=>{
      if(e.target===backdrop) closeModal(backdrop.id);
    });
  });

  // START APP
  const initial = (location.hash||'#dashboard').slice(1);

  navigate(
    ['dashboard','students','attendance','calendar','reports'].includes(initial)
      ? initial
      : 'dashboard'
  );

  renderAll();
})();
