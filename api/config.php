<?php
// Enable Error Reporting for debugging (can be disabled in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Allow CORS with credentials support (cookies/session)
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173';
header("Access-Control-Allow-Origin: " . $origin);
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle Preflight OPTIONS requests - Exit early before session_start
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Start PHP session (only for actual non-preflight requests)
session_start();

// Database Connection Constants
define('DB_HOST', 'localhost');
define('DB_NAME', 'wd360');
define('DB_USER', 'wd360_user');
define('DB_PASS', 'wd360_pass'); // Set your database password here
