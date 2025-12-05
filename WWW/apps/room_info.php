<?php
require_once '../config.php';
require_once $SET_SITE_ROOT.'/common/lib/dbconn.php';
checkAuth();

$room_id = $_GET['room_id'] ?? 0;
$db = getDB();

// 채팅방 정보 가져오기
$stmt = $db->prepare("SELECT room_name FROM chat_rooms WHERE id = ?");
$stmt->bind_param("i", $room_id);
$stmt->execute();
$room = $stmt->get_result()->fetch_assoc();

// 채팅방 멤버 정보 가져오기
$query = "
    SELECT u.id, u.username, u.language_code
    FROM room_members rm 
    JOIN users u ON rm.user_id = u.id
    WHERE rm.room_id = ?
";

$stmt = $db->prepare($query);
$stmt->bind_param("i", $room_id);
$stmt->execute();
$result = $stmt->get_result();

$members = array();
while($row = $result->fetch_assoc()) {
    $code = $row['language_code'];
    $member['id'] = $row['id'];
    $member['username'] = $row['username'];
    $member['language_code'] = $code;
    $member['flag'] = $language_map[$code]['flag'];
    $member['language_name'] = $language_map[$code]['name'];
    
    $members[] = $member;
}

$response = [
    'room_name' => $room['room_name'] ?? '',
    'members' => $members
];

header('Content-Type: application/json');
echo json_encode($response);
?>