<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#E53935">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>نظام إدارة الحضور</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>

<!-- ==================== LOGIN SCREEN ==================== -->
<div id="auth-screen">
  <div class="login-wrapper">
    <div class="login-hero">
      <div class="login-logo">
        <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
          <path d="M20 16h24a4 4 0 014 4v24a4 4 0 01-4 4H20a4 4 0 01-4-4V20a4 4 0 014-4z" stroke="white" stroke-width="2.5" fill="none"/>
          <path d="M24 30l6 6 10-10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="32" cy="13" r="3" fill="white"/>
          <path d="M29 13h6" stroke="white" stroke-width="2"/>
        </svg>
      </div>
      <h1 class="login-title">نظام إدارة الحضور</h1>
      <p class="login-subtitle">سجّل دخولك للمتابعة</p>
    </div>
    <div class="login-card">
      <div class="form-group">
        <label class="form-label">اسم المستخدم</label>
        <div class="input-wrapper">
          <span class="input-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </span>
          <input type="text" id="login-username" class="form-input" placeholder="أدخل اسم المستخدم" autocomplete="username">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">كلمة المرور</label>
        <div class="input-wrapper">
          <span class="input-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </span>
          <input type="password" id="login-password" class="form-input" placeholder="أدخل كلمة المرور" autocomplete="current-password">
        </div>
      </div>
      <div id="login-error" class="alert-error hidden"></div>
      <button id="login-btn" class="btn-primary btn-full" onclick="doLogin()">
        <span>تسجيل الدخول</span>
      </button>
      <div class="login-hint">
        <p>للتجربة: admin / admin123</p>
      </div>
    </div>
  </div>
</div>

<!-- ==================== MAIN APP ==================== -->
<div id="main-app" class="hidden">

  <!-- Sidebar (Desktop) -->
  <aside class="sidebar-nav" id="sidebar-nav">
    <div class="sidebar-brand">
      <div class="sidebar-logo-icon">
        <svg width="22" height="22" viewBox="0 0 64 64" fill="none">
          <path d="M20 16h24a4 4 0 014 4v24a4 4 0 01-4 4H20a4 4 0 01-4-4V20a4 4 0 014-4z" stroke="white" stroke-width="2.5" fill="none"/>
          <path d="M24 30l6 6 10-10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="sidebar-brand-name">نظام الحضور</span>
    </div>

    <div class="sidebar-user" id="sidebar-user">
      <div class="sidebar-user-avatar" id="sidebar-avatar">م</div>
      <div class="sidebar-user-info">
        <div class="sidebar-user-name" id="sidebar-name">المستخدم</div>
        <div class="sidebar-user-role" id="sidebar-role">موظف</div>
      </div>
    </div>

    <nav class="sidebar-items">
      <button class="sidebar-item active" data-page="dashboard" onclick="App.navigate('dashboard')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span>لوحة التحكم</span>
      </button>
      <button class="sidebar-item" data-page="attendance" onclick="App.navigate('attendance')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>الحضور والانصراف</span>
      </button>
      <button class="sidebar-item" data-page="leaves" onclick="App.navigate('leaves')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span>الإجازات</span>
      </button>
      <button class="sidebar-item" data-page="overtime" onclick="App.navigate('overtime')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><line x1="22" y1="12" x2="20" y2="12"/></svg>
        <span>الوقت الإضافي</span>
      </button>
      <button class="sidebar-item sidebar-admin-item" data-page="employees" onclick="App.navigate('employees')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span>الموظفون</span>
      </button>
      <button class="sidebar-item" data-page="announcements" onclick="App.navigate('announcements')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span>الإعلانات</span>
      </button>
      <button class="sidebar-item sidebar-admin-item" data-page="reports" onclick="App.navigate('reports')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        <span>التقارير</span>
      </button>
      <button class="sidebar-item" data-page="notifications" onclick="App.navigate('notifications')" style="position:relative">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span>الإشعارات</span>
        <span id="sidebar-notif-badge" class="notif-badge hidden" style="top:6px;left:8px">0</span>
      </button>
      <button class="sidebar-item sidebar-admin-item" data-page="permissions" onclick="App.navigate('permissions')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span>الصلاحيات</span>
      </button>
      <button class="sidebar-item" data-page="profile" onclick="App.navigate('profile')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>الملف الشخصي</span>
      </button>
    </nav>

    <div class="sidebar-footer">
      <button class="sidebar-logout" onclick="App.logout()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        <span>تسجيل الخروج</span>
      </button>
    </div>
  </aside>

  <!-- Top Header -->
  <header class="app-header">
    <div class="header-inner">
      <button class="header-menu-btn" onclick="App.navigate('menu')" aria-label="القائمة">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <h1 id="header-title" class="header-title">لوحة التحكم</h1>
      <div style="display:flex;align-items:center;gap:8px">
        <button class="header-bell" onclick="App.navigate('notifications')" id="header-bell-btn" aria-label="الإشعارات">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span id="notif-badge" class="notif-badge hidden">0</span>
        </button>
        <button class="header-avatar" onclick="App.navigate('profile')" id="user-avatar-btn">
          <span id="user-avatar-letter">م</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Page Content -->
  <main id="page-content" class="page-content">
    <div class="loading-state">
      <div class="spinner"></div>
    </div>
  </main>

  <!-- Bottom Navigation (Mobile) -->
  <nav class="bottom-nav">
    <button class="nav-item active" data-page="dashboard" onclick="App.navigate('dashboard')">
      <span class="nav-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </span>
      <span class="nav-label">الرئيسية</span>
    </button>
    <button class="nav-item" data-page="attendance" onclick="App.navigate('attendance')">
      <span class="nav-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </span>
      <span class="nav-label">الحضور</span>
    </button>
    <button class="nav-item nav-center-btn" data-page="attendance-action" onclick="App.quickCheckin()">
      <span class="nav-center-circle">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </span>
    </button>
    <button class="nav-item" data-page="leaves" onclick="App.navigate('leaves')">
      <span class="nav-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </span>
      <span class="nav-label">الإجازات</span>
    </button>
    <button class="nav-item" data-page="menu" onclick="App.navigate('menu')">
      <span class="nav-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
      </span>
      <span class="nav-label">المزيد</span>
    </button>
  </nav>
</div>

<!-- ==================== MODAL ==================== -->
<div id="modal-overlay" class="modal-overlay hidden" onclick="App.closeModal(event)">
  <div id="modal-box" class="modal-box">
    <div id="modal-content"></div>
  </div>
</div>

<!-- ==================== TOAST ==================== -->
<div id="toast" class="toast hidden"></div>

<script src="/assets/js/app.js"></script>
</body>
</html>
