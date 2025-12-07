<?php
require_once '../config.php';
require_once $SET_SITE_ROOT.'/common/lib/lib.php';
require_once $SET_SITE_ROOT.'/common/lib/dbconn.php';
$result = "";
$msg = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // CSRF 토큰 검증
    if (!verifyCsrfToken($_POST['csrf_token'] ?? '')) {
        $result = "N";
        $msg = "보안 토큰이 유효하지 않습니다. 정상적으로 접근해 주세요.";
    } else {
        $username = sanitizeInput($_POST['username'] ?? '');
        $email = sanitizeInput($_POST['email'] ?? '');
        $phone = sanitizeInput($_POST['phone'] ?? '');
        $language_code = $_POST['language_code'] ?? 'ko';
        $password = $_POST['password'] ?? '';
        $confirm_password = $_POST['confirm_password'] ?? '';
        
        // 유효성 검사
        if (empty($username) || empty($email) || empty($password)) {
            $result = "N";
            $msg = "필수 정보를 입력해주세요.";
        } elseif (!validateEmail($email)) {
            $result = "N";
            $msg = "유효한 이메일 주소를 입력해주세요.";
        } elseif ($password !== $confirm_password) {
            $result = "N";
            $msg = "비밀번호가 일치하지 않습니다.";
        } else {
            // 비밀번호 강도 검사
            $password_errors = checkPasswordStrength($password);
            if (!empty($password_errors)) {
                $result = "N";
                $msg = "비밀번호 요구사항을 충족하지 않습니다";
            } else {
                $db = getDB();
                
                // 이메일 중복 확인
                $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
                $stmt->bind_param("s", $email);
                $stmt->execute();
                
                if ($stmt->get_result()->num_rows > 0) {
                    $result = "N";
                    $msg = "이미 사용 중인 이메일 주소입니다.";
                } else {
                    // 사용자명 중복 확인
                    $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
                    $stmt->bind_param("s", $username);
                    $stmt->execute();
                    
                    if ($stmt->get_result()->num_rows > 0) {
                        $result = "N";
                        $msg = "이미 사용 중인 사용자명입니다.";
                    } else {
                        try {
                            // 비밀번호 해싱
                            $password_hash = createPasswordHash($password);
                            
                            // 사용자 생성
                            $stmt = $db->prepare("INSERT INTO users (username, email, phone, language_code, password_hash) VALUES (?, ?, ?, ?, ?)");
                            $stmt->bind_param("sssss", $username, $email, $phone, $language_code, $password_hash);
                            
                            if ($stmt->execute()) {
                                $user_id = $stmt->insert_id;
                                
                                // 세션 생성
                                $_SESSION['user_id'] = $user_id;
                                $_SESSION['username'] = $username;
                                $_SESSION['language_code'] = $language_code;
                                
                                // 성공 메시지 표시 후 리다이렉트
                                $result = "Y";
                                $msg = "회원가입이 완료되었습니다! 3초 후 채팅 페이지로 이동합니다.";
                                
                            } else {
                                $result = "N";
                                $msg = "회원가입에 실패했습니다. 다시 시도해주세요.";
                            }
                        } catch (Exception $e) {
                            $result = "N";
                            $msg = "데이터베이스 오류: " . $e->getMessage();
                        }
                    }
                }
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