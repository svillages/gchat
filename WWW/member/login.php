<?php
require_once '../config.php';
require_once $SET_SITE_ROOT.'/common/lib/lib.php';

// 이미 로그인된 사용자는 메인 페이지로 리다이렉트
if (isset($_SESSION['user_id'])) {
    header('Location: /');
    exit;
}

$csrf_token = generateCsrfToken();

$site_title = "G-Chat - 로그인";
$css = "login.css";
require_once $SET_SITE_ROOT.'/common/include/header.php';
?>
<body>
    <div class="login-container">
        <div class="logo">
            <h1>G-Chat</h1>
            <p>다국어 실시간 채팅</p>
        </div>

        
        <form method="POST" id="loginForm" onsubmit="return loginOK();">
            <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token'];?>">
            
            <div class="form-group">
                <label for="email">이메일</label>
                <div class="input-with-icon">
                    <input type="email" id="email" name="email" 
                           value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>" 
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
                    <a href="/member/find_password">비밀번호를 잊으셨나요?</a>
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
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js"></script>
<script src="/common/js/login.js?v=<?php echo VERSION;?>"></script>