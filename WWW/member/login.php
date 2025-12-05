<?php
require_once '../config.php';
require_once $SET_SITE_ROOT.'/common/lib/lib.php';
require_once $SET_SITE_ROOT.'/common/lib/dbconn.php';

// 이미 로그인된 사용자는 메인 페이지로 리다이렉트
if (isset($_SESSION['user_id'])) {
    header('Location: /');
    exit;
}

$db = getDB();
$error = '';
$csrf_token = generateCsrfToken();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // CSRF 토큰 검증
    if (!verifyCsrfToken($_POST['csrf_token'] ?? '')) {
        $error = "보안 토큰이 유효하지 않습니다. 페이지를 새로고침 후 다시 시도해주세요.";
    } else {
        $email = sanitizeInput($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        
        // 유효성 검사
        if (empty($email) || empty($password)) {
            $error = "이메일과 비밀번호를 입력해주세요.";
        } elseif (!validateEmail($email)) {
            $error = "유효한 이메일 주소를 입력해주세요.";
        } else {
            try {
                // 사용자 정보 조회 (비밀번호 해시 포함)
                $stmt = $db->prepare("SELECT id, username, password_hash, language_code FROM users WHERE email = ?");
                $stmt->bind_param("s", $email);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($result->num_rows === 0) {
                    $error = "이메일 또는 비밀번호가 잘못되었습니다.";
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
                        
                        // 리다이렉트
                        header('Location: /');
                        exit;
                    } else {
                        // 비밀번호가 일치하지 않음
                        $error = "이메일 또는 비밀번호가 잘못되었습니다.";
                        
                        // 실패 횟수 추적 (실제 운영시에는 구현 필요)
                        // 보안을 위해 자세한 오류 메시지는 표시하지 않음
                    }
                }
            } catch (Exception $e) {
                $error = "로그인 처리 중 오류가 발생했습니다.";
                error_log("Login error: " . $e->getMessage());
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>로그인 - G-Chat</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/common/css/login.css?v=<?php echo VERSION;?>">
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <h1>G-Chat</h1>
            <p>다국어 실시간 채팅</p>
        </div>
        
        <?php if (!empty($error)): ?>
            <div class="message error-message">
                <i class="fas fa-exclamation-circle"></i> <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>
        
        <form method="POST" id="loginForm">
            <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">
            
            <div class="form-group">
                <label for="email">이메일</label>
                <div class="input-with-icon">
                    <input type="email" id="email" name="email" 
                           value="<?= htmlspecialchars($_POST['email'] ?? '') ?>" 
                           required
                           placeholder="이메일을 입력하세요">
                    <i class="fas fa-envelope"></i>
                </div>
            </div>
            
            <div class="form-group">
                <label for="password">비밀번호</label>
                <div class="input-with-icon">
                    <input type="password" id="password" name="password" 
                           required
                           placeholder="비밀번호를 입력하세요">
                    <button type="button" class="password-toggle" onclick="togglePassword()">
                        <i class="fas fa-eye"></i>
                    </button>
                    <i class="fas fa-lock"></i>
                </div>
            </div>
            
            <div class="remember-forgot">
                <div class="remember-me">
                    <input type="checkbox" id="remember" name="remember">
                    <label for="remember">로그인 상태 유지</label>
                </div>
                <div class="forgot-password">
                    <a href="/forgot_password.php">비밀번호를 잊으셨나요?</a>
                </div>
            </div>
            
            <button type="submit" class="btn">
                <i class="fas fa-sign-in-alt"></i> 로그인
            </button>
            
            <!--
            <div class="divider">
                <span>또는</span>
            </div>
            
            <div class="social-login">
                <button type="button" class="social-btn google" onclick="socialLogin('google')">
                    <i class="fab fa-google"></i> Google
                </button>
                <button type="button" class="social-btn github" onclick="socialLogin('github')">
                    <i class="fab fa-github"></i> GitHub
                </button>
            </div>
            -->
        </form>
        
        <div class="links">
            <p>계정이 없으신가요? <a href="/member/register">회원가입</a></p>
        </div>
    </div>

</body>
</html>
<script src="/common/js/login.js?v=<?php echo VERSION;?>"></script>