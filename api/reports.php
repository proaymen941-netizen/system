<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];
parse_str(parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY) ?? '', $query);

$db    = getDb();
$today = date('Y-m-d');

// GET /api/reports/dashboard
if ($uri === '/api/reports/dashboard' && $method === 'GET') {
    requireAuth();

    $year  = (int)date('Y');
    $month = (int)date('n');
    $mStart = sprintf('%d-%02d-01', $year, $month);
    $mEnd   = sprintf('%d-%02d-%02d', $year, $month, (int)date('t'));

    $totalEmp     = (int)$db->query("SELECT COUNT(*) FROM employees WHERE status='active'")->fetchColumn();
    $todayPresent = (int)$db->query("SELECT COUNT(*) FROM attendance WHERE date='$today' AND (status='present' OR status='late')")->fetchColumn();
    $todayLate    = (int)$db->query("SELECT COUNT(*) FROM attendance WHERE date='$today' AND status='late'")->fetchColumn();
    $todayAbsent  = max(0, $totalEmp - $todayPresent);
    $pendingLeaves= (int)$db->query("SELECT COUNT(*) FROM leaves WHERE status='pending'")->fetchColumn();
    $pendingOt    = (int)$db->query("SELECT COUNT(*) FROM overtime WHERE status='pending'")->fetchColumn();

    $workDays = max(1, (int)date('j'));
    $expected = $totalEmp * $workDays;
    $actual   = (int)$db->prepare("SELECT COUNT(*) FROM attendance WHERE date>=? AND date<=? AND (status='present' OR status='late')")->execute([$mStart, $mEnd])
                    ?: $db->query("SELECT COUNT(*) FROM attendance WHERE date>='$mStart' AND date<='$mEnd' AND (status='present' OR status='late')")->fetchColumn();
    $stmt = $db->prepare("SELECT COUNT(*) FROM attendance WHERE date>=? AND date<=? AND (status='present' OR status='late')");
    $stmt->execute([$mStart, $mEnd]);
    $actual = (int)$stmt->fetchColumn();
    $rate   = $expected > 0 ? round(($actual / $expected) * 100) : 0;

    echo json_encode([
        'today_present'           => $todayPresent,
        'today_absent'            => $todayAbsent,
        'today_late'              => $todayLate,
        'total_employees'         => $totalEmp,
        'pending_leaves'          => $pendingLeaves,
        'pending_overtime'        => $pendingOt,
        'monthly_attendance_rate' => $rate,
    ]);

// GET /api/reports/daily
} elseif ($uri === '/api/reports/daily' && $method === 'GET') {
    requireAuth();
    $date = $query['date'] ?? '';
    if (!$date) { http_response_code(400); echo json_encode(['error' => 'التاريخ مطلوب']); exit; }

    $totalEmp = (int)$db->query("SELECT COUNT(*) FROM employees WHERE status='active'")->fetchColumn();
    $stmt     = $db->prepare("SELECT a.*, e.name AS employee_name FROM attendance a LEFT JOIN employees e ON a.employee_id=e.id WHERE a.date=?");
    $stmt->execute([$date]);
    $records  = $stmt->fetchAll();

    $present = count(array_filter($records, fn($r) => in_array($r['status'], ['present','late'])));
    $late    = count(array_filter($records, fn($r) => $r['status'] === 'late'));
    $absent  = $totalEmp - $present;

    echo json_encode(['date' => $date, 'total_employees' => $totalEmp, 'present' => $present, 'absent' => $absent, 'late' => $late, 'records' => $records]);

// GET /api/reports/monthly
} elseif ($uri === '/api/reports/monthly' && $method === 'GET') {
    requireAuth();
    $year  = isset($query['year'])  ? (int)$query['year']  : (int)date('Y');
    $month = isset($query['month']) ? (int)$query['month'] : (int)date('n');
    $empId = isset($query['employeeId']) ? (int)$query['employeeId'] : null;

    if (!$year || !$month) { http_response_code(400); echo json_encode(['error' => 'السنة والشهر مطلوبان']); exit; }

    $mStart     = sprintf('%d-%02d-01', $year, $month);
    $mEnd       = sprintf('%d-%02d-%02d', $year, $month, cal_days_in_month(CAL_GREGORIAN, $month, $year));
    $totalDays  = cal_days_in_month(CAL_GREGORIAN, $month, $year);

    $empSql = "SELECT * FROM employees WHERE status='active'";
    $params = [];
    if ($empId) { $empSql .= ' AND id=?'; $params[] = $empId; }
    $empStmt = $db->prepare($empSql);
    $empStmt->execute($params);
    $employees = $empStmt->fetchAll();

    $attStmt = $db->prepare("SELECT * FROM attendance WHERE date>=? AND date<=?");
    $attStmt->execute([$mStart, $mEnd]);
    $attRecords = $attStmt->fetchAll();

    $leaveStmt = $db->prepare("SELECT * FROM leaves WHERE start_date>=? AND end_date<=? AND status='approved'");
    $leaveStmt->execute([$mStart, $mEnd]);
    $leaveRecords = $leaveStmt->fetchAll();

    $otStmt = $db->prepare("SELECT * FROM overtime WHERE date>=? AND date<=? AND status='approved'");
    $otStmt->execute([$mStart, $mEnd]);
    $otRecords = $otStmt->fetchAll();

    $summaries = [];
    foreach ($employees as $emp) {
        $empAtt    = array_filter($attRecords,   fn($r) => (int)$r['employee_id'] === (int)$emp['id']);
        $empLeaves = array_filter($leaveRecords, fn($r) => (int)$r['employee_id'] === (int)$emp['id']);
        $empOt     = array_filter($otRecords,    fn($r) => (int)$r['employee_id'] === (int)$emp['id']);

        $summaries[] = [
            'employee_id'    => $emp['id'],
            'employee_name'  => $emp['name'],
            'present_days'   => count(array_filter($empAtt, fn($r) => in_array($r['status'], ['present','late']))),
            'absent_days'    => count(array_filter($empAtt, fn($r) => $r['status'] === 'absent')),
            'late_days'      => count(array_filter($empAtt, fn($r) => $r['status'] === 'late')),
            'total_hours'    => round(array_sum(array_column(array_values($empAtt), 'total_hours')), 1),
            'leave_days'     => array_sum(array_column(array_values($empLeaves), 'days')),
            'overtime_hours' => array_sum(array_column(array_values($empOt), 'hours')),
        ];
    }

    echo json_encode(['year' => $year, 'month' => $month, 'total_work_days' => $totalDays, 'employee_summaries' => $summaries]);

// GET /api/reports/employee?id=X&year=Y&month=M
} elseif (preg_match('#^/api/reports/employee$#', $uri) && $method === 'GET') {
    $currentUser = requireAuth();
    $empId = isset($query['id']) ? (int)$query['id'] : $currentUser['id'];

    // Only admins/managers can view other employees' statements
    if ($empId !== (int)$currentUser['id'] && $currentUser['role'] === 'employee') {
        http_response_code(403);
        echo json_encode(['error' => 'غير مصرح']);
        exit;
    }

    $year  = isset($query['year'])  ? (int)$query['year']  : (int)date('Y');
    $month = isset($query['month']) ? (int)$query['month'] : (int)date('n');

    // Get employee info
    $empStmt = $db->prepare("SELECT * FROM employees WHERE id=?");
    $empStmt->execute([$empId]);
    $employee = $empStmt->fetch();
    if (!$employee) { http_response_code(404); echo json_encode(['error' => 'الموظف غير موجود']); exit; }

    $mStart = sprintf('%d-%02d-01', $year, $month);
    $mEnd   = sprintf('%d-%02d-%02d', $year, $month, cal_days_in_month(CAL_GREGORIAN, $month, $year));

    // Attendance records with full location data
    $attStmt = $db->prepare("SELECT * FROM attendance WHERE employee_id=? AND date>=? AND date<=? ORDER BY date DESC");
    $attStmt->execute([$empId, $mStart, $mEnd]);
    $attendance = $attStmt->fetchAll();

    // All-time attendance stats
    $statsStmt = $db->prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status IN ('present','late') THEN 1 ELSE 0 END) as present_days, SUM(CASE WHEN status='late' THEN 1 ELSE 0 END) as late_days, SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) as absent_days, COALESCE(SUM(total_hours::numeric), 0) as total_hours FROM attendance WHERE employee_id=? AND date>=? AND date<=?");
    $statsStmt->execute([$empId, $mStart, $mEnd]);
    $stats = $statsStmt->fetch();

    // Leaves this month
    $leavesStmt = $db->prepare("SELECT * FROM leaves WHERE employee_id=? AND start_date>=? AND end_date<=? ORDER BY created_at DESC");
    $leavesStmt->execute([$empId, $mStart, $mEnd]);
    $leaves = $leavesStmt->fetchAll();

    // Overtime this month
    $otStmt = $db->prepare("SELECT * FROM overtime WHERE employee_id=? AND date>=? AND date<=? ORDER BY date DESC");
    $otStmt->execute([$empId, $mStart, $mEnd]);
    $overtime = $otStmt->fetchAll();

    // Approved overtime hours
    $approvedOt = array_sum(array_column(array_filter($overtime, fn($r) => $r['status'] === 'approved'), 'hours'));

    // All-time summary
    $allTimeStmt = $db->prepare("SELECT COUNT(*) as total_days, COALESCE(SUM(total_hours::numeric),0) as all_hours FROM attendance WHERE employee_id=? AND status IN ('present','late')");
    $allTimeStmt->execute([$empId]);
    $allTime = $allTimeStmt->fetch();

    unset($employee['password']);
    echo json_encode([
        'employee'         => $employee,
        'year'             => $year,
        'month'            => $month,
        'period_start'     => $mStart,
        'period_end'       => $mEnd,
        'stats'            => [
            'present_days'    => (int)($stats['present_days'] ?? 0),
            'late_days'       => (int)($stats['late_days'] ?? 0),
            'absent_days'     => (int)($stats['absent_days'] ?? 0),
            'total_hours'     => round((float)($stats['total_hours'] ?? 0), 1),
            'leave_days'      => array_sum(array_column(array_filter($leaves, fn($l) => $l['status'] === 'approved'), 'days')),
            'overtime_hours'  => round((float)$approvedOt, 1),
            'all_time_days'   => (int)($allTime['total_days'] ?? 0),
            'all_time_hours'  => round((float)($allTime['all_hours'] ?? 0), 1),
        ],
        'attendance'       => $attendance,
        'leaves'           => $leaves,
        'overtime'         => $overtime,
    ]);

} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
}
