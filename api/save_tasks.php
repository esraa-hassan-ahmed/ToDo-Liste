<?php
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['tasks'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid data format']);
    exit;
}

try {
    file_put_contents(DB_FILE, json_encode($data['tasks']));
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save tasks']);
}
?>