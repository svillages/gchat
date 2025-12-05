<?php
require_once '../config.php';
require_once $SET_SITE_ROOT.'/common/lib/dbconn.php';
checkAuth();

$db = getDB();
$user_id = $_SESSION['user_id'];

// 사용자가 참여한 채팅방 목록 가져오기
$query = "
    SELECT cr.id as room_id, 
           cr.room_name, 
           m.original_message as last_message,
           m.created_at as last_message_time
    FROM chat_rooms cr
    JOIN room_members rm ON cr.id = rm.room_id
    LEFT JOIN messages m ON cr.id = m.room_id 
        AND m.created_at = (
            SELECT MAX(created_at) 
            FROM messages 
            WHERE room_id = cr.id
        )
    WHERE rm.user_id = ?
    ORDER BY m.created_at DESC
";

$stmt = $db->prepare($query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

$chats = [];
while ($row = $result->fetch_assoc()) {
    $chats[] = $row;
}

header('Content-Type: application/json');
echo json_encode($chats);
?>