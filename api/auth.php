<?php
require_once __DIR__ . '/db.php';

// Helper to get JSON input
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $_GET['action'] ?? $input['action'] ?? '';

switch ($action) {
    case 'signup':
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';
        $plan = trim($input['plan'] ?? 'starter');

        if (empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(["error" => "Email and password are required."]);
            exit();
        }

        // Check if user already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(["error" => "An account with this email already exists."]);
            exit();
        }

        // Create new user record
        $userId = bin2hex(random_bytes(16)); // Generate 32-char hex UUID
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        try {
            $pdo->beginTransaction();

            $stmtUser = $pdo->prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)");
            $stmtUser->execute([$userId, $email, $passwordHash]);

            $stmtProfile = $pdo->prepare("INSERT INTO profiles (user_id, plan) VALUES (?, ?)");
            $stmtProfile->execute([$userId, $plan]);

            $pdo->commit();

            // Set session variables
            $_SESSION['user_id'] = $userId;
            $_SESSION['email'] = $email;
            $_SESSION['plan'] = $plan;

            echo json_encode([
                "user" => [
                    "id" => $userId,
                    "email" => $email,
                    "plan" => $plan
                ]
            ]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["error" => "Failed to create account: " . $e->getMessage()]);
        }
        break;

    case 'signin':
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';

        if (empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(["error" => "Email and password are required."]);
            exit();
        }

        // Fetch user and plan
        $stmt = $pdo->prepare("SELECT u.id, u.email, u.password_hash, p.plan FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(["error" => "Invalid email or password."]);
            exit();
        }

        // Set session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['plan'] = $user['plan'] ?? 'starter';

        echo json_encode([
            "user" => [
                "id" => $user['id'],
                "email" => $user['email'],
                "plan" => $user['plan'] ?? 'starter'
            ]
        ]);
        break;

    case 'session':
        if (isset($_SESSION['user_id'])) {
            echo json_encode([
                "user" => [
                    "id" => $_SESSION['user_id'],
                    "email" => $_SESSION['email'],
                    "plan" => $_SESSION['plan']
                ]
            ]);
        } else {
            echo json_encode(["user" => null]);
        }
        break;

    case 'logout':
        session_unset();
        session_destroy();
        echo json_encode(["success" => true]);
        break;

    case 'update_plan':
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized."]);
            exit();
        }
        $userId = $_SESSION['user_id'];
        $plan = trim($input['plan'] ?? 'starter');

        try {
            $stmt = $pdo->prepare("UPDATE profiles SET plan = ? WHERE user_id = ?");
            $stmt->execute([$plan, $userId]);
            $_SESSION['plan'] = $plan; // Update session
            echo json_encode(["success" => true, "plan" => $plan]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Failed to update plan: " . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(["error" => "Invalid auth action."]);
        break;
}
