<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Database configuration
define('DB_FILE', 'tasks.json');

// Create file if it doesn't exist
if (!file_exists(DB_FILE)) {
    file_put_contents(DB_FILE, json_encode([]));
}
?>