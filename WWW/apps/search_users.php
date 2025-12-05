<?php
require_once '../config.php';
require_once $SET_SITE_ROOT.'/common/lib/lib.php';
require_once $SET_SITE_ROOT.'/common/lib/dbconn.php';
checkAuth();

$search = $_GET['q'] ?? '';
$db = getDB();

// 사용자 검색 (자신 제외)
$query = "
    SELECT id, username, email, language_code
    FROM users
    WHERE (username LIKE ? OR email LIKE ?)
    AND id != ?
    LIMIT 10
";

$searchTerm = "%{$search}%";
$user_id = $_SESSION['user_id'];

$stmt = $db->prepare($query);
$stmt->bind_param("ssi", $searchTerm, $searchTerm, $user_id);
$stmt->execute();
$users = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

header('Content-Type: application/json');
echo json_encode($users);
?>