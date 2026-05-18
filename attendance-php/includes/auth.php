<?php
function hashPassword(string $password): string {
    return hash('sha256', $password . 'salt_attendance_2024');
}

function getCurrentEmployee(): ?array {
    if (empty($_SESSION['employee_id'])) return null;
    try {
        $db   = getDb();
        $stmt = $db->prepare('SELECT * FROM employees WHERE id = ? AND status = ?');
        $stmt->execute([$_SESSION['employee_id'], 'active']);
        $emp  = $stmt->fetch();
        return $emp ?: null;
    } catch (Throwable) {
        return null;
    }
}

function requireAuth(): array {
    $emp = getCurrentEmployee();
    if (!$emp) {
        http_response_code(401);
        echo json_encode(['error' => 'غير مصرح، يرجى تسجيل الدخول']);
        exit;
    }
    return $emp;
}

function requireRole(string ...$roles): array {
    $emp = requireAuth();
    if (!in_array($emp['role'], $roles, true)) {
        http_response_code(403);
        echo json_encode(['error' => 'غير مصرح بهذه العملية']);
        exit;
    }
    return $emp;
}

function safeEmp(array $emp): array {
    unset($emp['password_hash']);
    return $emp;
}
