<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];
$body   = json_decode(file_get_contents('php://input'), true) ?? [];
parse_str(parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY) ?? '', $query);

$db = getDb();

// Routing
preg_match('#^/api/leaves(?:/(\d+))?(?:/(approve|reject))?$#', $uri, $m);
$id     = isset($m[1]) ? (int)$m[1] : null;
$action = $m[2] ?? null;

// GET /api/leaves
if (!$id && $method === 'GET') {
    $emp    = requireAuth();
    $empId  = isset($query['employeeId']) ? (int)$query['employeeId'] : null;
    $status = $query['status'] ?? null;

    $where  = [];
    $params = [];

    if ($emp['role'] === 'employee') {
        $where[] = 'l.employee_id=?'; $params[] = $emp['id'];
    } elseif ($empId) {
        $where[] = 'l.employee_id=?'; $params[] = $empId;
    }
    if ($status) { $where[] = 'l.status=?'; $params[] = $status; }

    $sql  = "SELECT l.*, e.name AS employee_name FROM leaves l LEFT JOIN employees e ON l.employee_id=e.id";
    if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
    $sql .= ' ORDER BY l.created_at DESC';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    echo json_encode($stmt->fetchAll());

// POST /api/leaves
} elseif (!$id && $method === 'POST') {
    $emp       = requireAuth();
    $leaveType = $body['leave_type'] ?? $body['leaveType'] ?? '';
    $startDate = $body['start_date'] ?? $body['startDate'] ?? '';
    $endDate   = $body['end_date']   ?? $body['endDate']   ?? '';
    $reason    = $body['reason'] ?? null;

    if (!$leaveType || !$startDate || !$endDate) {
        http_response_code(400);
        echo json_encode(['error' => 'نوع الإجازة وتواريخ البداية والنهاية مطلوبة']);
        exit;
    }

    $start = new DateTime($startDate);
    $end   = new DateTime($endDate);
    $days  = (int)$start->diff($end)->days + 1;

    $stmt = $db->prepare("INSERT INTO leaves (employee_id,leave_type,start_date,end_date,days,reason,status) VALUES (?,?,?,?,?,?,'pending') RETURNING *");
    $stmt->execute([$emp['id'], $leaveType, $startDate, $endDate, $days, $reason]);
    $leave = $stmt->fetch();
    $leave['employee_name'] = $emp['name'];

    // Notify all managers and admins
    $mgrs = $db->query("SELECT id FROM employees WHERE role IN ('admin','manager') AND status='active'")->fetchAll();
    $typeLabels = ['annual'=>'سنوية','sick'=>'مرضية','emergency'=>'طارئة','unpaid'=>'بدون راتب'];
    $typeLabel  = $typeLabels[$leaveType] ?? $leaveType;
    $notifStmt  = $db->prepare("INSERT INTO notifications (recipient_id,type,title,message,related_type,related_id) VALUES (?,?,?,?,?,?)");
    foreach ($mgrs as $mgr) {
        if ($mgr['id'] !== $emp['id']) {
            $notifStmt->execute([
                $mgr['id'], 'leave_request',
                "طلب إجازة جديد من {$emp['name']}",
                "طلب إجازة {$typeLabel} من {$startDate} إلى {$endDate} ({$days} أيام)" . ($reason ? " — {$reason}" : ''),
                'leave', $leave['id']
            ]);
        }
    }

    http_response_code(201);
    echo json_encode($leave);

// GET /api/leaves/{id}
} elseif ($id && !$action && $method === 'GET') {
    requireAuth();
    $stmt = $db->prepare("SELECT l.*, e.name AS employee_name FROM leaves l LEFT JOIN employees e ON l.employee_id=e.id WHERE l.id=?");
    $stmt->execute([$id]);
    $leave = $stmt->fetch();
    if (!$leave) { http_response_code(404); echo json_encode(['error' => 'الطلب غير موجود']); exit; }
    echo json_encode($leave);

// POST /api/leaves/{id}/approve
} elseif ($id && $action === 'approve' && $method === 'POST') {
    $reviewer = requireRole('admin', 'manager');
    $stmt = $db->prepare("UPDATE leaves SET status='approved', reviewed_by=? WHERE id=? RETURNING *");
    $stmt->execute([$reviewer['id'], $id]);
    $leave = $stmt->fetch();
    if (!$leave) { http_response_code(404); echo json_encode(['error' => 'الطلب غير موجود']); exit; }
    // Notify the employee
    $db->prepare("INSERT INTO notifications (recipient_id,type,title,message,related_type,related_id) VALUES (?,?,?,?,?,?)")
       ->execute([$leave['employee_id'], 'leave_approved', '✅ تمت الموافقة على إجازتك', "تمت الموافقة على طلب إجازتك من {$leave['start_date']} إلى {$leave['end_date']}", 'leave', $id]);
    echo json_encode($leave);

// POST /api/leaves/{id}/reject
} elseif ($id && $action === 'reject' && $method === 'POST') {
    $reviewer = requireRole('admin', 'manager');
    $note = $body['note'] ?? $body['review_note'] ?? null;
    $stmt = $db->prepare("UPDATE leaves SET status='rejected', reviewed_by=?, review_note=? WHERE id=? RETURNING *");
    $stmt->execute([$reviewer['id'], $note, $id]);
    $leave = $stmt->fetch();
    if (!$leave) { http_response_code(404); echo json_encode(['error' => 'الطلب غير موجود']); exit; }
    // Notify the employee
    $db->prepare("INSERT INTO notifications (recipient_id,type,title,message,related_type,related_id) VALUES (?,?,?,?,?,?)")
       ->execute([$leave['employee_id'], 'leave_rejected', '❌ تم رفض طلب إجازتك', "تم رفض طلب إجازتك من {$leave['start_date']} إلى {$leave['end_date']}" . ($note ? " — {$note}" : ''), 'leave', $id]);
    echo json_encode($leave);

} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
}
