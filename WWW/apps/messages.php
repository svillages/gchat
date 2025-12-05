<?php
require_once '../config.php';
require_once $SET_SITE_ROOT.'/common/lib/dbconn.php';
checkAuth();

$room_id = $_GET['room_id'] ?? 0;
$db = getDB();

// 메시지 가져오기
// $query = "
//     SELECT m.*, u.username as sender_name
//     FROM messages m
//     JOIN users u ON m.sender_id = u.id
//     WHERE m.room_id = ?
//     ORDER BY m.created_at ASC
//     LIMIT 200
// ";


$query = "SELECT * FROM (
    SELECT m.*, u.username AS sender_name, t.translated_message 
    FROM messages m JOIN users u ON m.sender_id = u.id 
    LEFT JOIN message_translations t ON t.message_id = m.id WHERE m.room_id = ? 
    ORDER BY m.created_at DESC LIMIT 100
) AS sub
ORDER BY created_at ASC";

$stmt = $db->prepare($query);
$stmt->bind_param("i", $room_id);
$stmt->execute();
$messages = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

header('Content-Type: application/json');
echo json_encode($messages);
?>