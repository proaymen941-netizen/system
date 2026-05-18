<?php
session_start();

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Serve static files directly
if (preg_match('/\.(css|js|png|jpg|gif|svg|ico|woff2?|ttf)$/', $uri)) {
    return false;
}

// API routes
if (strpos($uri, '/api/') === 0) {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-cache');

    if ($method === 'OPTIONS') {
        http_response_code(200);
        exit;
    }

    if (preg_match('#^/api/auth#', $uri))             { require __DIR__ . '/api/auth.php'; }
    elseif (preg_match('#^/api/attendance#', $uri))   { require __DIR__ . '/api/attendance.php'; }
    elseif (preg_match('#^/api/employees#', $uri))    { require __DIR__ . '/api/employees.php'; }
    elseif (preg_match('#^/api/leaves#', $uri))       { require __DIR__ . '/api/leaves.php'; }
    elseif (preg_match('#^/api/overtime#', $uri))     { require __DIR__ . '/api/overtime.php'; }
    elseif (preg_match('#^/api/announcements#', $uri)){ require __DIR__ . '/api/announcements.php'; }
    elseif (preg_match('#^/api/reports#', $uri))        { require __DIR__ . '/api/reports.php'; }
    elseif (preg_match('#^/api/notifications#', $uri)) { require __DIR__ . '/api/notifications.php'; }
    else {
        http_response_code(404);
        echo json_encode(['error' => 'API endpoint not found']);
    }
    exit;
}

// Serve SPA for all other routes
require __DIR__ . '/index.php';
