'use strict';

// ========================================
// APP STATE
// ========================================
const App = {
  user: null,
  currentPage: null,
  _clockInterval: null,

  // ========================================
  // INIT
  // ========================================
  async init() {
    try {
      this.user = await this.api('GET', '/auth/me');
      this.showApp();
      this.navigate('dashboard');
    } catch {
      this.showLogin();
    }

    // Enter key on login
    document.getElementById('login-password').addEventListener('keydown', e => {
      if (e.key === 'Enter') doLogin();
    });
    document.getElementById('login-username').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('login-password').focus();
    });
  },

  // ========================================
  // API HELPER
  // ========================================
  async api(method, endpoint, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    };
    if (body) opts.body = JSON.stringify(body);
    const res  = await fetch('/api' + endpoint, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'حدث خطأ، حاول مجدداً');
    return data;
  },

  // ========================================
  // AUTH
  // ========================================
  showLogin() {
    document.getElementById('auth-screen').style.display = '';
    document.getElementById('main-app').classList.add('hidden');
    this.stopClock();
  },

  showApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-app').classList.remove('hidden');
    if (this.user) {
      const letter = this.user.name ? this.user.name.charAt(0) : 'م';
      document.getElementById('user-avatar-letter').textContent = letter;
      const sidebarAvatar = document.getElementById('sidebar-avatar');
      const sidebarName   = document.getElementById('sidebar-name');
      const sidebarRole   = document.getElementById('sidebar-role');
      if (sidebarAvatar) sidebarAvatar.textContent = letter;
      if (sidebarName)   sidebarName.textContent   = this.user.name || 'المستخدم';
      const roleMap = { admin: 'مسؤول', manager: 'مدير', employee: 'موظف' };
      if (sidebarRole)   sidebarRole.textContent   = roleMap[this.user.role] || 'موظف';
      const isAdmin = this.user.role === 'admin' || this.user.role === 'manager';
      document.querySelectorAll('.sidebar-admin-item').forEach(el => {
        el.style.display = isAdmin ? '' : 'none';
      });
      // Start notification polling
      this.pollNotifications();
      if (this._notifInterval) clearInterval(this._notifInterval);
      this._notifInterval = setInterval(() => this.pollNotifications(), 30000);
    }
  },

  async pollNotifications() {
    try {
      const data = await this.api('GET', '/notifications?unread=1');
      const count = data.unread_count || 0;
      const badge    = document.getElementById('notif-badge');
      const sbadge   = document.getElementById('sidebar-notif-badge');
      if (badge) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.classList.toggle('hidden', count === 0);
      }
      if (sbadge) {
        sbadge.textContent = count > 99 ? '99+' : count;
        sbadge.classList.toggle('hidden', count === 0);
      }
    } catch {}
  },

  async logout() {
    try { await this.api('POST', '/auth/logout'); } catch {}
    this.user = null;
    this.stopClock();
    this.showLogin();
    this.toast('تم تسجيل الخروج بنجاح', 'success');
  },

  // ========================================
  // NAVIGATION
  // ========================================
  navigate(page) {
    this.currentPage = page;
    this.stopClock();
    this.updateHeader(page);
    this.updateBottomNav(page);
    this.renderPage(page);
    window.scrollTo(0, 0);
  },

  updateHeader(page) {
    const titles = {
      dashboard: 'لوحة التحكم', attendance: 'سجل الحضور',
      leaves: 'الإجازات', overtime: 'الوقت الإضافي',
      employees: 'الموظفون', announcements: 'الإعلانات',
      reports: 'التقارير', profile: 'الملف الشخصي', menu: 'القائمة',
      notifications: 'الإشعارات', permissions: 'الصلاحيات'
    };
    document.getElementById('header-title').textContent = titles[page] || '';
  },

  updateBottomNav(page) {
    document.querySelectorAll('.nav-item, .sidebar-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
  },

  renderPage(page) {
    const el = document.getElementById('page-content');
    el.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
    switch (page) {
      case 'dashboard':     this.renderDashboard(el);     break;
      case 'attendance':    this.renderAttendance(el);    break;
      case 'leaves':        this.renderLeaves(el);        break;
      case 'overtime':      this.renderOvertime(el);      break;
      case 'employees':     this.renderEmployees(el);     break;
      case 'announcements': this.renderAnnouncements(el); break;
      case 'reports':        this.renderReports(el);        break;
      case 'profile':        this.renderProfile(el);        break;
      case 'menu':           this.renderMenu(el);           break;
      case 'notifications':  this.renderNotifications(el);  break;
      case 'permissions':    this.renderPermissions(el);    break;
    }
  },

  // ========================================
  // CLOCK
  // ========================================
  startClock(elId) {
    this.stopClock();
    const update = () => {
      const el = document.getElementById(elId);
      if (!el) { this.stopClock(); return; }
      const now = new Date();
      el.textContent = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    update();
    this._clockInterval = setInterval(update, 1000);
  },
  stopClock() {
    if (this._clockInterval) { clearInterval(this._clockInterval); this._clockInterval = null; }
  },

  // ========================================
  // TOAST
  // ========================================
  toast(msg, type = '') {
    const el = document.getElementById('toast');
    el.className = `toast ${type}`;
    el.innerHTML = (type === 'success' ? '✅ ' : type === 'error' ? '❌ ' : 'ℹ️ ') + msg;
    el.classList.remove('hidden');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.add('hidden'), 3500);
  },

  // ========================================
  // MODAL
  // ========================================
  openModal(html) {
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.remove('hidden');
  },
  closeModal(e) {
    if (!e || e.target === document.getElementById('modal-overlay')) {
      document.getElementById('modal-overlay').classList.add('hidden');
    }
  },

  // ========================================
  // FORMAT HELPERS
  // ========================================
  fmtDate(str) {
    if (!str) return '-';
    return new Date(str).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  },
  fmtTime(str) {
    if (!str) return '-';
    return new Date(str).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  },
  fmtDateTime(str) {
    if (!str) return '-';
    return new Date(str).toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
  statusLabel(s) {
    return { present: 'حاضر', late: 'متأخر', absent: 'غائب', half_day: 'نصف يوم',
             pending: 'قيد الانتظار', approved: 'مقبول', rejected: 'مرفوض' }[s] || s;
  },
  leaveTypeLabel(t) {
    return { annual: 'سنوية', sick: 'مرضية', emergency: 'طارئة', unpaid: 'بدون راتب', other: 'أخرى' }[t] || t;
  },
  roleLabel(r) {
    return { admin: 'مسؤول', manager: 'مدير', employee: 'موظف' }[r] || r;
  },
  priorityLabel(p) {
    return { high: 'عالية', normal: 'عادية', low: 'منخفضة' }[p] || p;
  },

  // ========================================
  // DASHBOARD
  // ========================================
  async renderDashboard(el) {
    try {
      const [stats, todayAtt] = await Promise.all([
        this.api('GET', '/reports/dashboard'),
        this.api('GET', '/attendance/today'),
      ]);

      const now     = new Date();
      const dateStr = now.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const letter  = this.user.name.charAt(0);

      let statusPill = '<span class="status-pill">لم يسجل بعد</span>';
      let actionBtn  = `<div class="checkin-action"><button class="btn-checkin-main" onclick="App.doCheckIn()">⏰ تسجيل الحضور الآن</button></div>`;

      if (todayAtt && todayAtt.check_in_time && !todayAtt.check_out_time) {
        statusPill = `<span class="status-pill present">✅ حاضر منذ ${this.fmtTime(todayAtt.check_in_time)}</span>`;
        actionBtn  = `<div class="checkin-action"><button class="btn-checkout-main" onclick="App.doCheckOut()">🚪 تسجيل الانصراف</button></div>`;
      } else if (todayAtt && todayAtt.check_out_time) {
        statusPill = `<span class="status-pill done">✔ انصرفت - ${todayAtt.total_hours || 0} ساعة</span>`;
        actionBtn  = `<div class="checkin-action"><div class="completed-tag"><span>✅</span><span>أُنجز عملك اليوم بنجاح</span></div></div>`;
      }

      const pendingSection = (this.user.role !== 'employee' && (stats.pending_leaves > 0 || stats.pending_overtime > 0)) ? `
        <div class="section-card">
          <div class="section-card-header"><span class="section-title">⚠️ طلبات تحتاج موافقة</span></div>
          ${stats.pending_leaves > 0 ? `<div class="pending-item" onclick="App.navigate('leaves')"><span class="pending-icon">📅</span><span class="pending-text">${stats.pending_leaves} طلب إجازة معلّق</span><span class="pending-arrow">‹</span></div>` : ''}
          ${stats.pending_overtime > 0 ? `<div class="pending-item" onclick="App.navigate('overtime')"><span class="pending-icon">⏰</span><span class="pending-text">${stats.pending_overtime} طلب وقت إضافي معلّق</span><span class="pending-arrow">‹</span></div>` : ''}
        </div>` : '';

      el.innerHTML = `
        <div class="scroll-content">
          <div class="greeting-card">
            <div class="greeting-top">
              <div>
                <div class="greeting-name">مرحباً، ${this.user.name} 👋</div>
                <div class="greeting-date">${dateStr}</div>
                <div class="attendance-status-bar">${statusPill}</div>
              </div>
              <div class="greeting-avatar-circle">${letter}</div>
            </div>
            ${actionBtn}
          </div>

          <div class="stats-grid">
            <div class="stat-card red">
              <div class="stat-icon-circle">👥</div>
              <div class="stat-info"><div class="stat-value">${stats.today_present}</div><div class="stat-label">حاضرون اليوم</div></div>
            </div>
            <div class="stat-card orange">
              <div class="stat-icon-circle">🏠</div>
              <div class="stat-info"><div class="stat-value">${stats.today_absent}</div><div class="stat-label">غائبون</div></div>
            </div>
            <div class="stat-card yellow">
              <div class="stat-icon-circle">⏱️</div>
              <div class="stat-info"><div class="stat-value">${stats.today_late}</div><div class="stat-label">متأخرون</div></div>
            </div>
            <div class="stat-card blue">
              <div class="stat-icon-circle">📊</div>
              <div class="stat-info"><div class="stat-value">${stats.monthly_attendance_rate}%</div><div class="stat-label">معدل الحضور</div></div>
            </div>
          </div>

          ${pendingSection}

          <div style="padding:12px 16px 0;">
            <div class="section-title">⚡ إجراءات سريعة</div>
            <div class="actions-grid">
              <button class="action-btn" onclick="App.navigate('attendance')"><span class="action-icon">📋</span><span>سجل الحضور</span></button>
              <button class="action-btn" onclick="App.navigate('leaves')"><span class="action-icon">📅</span><span>طلب إجازة</span></button>
              <button class="action-btn" onclick="App.navigate('overtime')"><span class="action-icon">⏰</span><span>وقت إضافي</span></button>
              <button class="action-btn" onclick="App.navigate('announcements')"><span class="action-icon">📢</span><span>الإعلانات</span></button>
              ${this.user.role !== 'employee' ? `<button class="action-btn" onclick="App.navigate('employees')"><span class="action-icon">👤</span><span>الموظفون</span></button>` : ''}
              ${this.user.role !== 'employee' ? `<button class="action-btn" onclick="App.navigate('reports')"><span class="action-icon">📈</span><span>التقارير</span></button>` : ''}
            </div>
          </div>

          <div style="height:16px"></div>
        </div>`;
    } catch (e) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">خطأ في التحميل</div><div class="empty-sub">${e.message}</div></div>`;
    }
  },

  // ========================================
  // ATTENDANCE
  // ========================================
  async renderAttendance(el) {
    try {
      const [todayAtt, history] = await Promise.all([
        this.api('GET', '/attendance/today'),
        this.api('GET', '/attendance'),
      ]);

      const now     = new Date();
      const dateStr = now.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      let actionHtml = '';
      let hoursHtml  = '';

      if (!todayAtt || !todayAtt.check_in_time) {
        actionHtml = `<button class="big-checkin-btn" onclick="App.doCheckIn()">⏰ تسجيل الحضور</button>`;
      } else if (!todayAtt.check_out_time) {
        const cin = this.fmtTime(todayAtt.check_in_time);
        actionHtml = `<button class="big-checkout-btn" onclick="App.doCheckOut()">🚪 تسجيل الانصراف</button>`;
        hoursHtml  = `<div class="hours-box"><div class="hours-item"><div class="hours-val">${cin}</div><div class="hours-lbl">وقت الحضور</div></div><div class="hours-item"><div class="hours-val">-</div><div class="hours-lbl">وقت الانصراف</div></div></div>`;
      } else {
        const cin  = this.fmtTime(todayAtt.check_in_time);
        const cout = this.fmtTime(todayAtt.check_out_time);
        const hrs  = (todayAtt.total_hours || 0).toFixed(1);
        actionHtml = `<div class="checkin-done-display"><span style="font-size:24px">✅</span><span>اكتمل اليوم - ${hrs} ساعة عمل</span></div>`;
        hoursHtml  = `<div class="hours-box"><div class="hours-item"><div class="hours-val">${cin}</div><div class="hours-lbl">وقت الحضور</div></div><div class="hours-item"><div class="hours-val">${cout}</div><div class="hours-lbl">وقت الانصراف</div></div><div class="hours-item"><div class="hours-val">${hrs}</div><div class="hours-lbl">إجمالي الساعات</div></div></div>`;
      }

      const listHtml = history.slice(0, 30).map(r => {
        const hasCinLoc  = r.check_in_lat  && r.check_in_lng;
        const hasCoutLoc = r.check_out_lat && r.check_out_lng;
        const locHtml = hasCinLoc ? `
          <div class="att-loc-row">
            <a class="loc-link" href="https://www.google.com/maps?q=${r.check_in_lat},${r.check_in_lng}" target="_blank">📍 موقع الحضور: ${parseFloat(r.check_in_lat).toFixed(4)}, ${parseFloat(r.check_in_lng).toFixed(4)}</a>
            ${hasCoutLoc ? `<a class="loc-link" href="https://www.google.com/maps?q=${r.check_out_lat},${r.check_out_lng}" target="_blank">📍 موقع الانصراف: ${parseFloat(r.check_out_lat).toFixed(4)}, ${parseFloat(r.check_out_lng).toFixed(4)}</a>` : ''}
          </div>` : '';
        return `
        <div class="att-record-card">
          <div class="list-item" style="border:none;padding:0;margin-bottom:${hasCinLoc?'8px':'0'}">
            <div class="list-avatar small" style="background:${r.status==='present'?'#22C55E':r.status==='late'?'#F59E0B':'#EF4444'}">${r.status==='present'?'✓':r.status==='late'?'⏱':'✗'}</div>
            <div class="list-body">
              <div class="list-name">${this.fmtDate(r.date)}</div>
              <div class="list-sub">${r.check_in_time?'🟢 '+this.fmtTime(r.check_in_time):'—'} ${r.check_out_time?'  🔴 '+this.fmtTime(r.check_out_time):''}</div>
            </div>
            <div class="list-end">
              <span class="badge badge-${r.status}">${this.statusLabel(r.status)}</span>
              ${r.total_hours?`<span style="font-size:11px;color:var(--text-sub)">${(+r.total_hours).toFixed(1)} س</span>`:''}
            </div>
          </div>
          ${locHtml}
        </div>`;
      }).join('') || '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">لا توجد سجلات</div></div>';

      el.innerHTML = `
        <div class="scroll-content">
          <div class="checkin-card">
            <div id="live-clock" class="current-time-display">--:--</div>
            <div class="current-date-display">${dateStr}</div>
            <div class="location-info">📍 الموقع مطلوب للتسجيل</div>
            ${actionHtml}
            ${hoursHtml}
          </div>
          <div class="section-card" style="margin:12px 16px 0">
            <div class="section-card-header"><span class="section-title">السجل الأخير</span></div>
            ${listHtml}
          </div>
          <div style="height:16px"></div>
        </div>`;

      this.startClock('live-clock');
    } catch (e) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">خطأ</div><div class="empty-sub">${e.message}</div></div>`;
    }
  },

  async quickCheckin() {
    const todayAtt = await this.api('GET', '/attendance/today').catch(() => null);
    if (!todayAtt || !todayAtt.check_in_time) await this.doCheckIn();
    else if (!todayAtt.check_out_time) await this.doCheckOut();
    else { this.toast('لقد أكملت يومك بالفعل', ''); }
  },

  async doCheckIn() {
    this.toast('جارٍ تحديد موقعك...', '');
    try {
      const pos = await this.getLocation();
      await this.api('POST', '/attendance/checkin', { latitude: pos.lat, longitude: pos.lng });
      this.toast('تم تسجيل حضورك بنجاح ✅', 'success');
      if (this.currentPage === 'attendance') this.renderPage('attendance');
      else if (this.currentPage === 'dashboard') this.renderPage('dashboard');
    } catch (e) {
      this.toast(e.message, 'error');
    }
  },

  async doCheckOut() {
    this.toast('جارٍ تحديد موقعك...', '');
    try {
      const pos = await this.getLocation();
      const r = await this.api('POST', '/attendance/checkout', { latitude: pos.lat, longitude: pos.lng });
      this.toast(`تم تسجيل انصرافك - ${(r.total_hours || 0).toFixed(1)} ساعة ✅`, 'success');
      if (this.currentPage === 'attendance') this.renderPage('attendance');
      else if (this.currentPage === 'dashboard') this.renderPage('dashboard');
    } catch (e) {
      this.toast(e.message, 'error');
    }
  },

  getLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { resolve({ lat: 24.7136, lng: 46.6753 }); return; }
      navigator.geolocation.getCurrentPosition(
        p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => resolve({ lat: 24.7136, lng: 46.6753 }), // fallback to Riyadh
        { timeout: 8000, enableHighAccuracy: true }
      );
    });
  },

  // ========================================
  // LEAVES
  // ========================================
  async renderLeaves(el) {
    try {
      const leaves = await this.api('GET', '/leaves');
      const canApprove = this.user.role !== 'employee';

      const listHtml = leaves.map(l => `
        <div class="list-item">
          <div class="list-avatar" style="background:${l.status === 'approved' ? '#22C55E' : l.status === 'rejected' ? '#EF4444' : '#F59E0B'}">
            ${l.status === 'approved' ? '✓' : l.status === 'rejected' ? '✗' : '?'}
          </div>
          <div class="list-body">
            <div class="list-name">${l.employee_name || this.user.name}</div>
            <div class="list-sub">${this.leaveTypeLabel(l.leave_type)} | ${l.days} أيام</div>
            <div class="list-sub">${this.fmtDate(l.start_date)} → ${this.fmtDate(l.end_date)}</div>
            ${l.reason ? `<div class="list-sub" style="font-style:italic">${l.reason}</div>` : ''}
          </div>
          <div class="list-end">
            <span class="badge badge-${l.status}">${this.statusLabel(l.status)}</span>
            ${canApprove && l.status === 'pending' ? `
              <div style="display:flex;gap:4px;margin-top:4px">
                <button class="btn-icon" style="background:var(--green-bg);color:var(--green)" onclick="App.approveLeave(${l.id})" title="قبول">✓</button>
                <button class="btn-icon" style="background:var(--red-bg);color:var(--red)" onclick="App.rejectLeave(${l.id})" title="رفض">✗</button>
              </div>` : ''}
          </div>
        </div>`).join('') || '<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-title">لا توجد إجازات</div><div class="empty-sub">اضغط + لتقديم طلب إجازة</div></div>';

      el.innerHTML = `
        <div class="scroll-content">
          <div class="page-hero">
            <h2>الإجازات</h2>
            <p>${leaves.length} طلب إجمالاً</p>
          </div>
          <div class="filter-bar" id="leaves-filter">
            <button class="filter-chip active" onclick="App.filterLeaves('all', this)">الكل</button>
            <button class="filter-chip" onclick="App.filterLeaves('pending', this)">معلّقة</button>
            <button class="filter-chip" onclick="App.filterLeaves('approved', this)">مقبولة</button>
            <button class="filter-chip" onclick="App.filterLeaves('rejected', this)">مرفوضة</button>
          </div>
          <div class="section-card" id="leaves-list">${listHtml}</div>
          <div style="height:16px"></div>
        </div>`;

      // Store leaves data for filtering
      this._leavesData = leaves;
    } catch (e) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">خطأ</div><div class="empty-sub">${e.message}</div></div>`;
    }

    // FAB
    this.addFab('＋', () => this.showLeaveForm());
  },

  addFab(label, fn) {
    document.querySelectorAll('.fab').forEach(b => b.remove());
    const btn = document.createElement('button');
    btn.className = 'fab';
    btn.textContent = label;
    btn.addEventListener('click', fn);
    document.getElementById('main-app').appendChild(btn);
  },
  removeFab() {
    document.querySelectorAll('.fab').forEach(b => b.remove());
  },

  filterLeaves(status, chipEl) {
    document.querySelectorAll('#leaves-filter .filter-chip').forEach(c => c.classList.remove('active'));
    chipEl.classList.add('active');
    const filtered = status === 'all' ? this._leavesData : this._leavesData.filter(l => l.status === status);
    const canApprove = this.user.role !== 'employee';
    const listEl = document.getElementById('leaves-list');
    if (!listEl) return;
    listEl.innerHTML = filtered.map(l => `
      <div class="list-item">
        <div class="list-avatar" style="background:${l.status === 'approved' ? '#22C55E' : l.status === 'rejected' ? '#EF4444' : '#F59E0B'}">
          ${l.status === 'approved' ? '✓' : l.status === 'rejected' ? '✗' : '?'}
        </div>
        <div class="list-body">
          <div class="list-name">${l.employee_name || this.user.name}</div>
          <div class="list-sub">${this.leaveTypeLabel(l.leave_type)} | ${l.days} أيام</div>
          <div class="list-sub">${this.fmtDate(l.start_date)} → ${this.fmtDate(l.end_date)}</div>
          ${l.reason ? `<div class="list-sub" style="font-style:italic">${l.reason}</div>` : ''}
        </div>
        <div class="list-end">
          <span class="badge badge-${l.status}">${this.statusLabel(l.status)}</span>
          ${canApprove && l.status === 'pending' ? `
            <div style="display:flex;gap:4px;margin-top:4px">
              <button class="btn-icon" style="background:var(--green-bg);color:var(--green)" onclick="App.approveLeave(${l.id})">✓</button>
              <button class="btn-icon" style="background:var(--red-bg);color:var(--red)" onclick="App.rejectLeave(${l.id})">✗</button>
            </div>` : ''}
        </div>
      </div>`).join('') || '<div class="empty-state" style="padding:32px"><div class="empty-icon">📅</div><div class="empty-title">لا توجد نتائج</div></div>';
  },

  showLeaveForm() {
    this.openModal(`
      <div class="modal-header">
        <h3>📅 طلب إجازة جديد</h3>
        <button class="modal-close" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body modal-form">
        <div class="form-group">
          <label class="form-label">نوع الإجازة</label>
          <select id="leave-type" class="form-input">
            <option value="annual">سنوية</option>
            <option value="sick">مرضية</option>
            <option value="emergency">طارئة</option>
            <option value="unpaid">بدون راتب</option>
            <option value="other">أخرى</option>
          </select>
        </div>
        <div class="input-row">
          <div class="form-group">
            <label class="form-label">من تاريخ</label>
            <input type="date" id="leave-start" class="form-input" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group">
            <label class="form-label">إلى تاريخ</label>
            <input type="date" id="leave-end" class="form-input" value="${new Date().toISOString().split('T')[0]}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">السبب (اختياري)</label>
          <textarea id="leave-reason" class="form-input" placeholder="أدخل سبب الإجازة..." style="min-height:80px;padding-top:14px;resize:none"></textarea>
        </div>
        <div id="leave-err" class="alert-error hidden"></div>
        <button class="btn-primary btn-full" onclick="App.submitLeave()">تقديم الطلب</button>
      </div>`);
  },

  async submitLeave() {
    const type   = document.getElementById('leave-type').value;
    const start  = document.getElementById('leave-start').value;
    const end    = document.getElementById('leave-end').value;
    const reason = document.getElementById('leave-reason').value.trim();
    const errEl  = document.getElementById('leave-err');

    if (!start || !end || start > end) { errEl.textContent = 'يرجى التحقق من التواريخ'; errEl.classList.remove('hidden'); return; }

    try {
      await this.api('POST', '/leaves', { leave_type: type, start_date: start, end_date: end, reason });
      this.closeModal();
      this.toast('تم تقديم طلب الإجازة بنجاح', 'success');
      this.navigate('leaves');
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.remove('hidden');
    }
  },

  async approveLeave(id) {
    try {
      await this.api('POST', `/leaves/${id}/approve`);
      this.toast('تم قبول الإجازة', 'success');
      this.navigate('leaves');
    } catch (e) { this.toast(e.message, 'error'); }
  },

  async rejectLeave(id) {
    const note = prompt('سبب الرفض (اختياري):') || '';
    try {
      await this.api('POST', `/leaves/${id}/reject`, { note });
      this.toast('تم رفض الإجازة', 'success');
      this.navigate('leaves');
    } catch (e) { this.toast(e.message, 'error'); }
  },

  // ========================================
  // OVERTIME
  // ========================================
  async renderOvertime(el) {
    try {
      const records = await this.api('GET', '/overtime');
      const canApprove = this.user.role !== 'employee';

      const listHtml = records.map(r => `
        <div class="list-item">
          <div class="list-avatar" style="background:${r.status === 'approved' ? '#22C55E' : r.status === 'rejected' ? '#EF4444' : '#F59E0B'}">⏰</div>
          <div class="list-body">
            <div class="list-name">${r.employee_name || this.user.name}</div>
            <div class="list-sub">${this.fmtDate(r.date)} | ${r.hours} ساعة إضافية</div>
            ${r.reason ? `<div class="list-sub" style="font-style:italic">${r.reason}</div>` : ''}
          </div>
          <div class="list-end">
            <span class="badge badge-${r.status}">${this.statusLabel(r.status)}</span>
            ${canApprove && r.status === 'pending' ? `
              <div style="display:flex;gap:4px;margin-top:4px">
                <button class="btn-icon" style="background:var(--green-bg);color:var(--green)" onclick="App.approveOt(${r.id})">✓</button>
                <button class="btn-icon" style="background:var(--red-bg);color:var(--red)" onclick="App.rejectOt(${r.id})">✗</button>
              </div>` : ''}
          </div>
        </div>`).join('') || '<div class="empty-state"><div class="empty-icon">⏰</div><div class="empty-title">لا توجد طلبات</div><div class="empty-sub">اضغط + لتقديم طلب وقت إضافي</div></div>';

      el.innerHTML = `
        <div class="scroll-content">
          <div class="page-hero">
            <h2>الوقت الإضافي</h2>
            <p>${records.length} طلب إجمالاً</p>
          </div>
          <div class="section-card" style="margin:12px 16px 0">${listHtml}</div>
          <div style="height:16px"></div>
        </div>`;
    } catch (e) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">خطأ</div><div class="empty-sub">${e.message}</div></div>`;
    }
    this.addFab('＋', () => this.showOtForm());
  },

  showOtForm() {
    this.openModal(`
      <div class="modal-header">
        <h3>⏰ طلب وقت إضافي</h3>
        <button class="modal-close" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body modal-form">
        <div class="form-group">
          <label class="form-label">التاريخ</label>
          <input type="date" id="ot-date" class="form-input" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label class="form-label">عدد الساعات الإضافية</label>
          <div class="input-wrapper">
            <input type="number" id="ot-hours" class="form-input" placeholder="مثال: 2.5" min="0.5" max="12" step="0.5" style="padding-right:16px">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">السبب</label>
          <textarea id="ot-reason" class="form-input" placeholder="أدخل سبب العمل الإضافي..." style="min-height:80px;padding-top:14px;resize:none"></textarea>
        </div>
        <div id="ot-err" class="alert-error hidden"></div>
        <button class="btn-primary btn-full" onclick="App.submitOt()">تقديم الطلب</button>
      </div>`);
  },

  async submitOt() {
    const date   = document.getElementById('ot-date').value;
    const hours  = parseFloat(document.getElementById('ot-hours').value);
    const reason = document.getElementById('ot-reason').value.trim();
    const errEl  = document.getElementById('ot-err');

    if (!date || !hours || hours <= 0) { errEl.textContent = 'يرجى إدخال التاريخ وعدد الساعات'; errEl.classList.remove('hidden'); return; }

    try {
      await this.api('POST', '/overtime', { date, hours, reason });
      this.closeModal();
      this.toast('تم تقديم طلب الوقت الإضافي', 'success');
      this.navigate('overtime');
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.remove('hidden');
    }
  },

  async approveOt(id) {
    try {
      await this.api('POST', `/overtime/${id}/approve`);
      this.toast('تم قبول الوقت الإضافي', 'success');
      this.navigate('overtime');
    } catch (e) { this.toast(e.message, 'error'); }
  },

  async rejectOt(id) {
    const note = prompt('سبب الرفض (اختياري):') || '';
    try {
      await this.api('POST', `/overtime/${id}/reject`, { note });
      this.toast('تم رفض الطلب', 'success');
      this.navigate('overtime');
    } catch (e) { this.toast(e.message, 'error'); }
  },

  // ========================================
  // EMPLOYEES
  // ========================================
  async renderEmployees(el) {
    if (this.user.role === 'employee') {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔒</div><div class="empty-title">غير مصرح</div><div class="empty-sub">هذه الصفحة للمسؤولين والمديرين فقط</div></div>`;
      return;
    }
    try {
      const employees = await this.api('GET', '/employees');

      const listHtml = employees.map(e => `
        <div class="emp-card" onclick="App.showEmployeeDetail(${JSON.stringify(JSON.stringify(e))})">
          <div class="list-avatar">${e.name.charAt(0)}</div>
          <div class="list-body">
            <div class="list-name">${e.name}</div>
            <div class="list-sub">${e.department || 'بدون قسم'} ${e.position ? '· ' + e.position : ''}</div>
          </div>
          <div class="list-end">
            <span class="badge badge-${e.role}">${this.roleLabel(e.role)}</span>
            <span class="badge ${e.status === 'active' ? 'badge-approved' : 'badge-rejected'}" style="margin-top:4px">${e.status === 'active' ? 'فعّال' : 'معطّل'}</span>
          </div>
        </div>`).join('') || '<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">لا يوجد موظفون</div></div>';

      el.innerHTML = `
        <div class="scroll-content">
          <div class="page-hero">
            <h2>الموظفون</h2>
            <p>${employees.length} موظف في النظام</p>
          </div>
          <div style="padding:12px 16px 0">${listHtml}</div>
          <div style="height:16px"></div>
        </div>`;
    } catch (e) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">خطأ</div><div class="empty-sub">${e.message}</div></div>`;
    }

    if (this.user.role === 'admin') this.addFab('＋', () => this.showAddEmployeeForm());
    else this.removeFab();
  },

  showEmployeeDetail(empJson) {
    const e = JSON.parse(empJson);
    const isAdmin = this.user.role === 'admin';
    this.openModal(`
      <div class="modal-header">
        <h3>👤 ${e.name}</h3>
        <button class="modal-close" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:20px">
          <div class="list-avatar" style="width:64px;height:64px;font-size:26px">${e.name.charAt(0)}</div>
          <div style="font-size:18px;font-weight:700">${e.name}</div>
          <span class="badge badge-${e.role}">${this.roleLabel(e.role)}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${[['اسم المستخدم', e.username], ['القسم', e.department], ['المنصب', e.position], ['الهاتف', e.phone], ['البريد', e.email], ['الحالة', e.status === 'active' ? 'فعّال' : 'معطّل']].map(([k,v]) => v ? `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text-sub)">${k}</span><span style="font-weight:600">${v}</span></div>` : '').join('')}
        </div>
        <button class="btn-primary btn-full" style="margin-top:16px" onclick="App.closeModal();App.renderEmployeeStatement(${e.id},'${e.name}')">
          📋 كشف حساب الموظف
        </button>
        ${isAdmin && e.status === 'active' ? `<button class="btn-danger" style="width:100%;margin-top:10px;height:46px;border-radius:10px" onclick="App.deactivateEmployee(${e.id})">⚠️ تعطيل الحساب</button>` : ''}
      </div>`);
  },

  async deactivateEmployee(id) {
    if (!confirm('هل أنت متأكد من تعطيل هذا الحساب؟')) return;
    try {
      await this.api('DELETE', `/employees/${id}`);
      this.closeModal();
      this.toast('تم تعطيل الحساب', 'success');
      this.navigate('employees');
    } catch (e) { this.toast(e.message, 'error'); }
  },

  showAddEmployeeForm() {
    this.openModal(`
      <div class="modal-header">
        <h3>➕ إضافة موظف جديد</h3>
        <button class="modal-close" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body modal-form">
        <div class="form-group"><label class="form-label">الاسم الكامل *</label><input type="text" id="emp-name" class="form-input" placeholder="اسم الموظف"></div>
        <div class="form-group"><label class="form-label">اسم المستخدم *</label><input type="text" id="emp-username" class="form-input" placeholder="username" dir="ltr"></div>
        <div class="form-group"><label class="form-label">كلمة المرور *</label><input type="password" id="emp-password" class="form-input" placeholder="كلمة المرور"></div>
        <div class="form-group">
          <label class="form-label">الدور الوظيفي *</label>
          <select id="emp-role" class="form-input">
            <option value="employee">موظف</option>
            <option value="manager">مدير</option>
            <option value="admin">مسؤول</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">القسم</label><input type="text" id="emp-dept" class="form-input" placeholder="القسم"></div>
        <div class="form-group"><label class="form-label">المنصب</label><input type="text" id="emp-pos" class="form-input" placeholder="المنصب"></div>
        <div class="form-group"><label class="form-label">رقم الهاتف</label><input type="tel" id="emp-phone" class="form-input" placeholder="05xxxxxxxx" dir="ltr"></div>
        <div id="emp-err" class="alert-error hidden"></div>
        <button class="btn-primary btn-full" onclick="App.submitAddEmployee()">حفظ الموظف</button>
      </div>`);
  },

  async submitAddEmployee() {
    const name     = document.getElementById('emp-name').value.trim();
    const username = document.getElementById('emp-username').value.trim();
    const password = document.getElementById('emp-password').value;
    const role     = document.getElementById('emp-role').value;
    const dept     = document.getElementById('emp-dept').value.trim();
    const pos      = document.getElementById('emp-pos').value.trim();
    const phone    = document.getElementById('emp-phone').value.trim();
    const errEl    = document.getElementById('emp-err');

    if (!name || !username || !password) { errEl.textContent = 'الاسم واسم المستخدم وكلمة المرور مطلوبة'; errEl.classList.remove('hidden'); return; }

    try {
      await this.api('POST', '/employees', { name, username, password, role, department: dept || undefined, position: pos || undefined, phone: phone || undefined });
      this.closeModal();
      this.toast('تم إضافة الموظف بنجاح', 'success');
      this.navigate('employees');
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.remove('hidden');
    }
  },

  // ========================================
  // ANNOUNCEMENTS
  // ========================================
  async renderAnnouncements(el) {
    try {
      const anns = await this.api('GET', '/announcements');
      const canCreate = this.user.role !== 'employee';

      const listHtml = anns.map(a => `
        <div class="ann-card ${a.priority}">
          <div class="ann-card-header">
            <div class="ann-title">${a.title}</div>
            ${canCreate ? `<button class="btn-icon" style="color:var(--red)" onclick="App.deleteAnn(${a.id})">🗑</button>` : ''}
          </div>
          <div class="ann-content">${a.content}</div>
          <div class="ann-footer">
            <div class="ann-meta">بواسطة ${a.created_by_name || 'الإدارة'} · ${this.fmtDate(a.created_at)}</div>
            <span class="badge badge-${a.priority === 'high' ? 'high' : a.priority === 'low' ? 'low' : 'normal'}">${this.priorityLabel(a.priority)}</span>
          </div>
        </div>`).join('') || '<div class="empty-state"><div class="empty-icon">📢</div><div class="empty-title">لا توجد إعلانات</div></div>';

      el.innerHTML = `
        <div class="scroll-content">
          <div class="page-hero">
            <h2>الإعلانات</h2>
            <p>${anns.length} إعلان</p>
          </div>
          <div style="padding:12px 16px 0">${listHtml}</div>
          <div style="height:16px"></div>
        </div>`;
    } catch (e) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">خطأ</div><div class="empty-sub">${e.message}</div></div>`;
    }

    if (this.user.role !== 'employee') this.addFab('＋', () => this.showAnnForm());
    else this.removeFab();
  },

  showAnnForm() {
    this.openModal(`
      <div class="modal-header">
        <h3>📢 إعلان جديد</h3>
        <button class="modal-close" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body modal-form">
        <div class="form-group"><label class="form-label">العنوان *</label><input type="text" id="ann-title" class="form-input" placeholder="عنوان الإعلان"></div>
        <div class="form-group"><label class="form-label">المحتوى *</label><textarea id="ann-content" class="form-input" placeholder="تفاصيل الإعلان..." style="min-height:100px;padding-top:14px;resize:none"></textarea></div>
        <div class="form-group">
          <label class="form-label">الأولوية</label>
          <select id="ann-priority" class="form-input">
            <option value="normal">عادية</option>
            <option value="high">عالية</option>
            <option value="low">منخفضة</option>
          </select>
        </div>
        <div id="ann-err" class="alert-error hidden"></div>
        <button class="btn-primary btn-full" onclick="App.submitAnn()">نشر الإعلان</button>
      </div>`);
  },

  async submitAnn() {
    const title    = document.getElementById('ann-title').value.trim();
    const content  = document.getElementById('ann-content').value.trim();
    const priority = document.getElementById('ann-priority').value;
    const errEl    = document.getElementById('ann-err');
    if (!title || !content) { errEl.textContent = 'العنوان والمحتوى مطلوبان'; errEl.classList.remove('hidden'); return; }
    try {
      await this.api('POST', '/announcements', { title, content, priority });
      this.closeModal();
      this.toast('تم نشر الإعلان', 'success');
      this.navigate('announcements');
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.remove('hidden');
    }
  },

  async deleteAnn(id) {
    if (!confirm('حذف هذا الإعلان؟')) return;
    try {
      await this.api('DELETE', `/announcements/${id}`);
      this.toast('تم حذف الإعلان', 'success');
      this.navigate('announcements');
    } catch (e) { this.toast(e.message, 'error'); }
  },

  // ========================================
  // REPORTS
  // ========================================
  // ========================================
  // EMPLOYEE STATEMENT
  // ========================================
  async renderEmployeeStatement(empId, empName) {
    const el = document.getElementById('page-content');
    const now = new Date();
    this.currentPage = 'statement';
    this.updateBottomNav('');
    document.getElementById('header-title').textContent = 'كشف الحساب';
    this.removeFab();

    el.innerHTML = `
      <div class="scroll-content">
        <div class="stmt-hero">
          <button class="stmt-back-btn" onclick="App.navigate('${this.user.role === 'employee' ? 'profile' : 'employees'}')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            رجوع
          </button>
          <div class="stmt-hero-avatar">${(empName || 'م').charAt(0)}</div>
          <div class="stmt-hero-name">${empName || 'الموظف'}</div>
          <div class="stmt-hero-sub">كشف الحساب الشهري</div>
          <div class="stmt-period-selector">
            <select id="stmt-year" class="stmt-select" onchange="App.reloadStatement(${empId},'${empName}')">
              ${[-2,-1,0,1].map(d => { const y = now.getFullYear()+d; return `<option value="${y}" ${d===0?'selected':''}>${y}</option>`; }).join('')}
            </select>
            <select id="stmt-month" class="stmt-select" onchange="App.reloadStatement(${empId},'${empName}')">
              ${['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'].map((m,i) => `<option value="${i+1}" ${i+1===now.getMonth()+1?'selected':''}>${m}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="stmt-body" style="padding:0 0 24px">
          <div class="loading-state"><div class="spinner"></div></div>
        </div>
      </div>`;

    await this.loadStatementData(empId, empName);
  },

  async reloadStatement(empId, empName) {
    await this.loadStatementData(empId, empName);
  },

  async loadStatementData(empId, empName) {
    const year  = document.getElementById('stmt-year')?.value  || new Date().getFullYear();
    const month = document.getElementById('stmt-month')?.value || (new Date().getMonth()+1);
    const body  = document.getElementById('stmt-body');
    if (!body) return;
    body.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

    try {
      const d = await this.api('GET', `/reports/employee?id=${empId}&year=${year}&month=${month}`);
      const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

      // Stats row
      const statsHtml = `
        <div class="stmt-stats-grid">
          <div class="stmt-stat green"><div class="stmt-stat-val">${d.stats.present_days}</div><div class="stmt-stat-lbl">أيام حضور</div></div>
          <div class="stmt-stat red"><div class="stmt-stat-val">${d.stats.absent_days}</div><div class="stmt-stat-lbl">أيام غياب</div></div>
          <div class="stmt-stat yellow"><div class="stmt-stat-val">${d.stats.late_days}</div><div class="stmt-stat-lbl">أيام تأخر</div></div>
          <div class="stmt-stat blue"><div class="stmt-stat-val">${d.stats.total_hours}</div><div class="stmt-stat-lbl">ساعات العمل</div></div>
          <div class="stmt-stat purple"><div class="stmt-stat-val">${d.stats.leave_days}</div><div class="stmt-stat-lbl">أيام إجازة</div></div>
          <div class="stmt-stat orange"><div class="stmt-stat-val">${d.stats.overtime_hours}</div><div class="stmt-stat-lbl">ساعات إضافية</div></div>
        </div>`;

      // All-time summary
      const allTimeHtml = `
        <div class="section-card">
          <div class="section-title" style="margin-bottom:12px">📊 الإجمالي الكلي للموظف</div>
          <div style="display:flex;gap:16px">
            <div class="stmt-total-box">
              <div class="stmt-total-val">${d.stats.all_time_days}</div>
              <div class="stmt-total-lbl">يوم عمل إجمالي</div>
            </div>
            <div class="stmt-total-box">
              <div class="stmt-total-val">${d.stats.all_time_hours}</div>
              <div class="stmt-total-lbl">ساعة إجمالي</div>
            </div>
          </div>
        </div>`;

      // Attendance records with location
      const attHtml = d.attendance.length ? d.attendance.map(r => {
        const cinLoc  = r.check_in_lat  && r.check_in_lng  ? `<a class="loc-link" href="https://www.google.com/maps?q=${r.check_in_lat},${r.check_in_lng}" target="_blank">📍 موقع الحضور</a>`  : '<span class="loc-none">📍 لا يوجد موقع</span>';
        const coutLoc = r.check_out_lat && r.check_out_lng ? `<a class="loc-link" href="https://www.google.com/maps?q=${r.check_out_lat},${r.check_out_lng}" target="_blank">📍 موقع الانصراف</a>` : '';
        const coords  = r.check_in_lat  ? `<div class="loc-coords">${parseFloat(r.check_in_lat).toFixed(4)}, ${parseFloat(r.check_in_lng).toFixed(4)}</div>` : '';
        return `
          <div class="stmt-att-row">
            <div class="stmt-att-top">
              <div style="display:flex;align-items:center;gap:8px">
                <div class="stmt-att-dot ${r.status}"></div>
                <div>
                  <div class="stmt-att-date">${this.fmtDate(r.date)}</div>
                  <div class="stmt-att-times">
                    ${r.check_in_time  ? '🟢 ' + this.fmtTime(r.check_in_time)  : '—'}
                    ${r.check_out_time ? ' &nbsp;🔴 ' + this.fmtTime(r.check_out_time) : ''}
                    ${r.total_hours    ? ' &nbsp;⏱ ' + (+r.total_hours).toFixed(1) + 'س' : ''}
                  </div>
                </div>
              </div>
              <span class="badge badge-${r.status}">${this.statusLabel(r.status)}</span>
            </div>
            <div class="stmt-att-loc">
              ${cinLoc}
              ${coutLoc}
              ${coords}
            </div>
          </div>`;
      }).join('') : '<div class="empty-state" style="padding:32px 0"><div class="empty-icon">📋</div><div class="empty-title">لا توجد سجلات حضور</div><div class="empty-sub">لهذا الشهر</div></div>';

      // Leaves
      const leavesHtml = d.leaves.length ? d.leaves.map(l => `
        <div class="list-item">
          <div class="list-body">
            <div class="list-name">${this.leaveTypeLabel(l.leave_type)} — ${l.days} ${l.days === 1 ? 'يوم' : 'أيام'}</div>
            <div class="list-sub">${this.fmtDate(l.start_date)} ← ${this.fmtDate(l.end_date)}</div>
            ${l.reason ? `<div class="list-sub">${l.reason}</div>` : ''}
          </div>
          <span class="badge badge-${l.status}">${this.leaveStatusLabel(l.status)}</span>
        </div>`).join('') : '<div style="padding:12px 0;color:var(--text-sub);text-align:center;font-size:13px">لا توجد إجازات هذا الشهر</div>';

      // Overtime
      const otHtml = d.overtime.length ? d.overtime.map(o => `
        <div class="list-item">
          <div class="list-body">
            <div class="list-name">${this.fmtDate(o.date)} — ${o.hours} ساعة</div>
            ${o.reason ? `<div class="list-sub">${o.reason}</div>` : ''}
          </div>
          <span class="badge badge-${o.status}">${this.leaveStatusLabel(o.status)}</span>
        </div>`).join('') : '<div style="padding:12px 0;color:var(--text-sub);text-align:center;font-size:13px">لا يوجد وقت إضافي هذا الشهر</div>';

      body.innerHTML = `
        <div style="padding:0 16px;margin-top:4px">
          <div class="stmt-period-label">📅 ${months[month-1]} ${year} · من ${d.period_start} إلى ${d.period_end}</div>
        </div>
        ${statsHtml}
        ${allTimeHtml}
        <div class="section-card">
          <div class="section-title" style="margin-bottom:12px">🗓 سجل الحضور والمواقع</div>
          ${attHtml}
        </div>
        <div class="section-card">
          <div class="section-title" style="margin-bottom:12px">🌴 الإجازات</div>
          ${leavesHtml}
        </div>
        <div class="section-card">
          <div class="section-title" style="margin-bottom:12px">⏰ الوقت الإضافي</div>
          ${otHtml}
        </div>`;
    } catch(e) {
      body.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">خطأ</div><div class="empty-sub">${e.message}</div></div>`;
    }
  },

  leaveTypeLabel(t) {
    const m = { annual:'إجازة سنوية', sick:'إجازة مرضية', emergency:'إجازة طارئة', unpaid:'إجازة بدون راتب' };
    return m[t] || t || 'إجازة';
  },
  leaveStatusLabel(s) {
    const m = { pending:'قيد الانتظار', approved:'مقبولة', rejected:'مرفوضة' };
    return m[s] || s;
  },

  async renderReports(el) {
    if (this.user.role === 'employee') {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔒</div><div class="empty-title">غير مصرح</div></div>`;
      return;
    }
    this.removeFab();

    el.innerHTML = `
      <div class="scroll-content">
        <div class="page-hero"><h2>التقارير</h2><p>متابعة الحضور والأداء</p></div>
        <div class="report-tabs">
          <button class="tab-btn active" onclick="App.loadDailyReport(this)">يومي</button>
          <button class="tab-btn" onclick="App.loadMonthlyReport(this)">شهري</button>
          <button class="tab-btn" onclick="App.loadLiveReport(this)">مباشر</button>
        </div>
        <div id="report-content" style="padding:12px 16px 0"></div>
        <div style="height:16px"></div>
      </div>`;

    this.loadDailyReport(el.querySelector('.tab-btn.active'));
  },

  async loadDailyReport(btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const rc = document.getElementById('report-content');
    if (!rc) return;
    rc.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:12px;align-items:center">
        <input type="date" id="daily-date" class="form-input" value="${new Date().toISOString().split('T')[0]}" style="flex:1;height:44px">
        <button class="btn-primary" style="height:44px;padding:0 16px;flex-shrink:0" onclick="App.fetchDailyReport()">عرض</button>
      </div>
      <div id="daily-result"></div>`;
    await this.fetchDailyReport();
  },

  async fetchDailyReport() {
    const date = document.getElementById('daily-date')?.value;
    const res  = document.getElementById('daily-result');
    if (!date || !res) return;
    res.innerHTML = '<div class="loading-state" style="padding:32px 0"><div class="spinner"></div></div>';
    try {
      const data = await this.api('GET', `/reports/daily?date=${date}`);
      res.innerHTML = `
        <div class="stats-grid" style="padding:0 0 12px">
          <div class="stat-card green"><div class="stat-icon-circle">✅</div><div class="stat-info"><div class="stat-value">${data.present}</div><div class="stat-label">حاضرون</div></div></div>
          <div class="stat-card red"><div class="stat-icon-circle">❌</div><div class="stat-info"><div class="stat-value">${data.absent}</div><div class="stat-label">غائبون</div></div></div>
          <div class="stat-card yellow"><div class="stat-icon-circle">⏱</div><div class="stat-info"><div class="stat-value">${data.late}</div><div class="stat-label">متأخرون</div></div></div>
          <div class="stat-card blue"><div class="stat-icon-circle">👥</div><div class="stat-info"><div class="stat-value">${data.total_employees}</div><div class="stat-label">الإجمالي</div></div></div>
        </div>
        <div class="section-card">
          <div class="section-title" style="margin-bottom:12px">التفاصيل</div>
          ${data.records.map(r => `
            <div class="list-item">
              <div class="list-avatar small" style="background:${r.status === 'present' ? '#22C55E' : r.status === 'late' ? '#F59E0B' : '#EF4444'}">${r.employee_name?.charAt(0) || '?'}</div>
              <div class="list-body"><div class="list-name">${r.employee_name || '-'}</div><div class="list-sub">${r.check_in_time ? this.fmtTime(r.check_in_time) : 'لا حضور'} ${r.check_out_time ? '← ' + this.fmtTime(r.check_out_time) : ''}</div></div>
              <span class="badge badge-${r.status}">${this.statusLabel(r.status)}</span>
            </div>`).join('') || '<div style="text-align:center;padding:20px;color:var(--text-sub)">لا توجد سجلات لهذا اليوم</div>'}
        </div>`;
    } catch (e) {
      res.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-sub">${e.message}</div></div>`;
    }
  },

  async loadMonthlyReport(btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const rc = document.getElementById('report-content');
    if (!rc) return;
    const now = new Date();
    rc.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:12px;align-items:center;flex-wrap:wrap">
        <select id="rpt-year" class="form-input" style="flex:1;height:44px">
          ${[now.getFullYear()-1, now.getFullYear(), now.getFullYear()+1].map(y => `<option value="${y}" ${y === now.getFullYear() ? 'selected' : ''}>${y}</option>`).join('')}
        </select>
        <select id="rpt-month" class="form-input" style="flex:1;height:44px">
          ${['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'].map((m,i) => `<option value="${i+1}" ${i+1 === now.getMonth()+1 ? 'selected' : ''}>${m}</option>`).join('')}
        </select>
        <button class="btn-primary" style="height:44px;padding:0 16px;flex-shrink:0" onclick="App.fetchMonthlyReport()">عرض</button>
      </div>
      <div id="monthly-result"></div>`;
    await this.fetchMonthlyReport();
  },

  async fetchMonthlyReport() {
    const year  = document.getElementById('rpt-year')?.value;
    const month = document.getElementById('rpt-month')?.value;
    const res   = document.getElementById('monthly-result');
    if (!year || !month || !res) return;
    res.innerHTML = '<div class="loading-state" style="padding:32px 0"><div class="spinner"></div></div>';
    try {
      const data = await this.api('GET', `/reports/monthly?year=${year}&month=${month}`);
      res.innerHTML = `
        <div class="section-card">
          <div class="section-title" style="margin-bottom:12px">ملخص ${data.total_work_days} يوم عمل</div>
          ${data.employee_summaries.map(s => `
            <div class="list-item">
              <div class="list-avatar small">${s.employee_name.charAt(0)}</div>
              <div class="list-body">
                <div class="list-name">${s.employee_name}</div>
                <div class="list-sub">حضور ${s.present_days} | غياب ${s.absent_days} | تأخر ${s.late_days}</div>
                <div class="list-sub">${s.total_hours.toFixed(1)} ساعة ${s.overtime_hours > 0 ? '| إضافي ' + s.overtime_hours + ' س' : ''} ${s.leave_days > 0 ? '| إجازة ' + s.leave_days + ' أيام' : ''}</div>
              </div>
              <div class="list-end"><span class="badge badge-${s.present_days > 0 ? 'approved' : 'rejected'}">${s.present_days} يوم</span></div>
            </div>`).join('') || '<div style="text-align:center;padding:20px;color:var(--text-sub)">لا توجد بيانات</div>'}
        </div>`;
    } catch (e) {
      res.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-sub">${e.message}</div></div>`;
    }
  },

  async loadLiveReport(btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const rc = document.getElementById('report-content');
    if (!rc) return;
    rc.innerHTML = '<div class="loading-state" style="padding:48px 0"><div class="spinner"></div></div>';
    try {
      const data = await this.api('GET', '/attendance/live');
      rc.innerHTML = `
        <div class="section-card">
          <div style="display:flex;gap:12px;margin-bottom:16px">
            <div class="stat-card green" style="flex:1;padding:12px"><div class="stat-icon-circle">✅</div><div class="stat-info"><div class="stat-value">${data.checked_in}</div><div class="stat-label">في العمل الآن</div></div></div>
            <div class="stat-card blue" style="flex:1;padding:12px"><div class="stat-icon-circle">👥</div><div class="stat-info"><div class="stat-value">${data.total}</div><div class="stat-label">إجمالي الموظفين</div></div></div>
          </div>
          <div class="section-title" style="margin-bottom:12px">الحاضرون الآن</div>
          ${data.records.map(r => `
            <div class="list-item">
              <div class="list-avatar small" style="background:#22C55E">${r.employee_name?.charAt(0) || '?'}</div>
              <div class="list-body"><div class="list-name">${r.employee_name || '-'}</div><div class="list-sub">منذ ${this.fmtTime(r.check_in_time)}</div></div>
              <span class="badge badge-present">حاضر</span>
            </div>`).join('') || '<div style="text-align:center;padding:20px;color:var(--text-sub)">لا يوجد أحد في العمل الآن</div>'}
        </div>`;
    } catch (e) {
      rc.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-sub">${e.message}</div></div>`;
    }
  },

  // ========================================
  // PROFILE
  // ========================================
  async renderProfile(el) {
    const u = this.user;
    this.removeFab();
    el.innerHTML = `
      <div class="scroll-content">
        <div class="greeting-card" style="text-align:center;padding:32px 20px">
          <div style="width:80px;height:80px;background:rgba(255,255,255,.25);border:3px solid rgba(255,255,255,.5);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:800;color:white;margin:0 auto 16px">${u.name.charAt(0)}</div>
          <div style="font-size:22px;font-weight:800;color:white">${u.name}</div>
          <div style="font-size:14px;color:rgba(255,255,255,.8);margin-top:4px">${u.username}</div>
          <div style="margin-top:8px">
            <span class="badge" style="background:rgba(255,255,255,.2);color:white;padding:6px 16px">${this.roleLabel(u.role)}</span>
          </div>
        </div>
        <div class="section-card" style="margin-top:12px">
          <div class="section-title" style="margin-bottom:14px">المعلومات الشخصية</div>
          ${[['القسم', u.department], ['المنصب', u.position], ['الهاتف', u.phone], ['البريد الإلكتروني', u.email]].map(([k,v]) => v ? `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text-sub);font-size:14px">${k}</span><span style="font-weight:600;font-size:14px">${v}</span></div>` : '').join('')}
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0"><span style="color:var(--text-sub);font-size:14px">حالة الحساب</span><span class="badge badge-approved">فعّال</span></div>
        </div>
        <div class="section-card" style="margin-top:12px">
          <button class="btn-primary btn-full" onclick="App.renderEmployeeStatement(${u.id},'${u.name}')">
            📋 كشف حسابي الشهري
          </button>
        </div>
        <div class="section-card" style="margin-top:12px">
          <button class="btn-primary btn-full" style="background:var(--red-bg);color:var(--red);box-shadow:none;border:2px solid var(--red)" onclick="App.logout()">
            🚪 تسجيل الخروج
          </button>
        </div>
        <div style="height:16px"></div>
      </div>`;
  },

  // ========================================
  // NOTIFICATIONS PAGE
  // ========================================
  async renderNotifications(el) {
    this.removeFab();
    el.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

    try {
      const data = await this.api('GET', '/notifications');
      const notifs = data.notifications || [];
      const unread = data.unread_count || 0;

      const typeIcon = {
        leave_request: '📅', leave_approved: '✅', leave_rejected: '❌',
        overtime_request: '⏰', overtime_approved: '✅', overtime_rejected: '❌',
        announcement: '📢', late_arrival: '🕐', absence: '🚫'
      };

      const navDest = {
        leave_request: 'leaves', leave_approved: 'leaves', leave_rejected: 'leaves',
        overtime_request: 'overtime', overtime_approved: 'overtime', overtime_rejected: 'overtime',
        announcement: 'announcements'
      };

      const notifHtml = notifs.length ? notifs.map(n => `
        <div class="notif-item ${n.is_read ? 'read' : 'unread'}" onclick="App.openNotif(${n.id},'${navDest[n.type] || 'dashboard'}')">
          <div class="notif-icon-wrap">
            <span class="notif-icon">${typeIcon[n.type] || '🔔'}</span>
            ${!n.is_read ? '<span class="notif-dot"></span>' : ''}
          </div>
          <div class="notif-body">
            <div class="notif-title">${n.title}</div>
            ${n.message ? `<div class="notif-msg">${n.message}</div>` : ''}
            <div class="notif-time">${this.timeAgo(n.created_at)}</div>
          </div>
        </div>`).join('') :
        '<div class="empty-state"><div class="empty-icon">🔔</div><div class="empty-title">لا توجد إشعارات</div><div class="empty-sub">ستظهر هنا عند ورود إشعارات جديدة</div></div>';

      el.innerHTML = `
        <div class="scroll-content">
          ${unread > 0 ? `
          <div style="padding:12px 16px 0;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:13px;color:var(--text-sub)">${unread} إشعار غير مقروء</span>
            <button class="btn-link" onclick="App.markAllRead()">قراءة الكل ✓</button>
          </div>` : ''}
          <div class="notif-list">
            ${notifHtml}
          </div>
        </div>`;
    } catch(e) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">خطأ في تحميل الإشعارات</div></div>`;
    }
  },

  async openNotif(id, dest) {
    try { await this.api('POST', `/notifications/${id}/mark-read`); } catch {}
    this.pollNotifications();
    this.navigate(dest);
  },

  async markAllRead() {
    try {
      await this.api('POST', '/notifications/all/mark-read');
      this.pollNotifications();
      this.navigate('notifications');
      this.toast('تم تحديد جميع الإشعارات كمقروءة', 'success');
    } catch(e) { this.toast(e.message, 'error'); }
  },

  timeAgo(dateStr) {
    const now  = new Date();
    const past = new Date(dateStr);
    const diff = Math.floor((now - past) / 1000);
    if (diff < 60)   return 'الآن';
    if (diff < 3600) return `منذ ${Math.floor(diff/60)} دقيقة`;
    if (diff < 86400)return `منذ ${Math.floor(diff/3600)} ساعة`;
    if (diff < 604800)return `منذ ${Math.floor(diff/86400)} يوم`;
    return past.toLocaleDateString('ar-SA');
  },

  // ========================================
  // PERMISSIONS PAGE
  // ========================================
  async renderPermissions(el) {
    this.removeFab();
    const isAdmin = this.user.role === 'admin';

    let employeesHtml = '';
    if (isAdmin) {
      try {
        const emps = await this.api('GET', '/employees');
        employeesHtml = `
          <div class="section-card">
            <div class="section-title" style="margin-bottom:14px">👥 إدارة أدوار الموظفين</div>
            <div class="perm-emp-list">
              ${emps.map(e => `
                <div class="perm-emp-row">
                  <div style="display:flex;align-items:center;gap:10px;flex:1">
                    <div class="list-avatar small" style="background:var(--grad)">${e.name.charAt(0)}</div>
                    <div>
                      <div style="font-weight:600;font-size:14px">${e.name}</div>
                      <div style="font-size:12px;color:var(--text-sub)">${e.department || ''}</div>
                    </div>
                  </div>
                  <select class="perm-role-select" data-emp-id="${e.id}" onchange="App.changeRole(${e.id},this.value)">
                    <option value="employee" ${e.role==='employee'?'selected':''}>موظف</option>
                    <option value="manager"  ${e.role==='manager' ?'selected':''}>مدير</option>
                    <option value="admin"    ${e.role==='admin'   ?'selected':''}>مسؤول</option>
                  </select>
                </div>`).join('')}
            </div>
          </div>`;
      } catch {}
    }

    const permRows = [
      { perm: 'تسجيل الحضور والانصراف',    emp: true,  mgr: true,  adm: true  },
      { perm: 'تقديم طلب إجازة',           emp: true,  mgr: true,  adm: true  },
      { perm: 'تقديم طلب وقت إضافي',       emp: true,  mgr: true,  adm: true  },
      { perm: 'عرض سجل حضوره الشخصي',     emp: true,  mgr: true,  adm: true  },
      { perm: 'عرض كشف حسابه الشخصي',     emp: true,  mgr: true,  adm: true  },
      { perm: 'قراءة الإعلانات',           emp: true,  mgr: true,  adm: true  },
      { perm: 'عرض قائمة الموظفين',        emp: false, mgr: true,  adm: true  },
      { perm: 'الموافقة على طلبات الإجازة',emp: false, mgr: true,  adm: true  },
      { perm: 'الموافقة على الوقت الإضافي',emp: false, mgr: true,  adm: true  },
      { perm: 'عرض كشف حساب الموظفين',    emp: false, mgr: true,  adm: true  },
      { perm: 'عرض التقارير الشهرية',      emp: false, mgr: true,  adm: true  },
      { perm: 'نشر الإعلانات',             emp: false, mgr: true,  adm: true  },
      { perm: 'استلام إشعارات الطلبات',    emp: false, mgr: true,  adm: true  },
      { perm: 'إضافة موظفين جدد',          emp: false, mgr: false, adm: true  },
      { perm: 'تعطيل حسابات الموظفين',     emp: false, mgr: false, adm: true  },
      { perm: 'تغيير أدوار الموظفين',      emp: false, mgr: false, adm: true  },
      { perm: 'إدارة صلاحيات النظام',      emp: false, mgr: false, adm: true  },
    ];

    const check = v => v
      ? '<span class="perm-yes">✓</span>'
      : '<span class="perm-no">—</span>';

    el.innerHTML = `
      <div class="scroll-content">
        <div class="greeting-card" style="padding:20px;text-align:center">
          <div style="font-size:28px;margin-bottom:8px">🔐</div>
          <div style="font-size:18px;font-weight:800;color:white">نظام الصلاحيات</div>
          <div style="font-size:13px;color:rgba(255,255,255,.8);margin-top:4px">توزيع الأدوار والصلاحيات في النظام</div>
        </div>

        <div class="section-card" style="padding:0;overflow:hidden">
          <table class="perm-table">
            <thead>
              <tr>
                <th class="perm-th-feat">الصلاحية</th>
                <th class="perm-th"><div class="perm-role-head">👤<br>موظف</div></th>
                <th class="perm-th perm-mgr-col"><div class="perm-role-head">🏢<br>مدير</div></th>
                <th class="perm-th perm-adm-col"><div class="perm-role-head">👑<br>مسؤول</div></th>
              </tr>
            </thead>
            <tbody>
              ${permRows.map(r => `
                <tr class="perm-row">
                  <td class="perm-td-feat">${r.perm}</td>
                  <td class="perm-td">${check(r.emp)}</td>
                  <td class="perm-td perm-mgr-col">${check(r.mgr)}</td>
                  <td class="perm-td perm-adm-col">${check(r.adm)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>

        <div class="section-card" style="margin-top:12px">
          <div class="section-title" style="margin-bottom:14px">📋 ملخص الأدوار</div>
          ${[
            { role: 'employee', icon: '👤', label: 'موظف', color: '#DBEAFE', desc: 'يمكنه تسجيل حضوره وانصرافه، تقديم طلبات الإجازة والوقت الإضافي، ومتابعة كشف حسابه الشخصي.' },
            { role: 'manager',  icon: '🏢', label: 'مدير',  color: '#DCFCE7', desc: 'يتمتع بجميع صلاحيات الموظف، بالإضافة إلى الموافقة على الطلبات، عرض كشوف الحساب، نشر الإعلانات، واستلام الإشعارات تلقائياً.' },
            { role: 'admin',    icon: '👑', label: 'مسؤول', color: '#FEF3C7', desc: 'يتمتع بجميع الصلاحيات بما فيها إضافة وتعطيل الموظفين وتغيير أدوارهم وإدارة النظام بالكامل.' },
          ].map(r => `
            <div style="display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--border)">
              <div style="width:44px;height:44px;background:${r.color};border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${r.icon}</div>
              <div>
                <div style="font-weight:700;font-size:15px;margin-bottom:4px">${r.label}</div>
                <div style="font-size:13px;color:var(--text-sub);line-height:1.5">${r.desc}</div>
              </div>
            </div>`).join('')}
        </div>

        ${employeesHtml}
        <div style="height:16px"></div>
      </div>`;
  },

  async changeRole(empId, newRole) {
    try {
      await this.api('PATCH', `/employees/${empId}`, { role: newRole });
      this.toast(`تم تغيير الدور إلى ${this.roleLabel(newRole)} بنجاح`, 'success');
      this.pollNotifications();
    } catch(e) {
      this.toast(e.message, 'error');
      this.navigate('permissions');
    }
  },

  // ========================================
  // MENU PAGE
  // ========================================
  renderMenu(el) {
    this.removeFab();
    const u = this.user;
    const isAdminOrMgr = u.role !== 'employee';
    const isAdmin = u.role === 'admin';

    const menuItems = [
      { icon: '🏠', label: 'لوحة التحكم',     page: 'dashboard',     color: '#DBEAFE', always: true },
      { icon: '📋', label: 'سجل الحضور',      page: 'attendance',    color: '#DCFCE7', always: true },
      { icon: '📅', label: 'الإجازات',         page: 'leaves',        color: '#FEF3C7', always: true },
      { icon: '⏰', label: 'الوقت الإضافي',   page: 'overtime',      color: '#EDE9FE', always: true },
      { icon: '👥', label: 'الموظفون',         page: 'employees',     color: '#FFE4E6', admin: true  },
      { icon: '📢', label: 'الإعلانات',        page: 'announcements', color: '#DBEAFE', always: true },
      { icon: '📈', label: 'التقارير',         page: 'reports',       color: '#DCFCE7', admin: true  },
      { icon: '🔔', label: 'الإشعارات',        page: 'notifications', color: '#FEF3C7', always: true },
      { icon: '🔐', label: 'الصلاحيات',        page: 'permissions',   color: '#FFF7ED', admin: true  },
      { icon: '👤', label: 'ملفي الشخصي',     page: 'profile',       color: '#F3E8FF', always: true },
    ].filter(item => item.always || (item.admin && isAdminOrMgr));

    el.innerHTML = `
      <div class="scroll-content">
        <div class="menu-user-card">
          <div class="menu-user-avatar">${u.name.charAt(0)}</div>
          <div>
            <div class="menu-user-name">${u.name}</div>
            <div class="menu-user-role">${this.roleLabel(u.role)}</div>
            <div class="menu-user-dept">${u.department || ''}</div>
          </div>
        </div>
        <div class="menu-list">
          ${menuItems.map(item => `
            <div class="menu-list-item" onclick="App.navigate('${item.page}')">
              <div class="menu-item-icon" style="background:${item.color}">${item.icon}</div>
              <div class="menu-item-text">${item.label}</div>
              <span class="menu-arrow">‹</span>
            </div>
          `).join('')}
          <div class="menu-divider"></div>
          <div class="menu-list-item" onclick="App.logout()" style="color:var(--red)">
            <div class="menu-item-icon" style="background:var(--red-bg)">🚪</div>
            <div class="menu-item-text" style="color:var(--red)">تسجيل الخروج</div>
          </div>
        </div>
        <div style="height:16px"></div>
      </div>`;
  },
};

// ========================================
// LOGIN HANDLER (global)
// ========================================
async function doLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const btn      = document.getElementById('login-btn');
  const errEl    = document.getElementById('login-error');

  errEl.classList.add('hidden');
  if (!username || !password) {
    errEl.textContent = 'يرجى إدخال اسم المستخدم وكلمة المرور';
    errEl.classList.remove('hidden');
    return;
  }

  btn.innerHTML = '<span>جارٍ الدخول...</span>';
  btn.disabled  = true;

  try {
    const { employee } = await App.api('POST', '/auth/login', { username, password });
    App.user = employee;
    App.showApp();
    App.navigate('dashboard');
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.remove('hidden');
  } finally {
    btn.innerHTML = '<span>تسجيل الدخول</span>';
    btn.disabled  = false;
  }
}

// ========================================
// BOOTSTRAP
// ========================================
window.addEventListener('DOMContentLoaded', () => App.init());
