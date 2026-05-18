<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];
$body   = json_decode(file_get_contents('php://input'), true) ?? [];
parse_str(parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY) ?? '', $query);

$db = getDb();

// Extract ID from path: /api/employees/{id}
preg_match('#^/api/employees(?:/(\d+))?$#', $uri, $m);
$id = isset($m[1]) ? (int)$m[1] : null;

// GET /api/employees
if (!$id && $method === 'GET') {
    requireRole('admin', 'manager');
    $dept   = $query['department'] ?? null;
    $status = $query['status']     ?? null;
    $search = $query['search']     ?? null;

    $where = [];
    $params = [];
    if ($dept)   { $where[] = 'department=?'; $params[] = $dept; }
    if ($status) { $where[] = 'status=?';     $params[] = $status; }
    if ($search) { $where[] = "(name ILIKE ? OR username ILIKE ? OR name_ar ILIKE ?)"; $params[] = "%$search%"; $params[] = "%$search%"; $params[] = "%$search%"; }

    $sql  = "SELECT * FROM employees";
    if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
    $sql .= ' ORDER BY created_at DESC';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    echo json_encode(array_map('safeEmp', $stmt->fetchAll()));

// POST /api/employees
} elseif (!$id && $method === 'POST') {
    requireRole('admin');
    $password = $body['password'] ?? '';
    if (!$password) { http_response_code(400); echo json_encode(['error' => 'كلمة المرور مطلوبة']); exit; }

    $fields = ['username','name','name_ar','role','department','position','phone','email','work_location_lat','work_location_lng','work_location_radius'];
    $insert = [];
    foreach ($fields as $f) if (isset($body[$f])) $insert[$f] = $body[$f];
    $insert['password_hash'] = hashPassword($password);

    $cols  = implode(',', array_keys($insert));
    $phs   = implode(',', array_fill(0, count($insert), '?'));
    $stmt  = $db->prepare("INSERT INTO employees ($cols) VALUES ($phs) RETURNING *");
    $stmt->execute(array_values($insert));
    $emp = $stmt->fetch();
    http_response_code(201);
    echo json_encode(safeEmp($emp));

// GET /api/employees/{id}
} elseif ($id && $method === 'GET') {
    requireAuth();
    $stmt = $db->prepare('SELECT * FROM employees WHERE id=?');
    $stmt->execute([$id]);
    $emp = $stmt->fetch();
    if (!$emp) { http_response_code(404); echo json_encode(['error' => 'الموظف غير موجود']); exit; }
    echo json_encode(safeEmp($emp));

// PATCH /api/employees/{id}
} elseif ($id && $method === 'PATCH') {
    requireRole('admin', 'manager');
    $allowed = ['name','name_ar','role','department','position','phone','email','status','work_location_lat','work_location_lng','work_location_radius'];
    $updates = [];
    foreach ($allowed as $f) if (array_key_exists($f, $body)) $updates[$f] = $body[$f];
    if (!empty($body['password'])) $updates['password_hash'] = hashPassword($body['password']);

    if (empty($updates)) { http_response_code(400); echo json_encode(['error' => 'لا توجد بيانات للتحديث']); exit; }

    $set  = implode(',', array_map(fn($k) => "$k=?", array_keys($updates)));
    $stmt = $db->prepare("UPDATE employees SET $set WHERE id=? RETURNING *");
    $stmt->execute([...array_values($updates), $id]);
    $emp = $stmt->fetch();
    if (!$emp) { http_response_code(404); echo json_encode(['error' => 'الموظف غير موجود']); exit; }
    echo json_encode(safeEmp($emp));

// DELETE /api/employees/{id}
} elseif ($id && $method === 'DELETE') {
    requireRole('admin');
    $db->prepare("UPDATE employees SET status='inactive' WHERE id=?")->execute([$id]);
    echo json_encode(['message' => 'تم تعطيل الموظف بنجاح']);

} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
}
