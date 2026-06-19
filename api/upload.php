<?php
require_once __DIR__ . '/db.php';

// Verify authentication session
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized. Please log in first."]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed. Use POST."]);
    exit();
}

if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(["error" => "No file uploaded."]);
    exit();
}

$file = $_FILES['file'];
$fileName = $file['name'];
$fileTmpName = $file['tmp_name'];
$fileSize = $file['size'];
$fileError = $file['error'];

// Validate error status
if ($fileError !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["error" => "File upload error code: " . $fileError]);
    exit();
}

// Limit size to 10MB (approx. typical 360 panorama size)
if ($fileSize > 10 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(["error" => "File size exceeds the 10MB limit."]);
    exit();
}

// Validate file extension
$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
$fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

if (!in_array($fileExt, $allowedExtensions)) {
    http_response_code(400);
    echo json_encode(["error" => "Unsupported file format. Use JPG, JPEG, PNG, or WEBP."]);
    exit();
}

// Ensure the uploads directory exists
$uploadDir = __DIR__ . '/uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate a unique filename to prevent overwrites
$safeFileName = time() . '_' . preg_replace('/[^a-zA-Z0-9.]/', '_', $fileName);
$destPath = $uploadDir . $safeFileName;

if (move_uploaded_file($fileTmpName, $destPath)) {
    // Generate public URL dynamically
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'];
    
    // Get the base directory path (relative to root domain)
    $scriptDir = dirname($_SERVER['SCRIPT_NAME']);
    // Normalize path slashes for URL
    $scriptDir = str_replace('\\', '/', $scriptDir);
    if (substr($scriptDir, -1) !== '/') {
        $scriptDir .= '/';
    }

    $publicUrl = $protocol . $host . $scriptDir . 'uploads/' . $safeFileName;

    echo json_encode([
        "success" => true,
        "url" => $publicUrl
    ]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to save file to disk."]);
}
