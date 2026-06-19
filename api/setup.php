<?php
// Database setup script
require_once __DIR__ . '/config.php';

try {
    // Connect to MySQL server without selecting database first
    $setupPdo = new PDO(
        "mysql:host=" . DB_HOST . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]
    );

    // Create database if not exists
    $setupPdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
    $setupPdo->exec("USE `" . DB_NAME . "`;");

    // Create 'users' table
    $setupPdo->exec("CREATE TABLE IF NOT EXISTS `users` (
        `id` VARCHAR(36) NOT NULL,
        `email` VARCHAR(191) NOT NULL UNIQUE,
        `password_hash` VARCHAR(255) NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB;");

    // Create 'profiles' table
    $setupPdo->exec("CREATE TABLE IF NOT EXISTS `profiles` (
        `user_id` VARCHAR(36) NOT NULL,
        `plan` VARCHAR(50) NOT NULL DEFAULT 'starter',
        PRIMARY KEY (`user_id`),
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB;");

    // Create 'tours' table
    $setupPdo->exec("CREATE TABLE IF NOT EXISTS `tours` (
        `id` VARCHAR(36) NOT NULL,
        `user_id` VARCHAR(36) NOT NULL,
        `title` VARCHAR(255) NOT NULL,
        `description` TEXT,
        `scenes` LONGTEXT NOT NULL, -- JSON formatted scenes list
        `views` INT DEFAULT 0,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB;");

    echo json_encode([
        "success" => true,
        "message" => "Database and tables successfully configured!"
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Setup failed: " . $e->getMessage()
    ]);
}
