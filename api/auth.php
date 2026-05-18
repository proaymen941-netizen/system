<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

if ($uri === '/api/auth/login' && $method === 'POST') {
    $username = trim($body['username'] ?? '');
    $password = $body['password'] ?? '';

    if (!$username || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'اسم المستخدم وكلمة المرور مطلوبان']);
        exit;
    }

    try {
        $db   = getDb();
        $stmt = $db->prepare('SELECT * FROM employees WHERE username = ?');
        $stmt->execute([$username]);
        $emp  = $stmt->fetch();
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['error' => 'خطأ في قاعدة البيانات: ' . $e->getMessage()]);
        exit;
    }

    if (!$emp || $emp['password_hash'] !== hashPassword($password)) {
        http_response_code(401);
        echo json_encode(['error' => 'بيانات الدخول غير صحيحة']);
        exit;
    }

    if ($emp['status'] === 'inactive') {
        http_response_code(401);
        echo json_encode(['error' => 'الحساب معطل، تواصل مع المسؤول']);
        exit;
    }

    $_SESSION['employee_id'] = $emp['id'];
    echo json_encode(['employee' => safeEmp($emp)]);

} elseif ($uri === '/api/auth/logout' && $method === 'POST') {
    $_SESSION = [];
    session_destroy();
    echo json_encode(['message' => 'تم تسجيل الخروج بنجاح']);

} elseif ($uri === '/api/auth/me' && $method === 'GET') {
    $emp = requireAuth();
    echo json_encode(safeEmp($emp));

} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
}
