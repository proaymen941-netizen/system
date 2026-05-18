<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];
$body   = json_decode(file_get_contents('php://input'), true) ?? [];
parse_str(parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY) ?? '', $query);

$db  = getDb();
$emp = requireAuth();

preg_match('#^/api/notifications(?:/(\d+|all))?(?:/(mark-read))?$#', $uri, $m);
$seg    = $m[1] ?? null;
$action = $m[2] ?? null;

// GET /api/notifications  — list for current user
if ($method === 'GET' && !$seg) {
    $onlyUnread = ($query['unread'] ?? '') === '1';
    $sql = "SELECT * FROM notifications WHERE recipient_id=?" . ($onlyUnread ? " AND is_read=FALSE" : "") . " ORDER BY created_at DESC LIMIT 80";
    $stmt = $db->prepare($sql);
    $stmt->execute([$emp['id']]);
    $rows = $stmt->fetchAll();

    $unread = (int)$db->prepare("SELECT COUNT(*) FROM notifications WHERE recipient_id=? AND is_read=FALSE")->execute([$emp['id']]) ? (int)$db->query("SELECT COUNT(*) FROM notifications WHERE recipient_id={$emp['id']} AND is_read=FALSE")->fetchColumn() : 0;

    echo json_encode(['notifications' => $rows, 'unread_count' => $unread]);

// GET /api/notifications/count  — fast unread badge count
} elseif ($method === 'GET' && $seg === 'count') {
    $cnt = (int)$db->prepare("SELECT COUNT(*) FROM notifications WHERE recipient_id=? AND is_read=FALSE")->execute([$emp['id']]) ? (int)$db->query("SELECT COUNT(*) FROM notifications WHERE recipient_id={$emp['id']} AND is_read=FALSE")->fetchColumn() : 0;
    echo json_encode(['unread_count' => $cnt]);

// POST /api/notifications/{id}/mark-read  — mark one as read
} elseif ($method === 'POST' && $seg && is_numeric($seg) && $action === 'mark-read') {
    $db->prepare("UPDATE notifications SET is_read=TRUE WHERE id=? AND recipient_id=?")->execute([(int)$seg, $emp['id']]);
    echo json_encode(['ok' => true]);

// POST /api/notifications/all/mark-read  — mark all as read
} elseif ($method === 'POST' && $seg === 'all' && $action === 'mark-read') {
    $db->prepare("UPDATE notifications SET is_read=TRUE WHERE recipient_id=?")->execute([$emp['id']]);
    echo json_encode(['ok' => true]);

// DELETE /api/notifications/{id}
} elseif ($method === 'DELETE' && $seg && is_numeric($seg)) {
    $db->prepare("DELETE FROM notifications WHERE id=? AND recipient_id=?")->execute([(int)$seg, $emp['id']]);
    echo json_encode(['ok' => true]);

} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
}
