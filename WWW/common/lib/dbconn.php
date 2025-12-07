<?php 
// 데이터베이스 연결 설정
define('DB_HOST', 'localhost');
define('DB_USER', 'dbuser');
define('DB_PASS', 'dbpass');
define('DB_NAME', 'dbname');
define('DB_PORT', 'dbport');
// 데이터베이스 연결
function getDB() {
    static $db = null;
    if ($db === null) {
        try {
            $db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
            $db->set_charset("utf8mb4");
        } catch (Exception $e) {
            die("Database connection failed: " . $e->getMessage());
        }
    }
    return $db;
}
?>