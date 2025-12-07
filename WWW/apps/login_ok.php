<?php
require_once '../config.php';
require_once $SET_SITE_ROOT.'/common/lib/lib.php';
require_once $SET_SITE_ROOT.'/common/lib/dbconn.php';
$result = "";
$msg = "";

// 이미 로그인된 사용자는 메인 페이지로 리다이렉트
if (isset($_SESSION['user_id'])) {
    header('Location: /');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // CSRF 토큰 검증
    if (!verifyCsrfToken($_POST['csrf_token'] ?? '')) {
        $result = "N";
        $msg = "보안 토큰이 유효하지 않습니다. 정상적으로 접근해 주세요.";
    } else {
        $email = sanitizeInput($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        
        // 유효성 검사
        if (empty($email) || empty($password)) {
            $result = "N";
            $msg = "이메일과 비밀번호를 입력해주세요.";
        } elseif (!validateEmail($email)) {
            $result = "N";
            $msg = "유효한 이메일 주소를 입력해주세요.";
        } else {
            try {
                $db = getDB();
                
                // 사용자 정보 조회 (비밀번호 해시 포함)
                $stmt = $db->prepare("SELECT id, username, password_hash, language_code FROM users WHERE email = ?");
                $stmt->bind_param("s", $email);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($result->num_rows === 0) {
                    $result = "N";
                    $msg = "이메일 또는 비밀번호가 잘못되었습니다.";
                } else {
                    $user = $result->fetch_assoc();
                    
                    // 비밀번호 검증
                    if (verifyPassword($password, $user['password_hash'])) {
                        // 로그인 성공
                        $_SESSION['user_id'] = $user['id'];
                        $_SESSION['username'] = $user['username'];
                        $_SESSION['language_code'] = $user['language_code'];
                        
                        // 로그인 시간 업데이트 (선택사항)
                        $update_stmt = $db->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
                        $update_stmt->bind_param("i", $user['id']);
                        $update_stmt->execute();
                        
                        $result = "Y";
                        $msg = "로그인 성공";
                    } else {
                        // 비밀번호가 일치하지 않음
                        $result = "N";
                        $msg = "이메일 또는 비밀번호가 잘못되었습니다.";
                        
                        // 실패 횟수 추적 (실제 운영시에는 구현 필요)
                        // 보안을 위해 자세한 오류 메시지는 표시하지 않음
                    }
                }
            } catch (Exception $e) {
                $result = "N";
                $msg = "로그인 처리 중 오류가 발생했습니다.";
                error_log("Login error: " . $e->getMessage());
            }
        }
    }
} else {
    $result = "N";
    $msg == "정상적으로 접근해 주세요.";
}
$return['result'] = $result;
$return['msg'] = $msg;
echo json_encode($return, JSON_UNESCAPED_UNICODE);
?>