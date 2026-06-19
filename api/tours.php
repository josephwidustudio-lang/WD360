<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$tourIdParam = $_GET['id'] ?? '';

// Verify authentication session EXCEPT for GET requests retrieving a specific public tour by ID
if (!isset($_SESSION['user_id'])) {
    if ($method === 'GET' && !empty($tourIdParam)) {
        // Allow guest read for specific tour ID
    } else {
        http_response_code(401);
        echo json_encode(["error" => "Unauthorized. Please log in first."]);
        exit();
    }
}

$userId = $_SESSION['user_id'] ?? null;

switch ($method) {
    case 'GET':
        if (!empty($tourIdParam)) {
            // Retrieve single specific tour (Guest or Owner)
            try {
                // Increment views count
                $stmtUpdateViews = $pdo->prepare("UPDATE tours SET views = views + 1 WHERE id = ?");
                $stmtUpdateViews->execute([$tourIdParam]);

                $stmt = $pdo->prepare("SELECT * FROM tours WHERE id = ?");
                $stmt->execute([$tourIdParam]);
                $row = $stmt->fetch();
                
                if (!$row) {
                    http_response_code(404);
                    echo json_encode(["error" => "Tour not found."]);
                    exit();
                }

                echo json_encode([
                    "id" => $row['id'],
                    "user_id" => $row['user_id'],
                    "title" => $row['title'],
                    "description" => $row['description'],
                    "scenes" => json_decode($row['scenes'], true),
                    "views" => (int)$row['views'],
                    "created_at" => $row['created_at']
                ]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(["error" => "Failed to retrieve tour: " . $e->getMessage()]);
            }
        } else {
            // Retrieve all tours for the logged-in user
            try {
                $stmt = $pdo->prepare("SELECT * FROM tours WHERE user_id = ? ORDER BY created_at DESC");
                $stmt->execute([$userId]);
                $tours = $stmt->fetchAll();
                
                // Format output: decode the JSON scenes
                $formattedTours = [];
                foreach ($tours as $row) {
                    $formattedTours[] = [
                        "id" => $row['id'],
                        "user_id" => $row['user_id'],
                        "title" => $row['title'],
                        "description" => $row['description'],
                        "scenes" => json_decode($row['scenes'], true),
                        "views" => (int)$row['views'],
                        "created_at" => $row['created_at']
                }
                echo json_encode($formattedTours);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(["error" => "Failed to retrieve tours: " . $e->getMessage()]);
            }
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $tourId = trim($input['id'] ?? '');
        $title = trim($input['title'] ?? '');
        $description = trim($input['description'] ?? '');
        $scenes = $input['scenes'] ?? [];

        if (empty($tourId) || empty($title)) {
            http_response_code(400);
            echo json_encode(["error" => "Tour ID and Title are required."]);
            exit();
        }

        // Convert scenes array back to JSON string
        $scenesJson = json_encode($scenes, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        try {
            // Check if tour already exists
            $stmt = $pdo->prepare("SELECT user_id FROM tours WHERE id = ?");
            $stmt->execute([$tourId]);
            $existing = $stmt->fetch();

            if ($existing) {
                // Check authorization
                if ($existing['user_id'] !== $userId) {
                    http_response_code(403);
                    echo json_encode(["error" => "Forbidden. You do not own this tour."]);
                    exit();
                }

                // Update existing tour
                $stmtUpdate = $pdo->prepare("UPDATE tours SET title = ?, description = ?, scenes = ? WHERE id = ?");
                $stmtUpdate->execute([$title, $description, $scenesJson, $tourId]);
            } else {
                // Insert new tour
                $stmtInsert = $pdo->prepare("INSERT INTO tours (id, user_id, title, description, scenes) VALUES (?, ?, ?, ?, ?)");
                $stmtInsert->execute([$tourId, $userId, $title, $description, $scenesJson]);
            }

            echo json_encode(["success" => true, "message" => "Tour saved successfully."]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Failed to save tour: " . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        $tourId = $_GET['id'] ?? '';
        if (empty($tourId)) {
            http_response_code(400);
            echo json_encode(["error" => "Tour ID is required."]);
            exit();
        }

        try {
            // Check if exists and belongs to user
            $stmt = $pdo->prepare("SELECT user_id FROM tours WHERE id = ?");
            $stmt->execute([$tourId]);
            $existing = $stmt->fetch();

            if (!$existing) {
                http_response_code(404);
                echo json_encode(["error" => "Tour not found."]);
                exit();
            }

            if ($existing['user_id'] !== $userId) {
                http_response_code(403);
                echo json_encode(["error" => "Forbidden. You do not own this tour."]);
                exit();
            }

            $stmtDelete = $pdo->prepare("DELETE FROM tours WHERE id = ?");
            $stmtDelete->execute([$tourId]);

            echo json_encode(["success" => true, "message" => "Tour deleted successfully."]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Failed to delete tour: " . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed."]);
        break;
}
