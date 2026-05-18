<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];
$body   = json_decode(file_get_contents('php://input'), true) ?? [];
parse_str(parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY) ?? '', $query);

$db = getDb();

preg_match('#^/api/overtime(?:/(\d+))?(?:/(approve|reject))?$#', $uri, $m);
$id     = isset($m[1]) ? (int)$m[1] : null;
$action = $m[2] ?? null;

// GET /api/overtime
if (!$id && $method === 'GET') {
    $emp    = requireAuth();
    $empId  = isset($query['employeeId']) ? (int)$query['employeeId'] : null;
    $status = $query['status'] ?? null;

    $where  = [];
    $params = [];

    if ($emp['role'] === 'employee') {
        $where[] = 'o.employee_id=?'; $params[] = $emp['id'];
    } elseif ($empId) {
        $where[] = 'o.employee_id=?'; $params[] = $empId;
    }
    if ($status) { $where[] = 'o.status=?'; $params[] = $status; }

    $sql  = "SELECT o.*, e.name AS employee_name FROM overtime o LEFT JOIN employees e ON o.employee_id=e.id";
    if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
    $sql .= ' ORDER BY o.created_at DESC';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    echo json_encode($stmt->fetchAll());

// POST /api/overtime
} elseif (!$id && $method === 'POST') {
    $emp    = requireAuth();
    $date   = $body['date']   ?? '';
    $hours  = isset($body['hours']) ? (float)$body['hours'] : 0;
    $reason = $body['reason'] ?? null;

    if (!$date || $hours <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'التاريخ وعدد الساعات مطلوبان']);
        exit;
    }

    $stmt = $db->prepare("INSERT INTO overtime (employee_id,date,hours,reason,status) VALUES (?,?,?,?,'pending') RETURNING *");
    $stmt->execute([$emp['id'], $date, $hours, $reason]);
    $ot = $stmt->fetch();
    $ot['employee_name'] = $emp['name'];

    // Notify all managers and admins
    $mgrs      = $db->query("SELECT id FROM employees WHERE role IN ('admin','manager') AND status='active'")->fetchAll();
    $notifStmt = $db->prepare("INSERT INTO notifications (recipient_id,type,title,message,related_type,related_id) VALUES (?,?,?,?,?,?)");
    foreach ($mgrs as $mgr) {
        if ($mgr['id'] !== $emp['id']) {
            $notifStmt->execute([
                $mgr['id'], 'overtime_request',
                "طلب وقت إضافي من {$emp['name']}",
                "{$hours} ساعة إضافية بتاريخ {$date}" . ($reason ? " — {$reason}" : ''),
                'overtime', $ot['id']
            ]);
        }
    }

    http_response_code(201);
    echo json_encode($ot);

// POST /api/overtime/{id}/approve
} elseif ($id && $action === 'approve' && $method === 'POST') {
    $reviewer = requireRole('admin', 'manager');
    $stmt = $db->prepare("UPDATE overtime SET status='approved', reviewed_by=? WHERE id=? RETURNING *");
    $stmt->execute([$reviewer['id'], $id]);
    $ot = $stmt->fetch();
    if (!$ot) { http_response_code(404); echo json_encode(['error' => 'الطلب غير موجود']); exit; }
    $db->prepare("INSERT INTO notifications (recipient_id,type,title,message,related_type,related_id) VALUES (?,?,?,?,?,?)")
       ->execute([$ot['employee_id'], 'overtime_approved', '✅ تمت الموافقة على وقتك الإضافي', "تمت الموافقة على {$ot['hours']} ساعة إضافية بتاريخ {$ot['date']}", 'overtime', $id]);
    echo json_encode($ot);

// POST /api/overtime/{id}/reject
} elseif ($id && $action === 'reject' && $method === 'POST') {
    $reviewer = requireRole('admin', 'manager');
    $note = $body['note'] ?? null;
    $stmt = $db->prepare("UPDATE overtime SET status='rejected', reviewed_by=?, review_note=? WHERE id=? RETURNING *");
    $stmt->execute([$reviewer['id'], $note, $id]);
    $ot = $stmt->fetch();
    if (!$ot) { http_response_code(404); echo json_encode(['error' => 'الطلب غير موجود']); exit; }
    $db->prepare("INSERT INTO notifications (recipient_id,type,title,message,related_type,related_id) VALUES (?,?,?,?,?,?)")
       ->execute([$ot['employee_id'], 'overtime_rejected', '❌ تم رفض طلب الوقت الإضافي', "{$ot['hours']} ساعة بتاريخ {$ot['date']}" . ($note ? " — {$note}" : ''), 'overtime', $id]);
    echo json_encode($ot);

} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
}
