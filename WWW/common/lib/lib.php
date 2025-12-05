<?php
// 비밀번호 해시 생성 함수
function createPasswordHash($password) {
    // PHP 7.2+에서는 password_hash()가 기본으로 salt를 생성
    $hash = password_hash($password, PASSWORD_ALGO, PASSWORD_OPTIONS);
    
    // 안전성을 위해 추가 검증
    if ($hash === false) {
        throw new Exception('비밀번호 해시 생성 실패');
    }
    
    return $hash;
}

// 비밀번호 검증 함수
function verifyPassword($password, $hash) {
    if (empty($hash) || $hash === 'temp_hash_needs_change') {
        return false;
    }
    
    return password_verify($password, $hash);
}

// 비밀번호 강도 검사 함수
function checkPasswordStrength($password) {
    $errors = [];
    
    // 최소 길이 검사
    if (strlen($password) < 8) {
        $errors[] = "비밀번호는 최소 8자 이상이어야 합니다.";
    }
    
    // 대문자 포함 검사
    if (!preg_match('/[A-Z]/', $password)) {
        $errors[] = "비밀번호에 최소 1개의 대문자가 포함되어야 합니다.";
    }
    
    // 소문자 포함 검사
    if (!preg_match('/[a-z]/', $password)) {
        $errors[] = "비밀번호에 최소 1개의 소문자가 포함되어야 합니다.";
    }
    
    // 숫자 포함 검사
    if (!preg_match('/[0-9]/', $password)) {
        $errors[] = "비밀번호에 최소 1개의 숫자가 포함되어야 합니다.";
    }
    
    // 특수문자 포함 검사
    if (!preg_match('/[!@#$%^&*()\-_=+{};:,<.>]/', $password)) {
        $errors[] = "비밀번호에 최소 1개의 특수문자가 포함되어야 합니다.";
    }
    
    // 일반적인 취약한 비밀번호 체크
    $weak_passwords = ['password', '12345678', 'qwerty123', 'admin123', 'letmein'];
    if (in_array(strtolower($password), $weak_passwords)) {
        $errors[] = "너무 흔한 비밀번호입니다. 다른 비밀번호를 사용해주세요.";
    }
    
    return $errors;
}

// CSRF 토큰 생성 및 검증
function generateCsrfToken() {
    if (empty($_SESSION['csrf_token'])) {
        if (function_exists('random_bytes')) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        } else {
            $_SESSION['csrf_token'] = bin2hex(openssl_random_pseudo_bytes(32));
        }
    }
    return $_SESSION['csrf_token'];
}

function verifyCsrfToken($token) {
    if (empty($_SESSION['csrf_token']) || empty($token)) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $token);
}

// 입력 데이터 정리 함수
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

// 이메일 형식 검증
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// 전화번호 형식 검증
function validatePhone($phone) {
    // 간단한 전화번호 검증 (숫자, +, -, 공백 허용)
    return preg_match('/^[\d\s\-\+\(\)]{10,20}$/', $phone);
}
//직접링크
function goUrl($msg, $url, $target = "top") {
    echo "<script language='JavaScript'>";
    if(!empty($msg)) {
        echo "alert(\"$msg\");";
    }
    if(empty($target)) {
        echo "document.location.replace('$url');";
    } else {
        echo "$target.document.location.replace('$url');";
    }
    echo "</script>";
    exit;
}
?>