<?php
// api/add_member.php
require_once '../config.php';
require_once $SET_SITE_ROOT.'/common/lib/lib.php';
require_once $SET_SITE_ROOT.'/common/lib/dbconn.php';

checkAuth();

$db = getDB();
$user_id = $_SESSION['user_id'];

// JSON 데이터 읽기
$data = json_decode(file_get_contents('php://input'), true);
$room_id = intval($data['room_id'] ?? 0);
$new_user_ids = $data['user_ids'] ?? [];

if (empty($room_id) || empty($new_user_ids)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '필수 데이터가 없습니다.']);
    exit;
}

// 요청자가 해당 채팅방의 멤버인지 확인
$stmt = $db->prepare("SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?");
$stmt->bind_param("ii", $room_id, $user_id);
$stmt->execute();
$is_member = $stmt->get_result()->num_rows > 0;

if (!$is_member) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => '채팅방 멤버만 사용자를 추가할 수 있습니다.']);
    exit;
}

// 이미 멤버인 사용자와 새로 추가할 사용자 구분
$added_members = [];
$already_members = [];
$failed_members = [];

foreach ($new_user_ids as $new_user_id) {
    $new_user_id = intval($new_user_id);
    
    // 이미 멤버인지 확인
    $stmt = $db->prepare("SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?");
    $stmt->bind_param("ii", $room_id, $new_user_id);
    $stmt->execute();
    
    if ($stmt->get_result()->num_rows > 0) {
        $already_members[] = $new_user_id;
        continue;
    }
    
    // 새 멤버 추가
    $stmt = $db->prepare("INSERT INTO room_members (room_id, user_id) VALUES (?, ?)");
    $stmt->bind_param("ii", $room_id, $new_user_id);
    
    if ($stmt->execute()) {
        $added_members[] = $new_user_id;
        
        // 새로 추가된 멤버 정보 가져오기
        $user_stmt = $db->prepare("
            SELECT id, username, language_code
            FROM users
            WHERE id = ?
        ");
        $user_stmt->bind_param("i", $new_user_id);
        $user_stmt->execute();
        $user_result = $user_stmt->get_result();
        
        if ($user_result->num_rows > 0) {
            $added_members_info[] = $user_result->fetch_assoc();
        }
    } else {
        $failed_members[] = $new_user_id;
    }
}

// 결과 반환
$result = [
    'success' => true,
    'message' => sprintf(
        '총 %d명 중 %d명 추가 완료, %d명은 이미 멤버입니다.',
        count($new_user_ids),
        count($added_members),
        count($already_members)
    ),
    'added_members' => $added_members,
    'already_members' => $already_members,
    'failed_members' => $failed_members,
    'added_members_info' => $added_members_info ?? []
];

echo json_encode($result);
?>