# دليل رفع نظام إدارة الحضور على InfinityFree

---

## ⚠️ ملاحظة مهمة قبل البدء

InfinityFree يدعم **MySQL** فقط، بينما تطبيقنا يستخدم **PostgreSQL**.
لذلك يجب تعديل التطبيق ليعمل مع MySQL قبل الرفع.
الخطوات الكاملة موضحة أدناه.

---

## المتطلبات

- حساب مجاني على [infinityfree.com](https://infinityfree.com)
- برنامج FTP مثل [FileZilla](https://filezilla-project.org) (مجاني)
- ملفات المشروع `attendance-php/`

---

## الخطوة 1 — إنشاء حساب على InfinityFree

1. اذهب إلى [infinityfree.com](https://infinityfree.com)
2. اضغط **Sign Up** وأنشئ حساباً مجانياً
3. بعد التسجيل، اضغط **Create Account** لإنشاء موقع
4. اختر نطاقاً فرعياً مثل: `attendance.infinityfreeapp.com`
5. احفظ معلومات FTP التي ستظهر:
   - **FTP Hostname** (مثل: `ftpupload.net`)
   - **FTP Username**
   - **FTP Password**
   - **FTP Port**: `21`

---

## الخطوة 2 — إنشاء قاعدة بيانات MySQL

1. في لوحة التحكم (VistaPanel)، اضغط **MySQL Databases**
2. اضغط **Create Database**
3. أدخل اسماً للقاعدة، مثل: `attendance_db`
4. انتبه — الاسم الفعلي سيكون مثل: `epiz_12345678_attendance_db`
5. احفظ البيانات التالية:
   - **اسم قاعدة البيانات** (الاسم الكامل مع البادئة)
   - **اسم المستخدم** (نفس بادئة الحساب)
   - **كلمة المرور**
   - **المضيف**: `sql307.epizy.com` أو ما يظهر في اللوحة

---

## الخطوة 3 — تعديل ملف الاتصال بقاعدة البيانات

افتح الملف `attendance-php/includes/db.php` وعدّله ليستخدم MySQL:

```php
<?php
// بدلاً من PostgreSQL، استخدم MySQL
define('DB_HOST', 'sql307.epizy.com');     // ← ضع المضيف الخاص بك
define('DB_NAME', 'epiz_12345678_attendance_db'); // ← اسم قاعدة البيانات
define('DB_USER', 'epiz_12345678');         // ← اسم المستخدم
define('DB_PASS', 'كلمة_المرور');           // ← كلمة المرور

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'فشل الاتصال بقاعدة البيانات']);
            exit;
        }
    }
    return $pdo;
}
```

---

## الخطوة 4 — إنشاء جداول قاعدة البيانات

في لوحة التحكم، افتح **phpMyAdmin** ثم انسخ والصق SQL التالي:

```sql
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    role ENUM('admin','manager','employee') DEFAULT 'employee',
    department VARCHAR(100),
    position VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    status ENUM('active','inactive') DEFAULT 'active',
    work_location_lat DECIMAL(10,8),
    work_location_lng DECIMAL(11,8),
    work_location_radius INT DEFAULT 500,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    check_in_time DATETIME,
    check_out_time DATETIME,
    check_in_lat DECIMAL(10,8),
    check_in_lng DECIMAL(11,8),
    check_out_lat DECIMAL(10,8),
    check_out_lng DECIMAL(11,8),
    status ENUM('present','absent','late','half_day') DEFAULT 'present',
    total_hours DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS leaves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_type VARCHAR(50),
    start_date DATE,
    end_date DATE,
    days INT,
    reason TEXT,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    reviewed_by INT,
    review_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS overtime (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    date DATE,
    hours DECIMAL(5,2),
    reason TEXT,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    reviewed_by INT,
    review_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    priority ENUM('low','medium','high') DEFAULT 'medium',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES employees(id)
);

-- إدخال البيانات التجريبية
INSERT INTO employees (username, password, name, name_ar, role, department, status) VALUES
('admin',    SHA2(CONCAT('admin123',   'salt_attendance_2024'), 256), 'المسؤول',     'المسؤول',     'admin',    'الإدارة',   'active'),
('manager1', SHA2(CONCAT('manager123', 'salt_attendance_2024'), 256), 'مدير القسم',  'مدير القسم',  'manager',  'المبيعات',  'active'),
('emp001',   SHA2(CONCAT('emp123',     'salt_attendance_2024'), 256), 'أحمد محمد',   'أحمد محمد',   'employee', 'المبيعات',  'active'),
('emp002',   SHA2(CONCAT('emp123',     'salt_attendance_2024'), 256), 'سارة علي',    'سارة علي',    'employee', 'المحاسبة',  'active'),
('emp003',   SHA2(CONCAT('emp123',     'salt_attendance_2024'), 256), 'خالد حسن',    'خالد حسن',    'employee', 'التقنية',   'active');

INSERT INTO announcements (title, content, priority, created_by) VALUES
('مرحباً بكم في نظام الحضور', 'تم تفعيل نظام إدارة الحضور. يرجى تسجيل حضوركم يومياً.', 'high', 1);
```

اضغط **Go** لتنفيذ الاستعلام.

---

## الخطوة 5 — تعديل ملف router.php

افتح `attendance-php/router.php` وتأكد من إزالة أو تعطيل استدعاء `setupDatabase()` (لأننا أنشأنا الجداول يدوياً):

في بداية الملف، غيّر:
```php
setupDatabase();
```
إلى:
```php
// setupDatabase(); // تم إنشاء الجداول يدوياً على InfinityFree
```

---

## الخطوة 6 — رفع الملفات عبر FileZilla (FTP)

### تثبيت FileZilla
1. حمّل FileZilla من [filezilla-project.org](https://filezilla-project.org)
2. ثبّته وافتحه

### الاتصال بالسيرفر
1. افتح **File > Site Manager**
2. اضغط **New Site**
3. أدخل:
   - **Host**: `ftpupload.net` (أو ما حصلت عليه من InfinityFree)
   - **Port**: `21`
   - **Protocol**: FTP
   - **Encryption**: Use explicit FTP over TLS if available
   - **Logon Type**: Normal
   - **User**: اسم مستخدم FTP
   - **Password**: كلمة مرور FTP
4. اضغط **Connect**

### رفع الملفات
1. في الجزء الأيسر (جهازك): انتقل إلى مجلد `attendance-php/`
2. في الجزء الأيمن (السيرفر): انتقل إلى مجلد `htdocs/`
3. حدد كل ملفات ومجلدات `attendance-php/` (Ctrl+A)
4. اسحبها وضعها داخل `htdocs/`
5. انتظر اكتمال الرفع

### الهيكل الصحيح على السيرفر
```
htdocs/
├── router.php
├── index.php
├── includes/
│   ├── db.php
│   └── auth.php
├── api/
│   ├── auth.php
│   ├── attendance.php
│   ├── employees.php
│   ├── leaves.php
│   ├── overtime.php
│   ├── announcements.php
│   └── reports.php
└── assets/
    ├── css/style.css
    └── js/app.js
```

---

## الخطوة 7 — إعداد ملف .htaccess

أنشئ ملف `.htaccess` جديد داخل `htdocs/` بالمحتوى التالي لتوجيه كل الطلبات عبر `router.php`:

```apache
Options -Indexes
RewriteEngine On

# إعادة توجيه API
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^(.*)$ router.php [QSA,L]

# الصفحة الرئيسية
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
```

---

## الخطوة 8 — اختبار الموقع

1. افتح المتصفح واذهب إلى نطاقك:
   `https://attendance.infinityfreeapp.com`

2. يجب أن تظهر شاشة تسجيل الدخول

3. جرّب تسجيل الدخول:
   - **admin** / **admin123**
   - **manager1** / **manager123**
   - **emp001** / **emp123**

---

## حل المشكلات الشائعة

| المشكلة | الحل |
|---|---|
| خطأ 500 Internal Server Error | تحقق من صحة بيانات الاتصال في `db.php` |
| الصفحة لا تظهر | تأكد أن الملفات في مجلد `htdocs/` وليس مجلداً آخر |
| خطأ في قاعدة البيانات | تأكد من تنفيذ SQL في phpMyAdmin وإدخال بيانات الاتصال الصحيحة |
| لا يعمل `router.php` | تأكد من وجود ملف `.htaccess` داخل `htdocs/` |
| خطأ 403 Forbidden | أضف `Options -Indexes` في `.htaccess` |
| جلسة تسجيل الدخول لا تُحفظ | تأكد أن PHP Sessions مفعّلة (تعمل افتراضياً على InfinityFree) |

---

## ملاحظات هامة حول InfinityFree

- الاستضافة مجانية لكن بها قيود على عدد الطلبات يومياً (50,000 طلب/يوم)
- لا يدعم PostgreSQL — فقط MySQL
- مدة الجلسة قد تكون قصيرة، قد تحتاج لتسجيل الدخول بشكل متكرر
- لا يدعم cron jobs في الخطة المجانية
- يمكن ترقية الحساب لإزالة القيود

---

## حسابات الدخول التجريبية

| المستخدم | كلمة المرور | الدور |
|---|---|---|
| admin | admin123 | مسؤول كامل الصلاحيات |
| manager1 | manager123 | مدير (قبول/رفض الطلبات) |
| emp001 | emp123 | موظف |
| emp002 | emp123 | موظف |
| emp003 | emp123 | موظف |
