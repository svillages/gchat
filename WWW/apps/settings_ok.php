<?php 
require_once '../config.php';
require_once $SET_SITE_ROOT.'/common/lib/lib.php';
require_once $SET_SITE_ROOT.'/common/lib/dbconn.php';

// 정보 업데이트 처리 csrftoken 검사, 계정 맞는지 검사
if (isset($_POST['csrftoken']) && verifyCsrfToken($_POST['csrftoken']) && isset($_POST['user_id']) && $_POST['user_id'] == $_SESSION['user_id']) {
    $db = getDB();
    // 프로필 업데이트
    if (isset($_POST['code']) && $_POST['code']=="update_profile") {
        // 프로필 정보 업데이트
        $user_id = $_SESSION['user_id'];
        $username = $_POST['username'] ?? '';
        $email = $_POST['email'] ?? '';
        $phone = $_POST['phone'] ?? '';
        $language_code = $_POST['language_code'] ?? 'ko';
        $result = "";
        $msg = "";
        
        if (!empty($username) && !empty($email)) {
            try {
                $stmt = $db->prepare("UPDATE users SET username = ?, email = ?, phone = ?, language_code = ? WHERE id = ?");
                $stmt->bind_param("ssssi", $username, $email, $phone, $language_code, $user_id);
                
                if ($stmt->execute()) {
                    $result = "Y";
                    $msg = "프로필이 성공적으로 업데이트되었습니다.";
                    // 세션 정보 갱신
                    $_SESSION['username'] = $username;
                    // 사용자 정보 다시 가져오기
                    $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
                    $stmt->bind_param("i", $user_id);
                    $stmt->execute();
                    $user = $stmt->get_result()->fetch_assoc();
                } else {
                    $result = "N";
                    $msg = "프로필 업데이트에 실패했습니다.";
                }
            } catch (Exception $e) {
                $result = "N";
                $msg = "오류가 발생했습니다: " . $e->getMessage();
            }
        } else {
            $result = "N";
            $msg = "필수 정보를 입력해주세요.";
        }
        
        $return['result'] = $result;
        $return['msg'] = $msg;
        echo json_encode($return, JSON_UNESCAPED_UNICODE);
        
    } elseif (isset($_POST['code']) && $_POST['code']=="change_password") {
        // 비밀번호 변경
        $user_id = $_SESSION['user_id'];
        $current_password = $_POST['current_password'] ?? '';
        $new_password = $_POST['new_password'] ?? '';
        $confirm_password = $_POST['confirm_password'] ?? '';
        $result = "";
        $msg = "";
        
        if (!empty($current_password) && !empty($new_password) && !empty($confirm_password)) {
            // 현재 비밃번호 일치여부
            // 먼저 DB에서 현재 사용자의 비밀번호 해시를 가져온다.
            $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $stmt->bind_result($current_password_hash);
            $stmt->fetch();
            $stmt->close();
            
            // 현재 비밀번호 검증
            if (password_verify($current_password, $current_password_hash)) {
                if ($new_password === $confirm_password) {
                    // 실제로는 비밀번호 해싱 검증 필요
                    // 여기서는 단순 예시로 비밀번호 길이만 체크
                    if (strlen($new_password) >= 6) {
                        // 새로운 비밀번호 해싱 (실제 구현시 password_hash 사용)
                        $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
                        
                        $stmt = $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
                        $stmt->bind_param("si", $hashed_password, $user_id);
                        
                        if ($stmt->execute()) {
                            $result = "Y";
                            $msg = "비밀번호가 성공적으로 변경되었습니다.";
                        } else {
                            $result = "N";
                            $msg = "비밀번호 변경에 실패했습니다.";
                        }
                    } else {
                        $result = "N";
                        $msg = "비밀번호는 최소 6자 이상이어야 합니다.";
                    }
                } else {
                    $result = "N";
                    $msg = "새 비밀번호가 일치하지 않습니다.";
                }
            } else {
                $result = "N";
                $msg = "현재 비밀번호가 일치하지 않습니다.";
            }
        } else {
            $result = "N";
            $msg = "모든 필드를 입력해주세요.";
        }
        
        $return['result'] = $result;
        $return['msg'] = $msg;
        echo json_encode($return, JSON_UNESCAPED_UNICODE);
        
    } elseif (isset($_POST['code']) && $_POST['code']=="confirm_delete") {
        // 계정 삭제
        $confirm_delete = $_POST['confirm_delete'];
        $user_id = $_SESSION['user_id'];
        
        if ($confirm_delete == 'DELETE') {
            try {
                // 트랜잭션 시작
                $db->begin_transaction();
                
//                 // 1. 사용자가 보낸 메시지 삭제
//                 $stmt = $db->prepare("DELETE FROM messages WHERE sender_id = ?");
//                 $stmt->bind_param("i", $user_id);
//                 $stmt->execute();
                
                // 2. 채팅방 멤버에서 제거
                $stmt = $db->prepare("DELETE FROM room_members WHERE user_id = ?");
                $stmt->bind_param("i", $user_id);
                $stmt->execute();
                
//                 // 3. 사용자가 생성한 채팅방이 있는 경우, 채팅방 삭제
//                 $stmt = $db->prepare("SELECT id FROM chat_rooms WHERE created_by = ?");
//                 $stmt->bind_param("i", $user_id);
//                 $stmt->execute();
//                 $rooms = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
                
//                 foreach ($rooms as $room) {
//                     $room_id = $room['id'];
//                     // 채팅방 메시지 삭제
//                     $stmt = $db->prepare("DELETE FROM messages WHERE room_id = ?");
//                     $stmt->bind_param("i", $room_id);
//                     $stmt->execute();
                    
//                     // 채팅방 멤버 삭제
//                     $stmt = $db->prepare("DELETE FROM room_members WHERE room_id = ?");
//                     $stmt->bind_param("i", $room_id);
//                     $stmt->execute();
                    
//                     // 채팅방 삭제
//                     $stmt = $db->prepare("DELETE FROM chat_rooms WHERE id = ?");
//                     $stmt->bind_param("i", $room_id);
//                     $stmt->execute();
//                 }
                
                // 4. 사용자 삭제
                $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
                $stmt->bind_param("i", $user_id);
                $stmt->execute();
                
                $db->commit();
                
                // 세션 삭제
                session_destroy();
                
                // 성공 페이지로 리다이렉트
                $result = "Y";
                $msg = "계정 삭제";
                    
            } catch (Exception $e) {
                $db->rollback();
                $result = "N";
                $msg = "계정 삭제 중 오류가 발생했습니다: " . $e->getMessage();
            }
        } else {
            $result = "N";
            $msg = "확인 문구를 정확히 입력해주세요.";
        }
            
        $return['result'] = $result;
        $return['msg'] = $msg;
        echo json_encode($return, JSON_UNESCAPED_UNICODE);
    
    } else {
        
        $return['result'] = 'F';
        $return['msg'] = "정상적으로 접근해 주세요.";
        echo json_encode($return, JSON_UNESCAPED_UNICODE);
    }

} else {
    $return['result'] = 'F';
    $return['msg'] = "접근 권한이 없습니다.";
    echo json_encode($return, JSON_UNESCAPED_UNICODE);
}
?>