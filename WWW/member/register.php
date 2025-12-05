<?php
require_once '../config.php';
require_once $SET_SITE_ROOT.'/common/lib/lib.php';
require_once $SET_SITE_ROOT.'/common/lib/dbconn.php';

$db = getDB();
$error = '';
$success = '';
$csrf_token = generateCsrfToken();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // CSRF 토큰 검증
    if (!verifyCsrfToken($_POST['csrf_token'] ?? '')) {
        $error = "보안 토큰이 유효하지 않습니다. 페이지를 새로고침 후 다시 시도해주세요.";
    } else {
        $username = sanitizeInput($_POST['username'] ?? '');
        $email = sanitizeInput($_POST['email'] ?? '');
        $phone = sanitizeInput($_POST['phone'] ?? '');
        $language_code = $_POST['language_code'] ?? 'ko';
        $password = $_POST['password'] ?? '';
        $confirm_password = $_POST['confirm_password'] ?? '';
        
        // 유효성 검사
        if (empty($username) || empty($email) || empty($password)) {
            $error = "필수 정보를 입력해주세요.";
        } elseif (!validateEmail($email)) {
            $error = "유효한 이메일 주소를 입력해주세요.";
        } elseif ($password !== $confirm_password) {
            $error = "비밀번호가 일치하지 않습니다.";
        } else {
            // 비밀번호 강도 검사
            $password_errors = checkPasswordStrength($password);
            if (!empty($password_errors)) {
                $error = implode("<br>", $password_errors);
            } else {
                // 이메일 중복 확인
                $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
                $stmt->bind_param("s", $email);
                $stmt->execute();
                
                if ($stmt->get_result()->num_rows > 0) {
                    $error = "이미 사용 중인 이메일 주소입니다.";
                } else {
                    // 사용자명 중복 확인
                    $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
                    $stmt->bind_param("s", $username);
                    $stmt->execute();
                    
                    if ($stmt->get_result()->num_rows > 0) {
                        $error = "이미 사용 중인 사용자명입니다.";
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
                                $success = "회원가입이 완료되었습니다! 3초 후 채팅 페이지로 이동합니다.";
                                echo "<script>
                                    setTimeout(function() {
                                        window.location.href = '/';
                                    }, 3000);
                                </script>";
                            } else {
                                $error = "회원가입에 실패했습니다. 다시 시도해주세요.";
                            }
                        } catch (Exception $e) {
                            $error = "데이터베이스 오류: " . $e->getMessage();
                        }
                    }
                }
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
    <title>회원가입 - G-Chat</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/common/css/register.css?v=<?php echo VERSION;?>">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.3.2/css/flag-icons.min.css" />
</head>
<body>
    <div class="register-container">
        <div class="logo">
            <h1>G-Chat 회원가입</h1>
            <p>다국어 실시간 채팅 시작하기</p>
        </div>
        
        <?php if (!empty($success)): ?>
            <div class="message success-message">
                <i class="fas fa-check-circle"></i> <?= htmlspecialchars($success) ?>
            </div>
        <?php endif; ?>
        
        <?php if (!empty($error)): ?>
            <div class="message error-message">
                <i class="fas fa-exclamation-circle"></i> <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>
        
        <form method="POST" id="registerForm">
            <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">
            
            <div class="form-group">
                <label for="username" class="required">사용자 이름</label>
                <div class="input-with-icon">
                    <input type="text" id="username" name="username" 
                           value="<?= htmlspecialchars($_POST['username'] ?? '') ?>" 
                           required
                           placeholder="사용자 이름을 입력하세요">
                    <i class="fas fa-user"></i>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="email" class="required">이메일</label>
                    <div class="input-with-icon">
                        <input type="email" id="email" name="email" 
                               value="<?= htmlspecialchars($_POST['email'] ?? '') ?>" 
                               required
                               placeholder="example@gmail.com">
                        <i class="fas fa-envelope"></i>
                    </div>
                </div>
                <div class="form-group">
                    <label for="phone">전화번호</label>
                    <div class="input-with-icon">
                        <input type="tel" id="phone" name="phone" 
                               value="<?= htmlspecialchars($_POST['phone'] ?? '') ?>"
                               placeholder="010-1234-5678">
                        <i class="fas fa-phone"></i>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label for="language_code" class="required">기본 언어</label>
                <select id="language_code" name="language_code" required>
<?php foreach($language_map as $code=>$names) { ?>
	<option value="<?php echo $code;?>"> <?php echo $names['flag']?> <?php echo $names['name']?></option>
<?php } ?>                
                </select>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="password" class="required">비밀번호</label>
                    <div class="input-with-icon">
                        <input type="password" id="password" name="password" 
                               required
                               placeholder="비밀번호를 입력하세요"
                               oninput="checkPasswordStrength()">
                        <i class="fas fa-lock"></i>
                    </div>
                    <div class="password-strength" id="passwordStrength">
                        <div>강도: <span id="strengthText">약함</span></div>
                        <div class="strength-meter">
                            <div class="strength-meter-fill" id="strengthMeter"></div>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="confirm_password" class="required">비밀번호 확인</label>
                    <div class="input-with-icon">
                        <input type="password" id="confirm_password" name="confirm_password" 
                               required
                               placeholder="비밀번호를 다시 입력하세요"
                               oninput="checkPasswordMatch()">
                        <i class="fas fa-lock"></i>
                    </div>
                    <div id="passwordMatch" style="margin-top: 5px; font-size: 14px;"></div>
                </div>
            </div>
            
            <div class="password-requirements" id="passwordRequirements">
                <strong>비밀번호 요구사항:</strong>
                <ul>
                    <li id="reqLength"><i class="fas fa-times requirement-not-met"></i> 최소 8자 이상</li>
                    <li id="reqUppercase"><i class="fas fa-times requirement-not-met"></i> 대문자 포함</li>
                    <li id="reqLowercase"><i class="fas fa-times requirement-not-met"></i> 소문자 포함</li>
                    <li id="reqNumber"><i class="fas fa-times requirement-not-met"></i> 숫자 포함</li>
                    <li id="reqSpecial"><i class="fas fa-times requirement-not-met"></i> 특수문자 포함</li>
                </ul>
            </div>
            
            <div class="terms">
                <label>
                    <input type="checkbox" name="agree_terms" id="agreeTerms" required>
                    <span>G-Chat의 <a href="/terms.php" target="_blank">이용약관</a>과 <a href="/privacy.php" target="_blank">개인정보처리방침</a>에 동의합니다.</span>
                </label>
            </div>
            
            <button type="submit" class="btn" id="submitBtn">
                <i class="fas fa-user-plus"></i> 회원가입
            </button>
        </form>
        
        <div class="links">
            <p>이미 계정이 있으신가요? <a href="/member/login">로그인</a></p>
        </div>
    </div>

</body>
</html>
<script src="/common/js/register.js?v=<?php echo VERSION;?>"></script>