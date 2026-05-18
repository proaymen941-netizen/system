<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];
$body   = json_decode(file_get_contents('php://input'), true) ?? [];
parse_str(parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY) ?? '', $query);

$db    = getDb();
$today = date('Y-m-d');

// POST /api/attendance/checkin
if ($uri === '/api/attendance/checkin' && $method === 'POST') {
    $emp   = requireAuth();
    $lat   = isset($body['latitude'])  ? (float)$body['latitude']  : null;
    $lng   = isset($body['longitude']) ? (float)$body['longitude'] : null;
    $notes = $body['notes'] ?? null;

    $stmt = $db->prepare("SELECT * FROM attendance WHERE employee_id = ? AND date = ?");
    $stmt->execute([$emp['id'], $today]);
    $existing = $stmt->fetch();

    if ($existing && $existing['check_in_time']) {
        http_response_code(400);
        echo json_encode(['error' => 'لقد قمت بتسجيل الحضور بالفعل اليوم']);
        exit;
    }

    $hour   = (int)date('H');
    $status = $hour >= 9 ? 'late' : 'present';
    $now    = date('Y-m-d H:i:s');

    if ($existing) {
        $stmt = $db->prepare("UPDATE attendance SET check_in_time=?, check_in_lat=?, check_in_lng=?, status=?, notes=? WHERE id=? RETURNING *");
        $stmt->execute([$now, $lat, $lng, $status, $notes, $existing['id']]);
    } else {
        $stmt = $db->prepare("INSERT INTO attendance (employee_id,date,check_in_time,check_in_lat,check_in_lng,status,notes) VALUES (?,?,?,?,?,?,?) RETURNING *");
        $stmt->execute([$emp['id'], $today, $now, $lat, $lng, $status, $notes]);
    }

    $record = $stmt->fetch();
    $record['employee_name'] = $emp['name'];
    http_response_code(201);
    echo json_encode($record);

// POST /api/attendance/checkout
} elseif ($uri === '/api/attendance/checkout' && $method === 'POST') {
    $emp   = requireAuth();
    $lat   = isset($body['latitude'])  ? (float)$body['latitude']  : null;
    $lng   = isset($body['longitude']) ? (float)$body['longitude'] : null;
    $notes = $body['notes'] ?? null;

    $stmt = $db->prepare("SELECT * FROM attendance WHERE employee_id = ? AND date = ?");
    $stmt->execute([$emp['id'], $today]);
    $record = $stmt->fetch();

    if (!$record || !$record['check_in_time']) {
        http_response_code(400);
        echo json_encode(['error' => 'لم تقم بتسجيل الحضور بعد']);
        exit;
    }
    if ($record['check_out_time']) {
        http_response_code(400);
        echo json_encode(['error' => 'لقد قمت بتسجيل الانصراف بالفعل']);
        exit;
    }

    $now        = new DateTime();
    $checkIn    = new DateTime($record['check_in_time']);
    $totalHours = round(($now->getTimestamp() - $checkIn->getTimestamp()) / 3600, 2);
    $nowStr     = $now->format('Y-m-d H:i:s');

    $stmt = $db->prepare("UPDATE attendance SET check_out_time=?, check_out_lat=?, check_out_lng=?, total_hours=?, notes=COALESCE(?,notes) WHERE id=? RETURNING *");
    $stmt->execute([$nowStr, $lat, $lng, $totalHours, $notes, $record['id']]);
    $updated = $stmt->fetch();
    $updated['employee_name'] = $emp['name'];
    echo json_encode($updated);

// GET /api/attendance/today
} elseif ($uri === '/api/attendance/today' && $method === 'GET') {
    $emp  = requireAuth();
    $stmt = $db->prepare("SELECT a.*, e.name AS employee_name FROM attendance a LEFT JOIN employees e ON a.employee_id=e.id WHERE a.employee_id=? AND a.date=?");
    $stmt->execute([$emp['id'], $today]);
    $record = $stmt->fetch();
    echo json_encode($record ?: null);

// GET /api/attendance/live
} elseif ($uri === '/api/attendance/live' && $method === 'GET') {
    requireAuth();
    $stmt      = $db->prepare("SELECT a.*, e.name AS employee_name FROM attendance a LEFT JOIN employees e ON a.employee_id=e.id WHERE a.date=? AND a.check_in_time IS NOT NULL AND a.check_out_time IS NULL");
    $stmt->execute([$today]);
    $checkedIn = $stmt->fetchAll();
    $total     = (int)$db->query("SELECT COUNT(*) FROM employees WHERE status='active'")->fetchColumn();
    echo json_encode(['checked_in' => count($checkedIn), 'total' => $total, 'records' => $checkedIn]);

// GET /api/attendance
} elseif ($uri === '/api/attendance' && $method === 'GET') {
    $emp      = requireAuth();
    $empId    = isset($query['employeeId']) ? (int)$query['employeeId'] : null;
    $date     = $query['date']      ?? null;
    $startDate= $query['startDate'] ?? null;
    $endDate  = $query['endDate']   ?? null;

    $targetId = $empId ?? ($emp['role'] === 'employee' ? $emp['id'] : null);

    $where  = [];
    $params = [];
    if ($targetId)  { $where[] = 'a.employee_id=?'; $params[] = $targetId; }
    if ($date)      { $where[] = 'a.date=?';         $params[] = $date; }
    if ($startDate) { $where[] = 'a.date>=?';        $params[] = $startDate; }
    if ($endDate)   { $where[] = 'a.date<=?';        $params[] = $endDate; }

    $sql  = "SELECT a.*, e.name AS employee_name FROM attendance a LEFT JOIN employees e ON a.employee_id=e.id";
    if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
    $sql .= ' ORDER BY a.date DESC, a.check_in_time DESC LIMIT 200';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    echo json_encode($stmt->fetchAll());

} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
}
