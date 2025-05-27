<?php
require_once 'config.php';

try {
    $tasks = json_decode(file_get_contents(DB_FILE), true);
    echo json_encode($tasks ?: []);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load tasks']);
}
?>