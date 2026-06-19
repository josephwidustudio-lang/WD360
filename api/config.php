<?php
// Global API Configuration for WD360
session_start();

// Enable Error Reporting for debugging (can be disabled in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// CORS & JSON Headers
// Allow CORS for local React development
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle Preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database Connection Constants
define('DB_HOST', 'localhost');
define('DB_NAME', 'wd360');
define('DB_USER', 'root');
define('DB_PASS', ''); // Set your database password here
