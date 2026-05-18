<?php
function getDb(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $url = getenv('DATABASE_URL');
    if (!$url) throw new RuntimeException('DATABASE_URL environment variable is not set');

    $parts = parse_url($url);
    $host   = $parts['host'];
    $port   = $parts['port'] ?? 5432;
    $dbname = ltrim($parts['path'] ?? '', '/');
    $user   = $parts['user'] ?? '';
    $pass   = urldecode($parts['pass'] ?? '');

    $pdo = new PDO(
        "pgsql:host=$host;port=$port;dbname=$dbname",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );

    setupDatabase($pdo);
    return $pdo;
}

function setupDatabase(PDO $db): void {
    $db->exec("
        CREATE TABLE IF NOT EXISTS employees (
            id              SERIAL PRIMARY KEY,
            username        TEXT NOT NULL UNIQUE,
            password_hash   TEXT NOT NULL,
            name            TEXT NOT NULL,
            name_ar         TEXT,
            role            TEXT NOT NULL DEFAULT 'employee',
            department      TEXT,
            position        TEXT,
            phone           TEXT,
            email           TEXT,
            status          TEXT NOT NULL DEFAULT 'active',
            work_location_lat    REAL,
            work_location_lng    REAL,
            work_location_radius REAL DEFAULT 500,
            created_at      TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS attendance (
            id              SERIAL PRIMARY KEY,
            employee_id     INTEGER NOT NULL REFERENCES employees(id),
            date            TEXT NOT NULL,
            check_in_time   TIMESTAMP,
            check_out_time  TIMESTAMP,
            check_in_lat    REAL,
            check_in_lng    REAL,
            check_out_lat   REAL,
            check_out_lng   REAL,
            status          TEXT NOT NULL DEFAULT 'present',
            total_hours     REAL,
            notes           TEXT,
            created_at      TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS leaves (
            id              SERIAL PRIMARY KEY,
            employee_id     INTEGER NOT NULL REFERENCES employees(id),
            leave_type      TEXT NOT NULL,
            start_date      TEXT NOT NULL,
            end_date        TEXT NOT NULL,
            days            INTEGER,
            reason          TEXT,
            status          TEXT NOT NULL DEFAULT 'pending',
            reviewed_by     INTEGER,
            review_note     TEXT,
            created_at      TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS overtime (
            id              SERIAL PRIMARY KEY,
            employee_id     INTEGER NOT NULL REFERENCES employees(id),
            date            TEXT NOT NULL,
            hours           REAL NOT NULL,
            reason          TEXT,
            status          TEXT NOT NULL DEFAULT 'pending',
            reviewed_by     INTEGER,
            review_note     TEXT,
            created_at      TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS announcements (
            id              SERIAL PRIMARY KEY,
            title           TEXT NOT NULL,
            content         TEXT NOT NULL,
            priority        TEXT NOT NULL DEFAULT 'normal',
            created_by      INTEGER REFERENCES employees(id),
            created_at      TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id              SERIAL PRIMARY KEY,
            recipient_id    INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            type            TEXT NOT NULL,
            title           TEXT NOT NULL,
            message         TEXT,
            related_type    TEXT,
            related_id      INTEGER,
            is_read         BOOLEAN NOT NULL DEFAULT FALSE,
            created_at      TIMESTAMP NOT NULL DEFAULT NOW()
        );
    ");

    // Seed data if empty
    $count = (int)$db->query("SELECT COUNT(*) FROM employees")->fetchColumn();
    if ($count === 0) {
        $salt       = 'salt_attendance_2024';
        $adminHash  = hash('sha256', 'admin123'   . $salt);
        $mgrHash    = hash('sha256', 'manager123' . $salt);
        $empHash    = hash('sha256', 'emp123'     . $salt);

        $db->prepare("
            INSERT INTO employees (username, password_hash, name, name_ar, role, department, status) VALUES
            ('admin',    :ah, 'المسؤول',    'المسؤول',    'admin',    'الإدارة',   'active'),
            ('manager1', :mh, 'مدير القسم', 'مدير القسم', 'manager',  'المبيعات',  'active'),
            ('emp001',   :eh, 'أحمد محمد',  'أحمد محمد',  'employee', 'المبيعات',  'active'),
            ('emp002',   :eh2,'سارة علي',   'سارة علي',   'employee', 'المحاسبة',  'active'),
            ('emp003',   :eh3,'خالد حسن',   'خالد حسن',   'employee', 'التقنية',   'active')
        ")->execute([':ah' => $adminHash, ':mh' => $mgrHash, ':eh' => $empHash, ':eh2' => $empHash, ':eh3' => $empHash]);

        // Sample announcement
        $db->prepare("
            INSERT INTO announcements (title, content, priority, created_by)
            SELECT 'مرحباً بكم في نظام الحضور', 'تم تفعيل نظام إدارة الحضور. يرجى تسجيل حضوركم يومياً.', 'high', id
            FROM employees WHERE role = 'admin' LIMIT 1
        ")->execute();
    }
}
