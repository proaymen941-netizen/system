<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

$db = getDb();
preg_match('#^/api/announcements(?:/(\d+))?$#', $uri, $m);
$id = isset($m[1]) ? (int)$m[1] : null;

// GET /api/announcements
if (!$id && $method === 'GET') {
    requireAuth();
    $stmt = $db->query("SELECT a.*, e.name AS created_by_name FROM announcements a LEFT JOIN employees e ON a.created_by=e.id ORDER BY a.created_at DESC");
    echo json_encode($stmt->fetchAll());

// POST /api/announcements
} elseif (!$id && $method === 'POST') {
    $emp      = requireRole('admin', 'manager');
    $title    = trim($body['title']   ?? '');
    $content  = trim($body['content'] ?? '');
    $priority = $body['priority'] ?? 'normal';

    if (!$title || !$content) {
        http_response_code(400);
        echo json_encode(['error' => 'العنوان والمحتوى مطلوبان']);
        exit;
    }

    $stmt = $db->prepare("INSERT INTO announcements (title,content,priority,created_by) VALUES (?,?,?,?) RETURNING *");
    $stmt->execute([$title, $content, $priority, $emp['id']]);
    $ann = $stmt->fetch();
    $ann['created_by_name'] = $emp['name'];
    http_response_code(201);
    echo json_encode($ann);

// DELETE /api/announcements/{id}
} elseif ($id && $method === 'DELETE') {
    requireRole('admin', 'manager');
    $db->prepare("DELETE FROM announcements WHERE id=?")->execute([$id]);
    echo json_encode(['message' => 'تم حذف الإعلان بنجاح']);

} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
}
