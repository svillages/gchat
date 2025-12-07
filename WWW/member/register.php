<?php
require_once '../config.php';
require_once $SET_SITE_ROOT.'/common/lib/lib.php';

$error = '';
$success = '';

$site_title = "G-Chat - 회원가입";
$css = "register.css";
require_once $SET_SITE_ROOT.'/common/include/header.php';
?>
<body>
    <div class="register-container">
        <div class="logo">
            <h1>G-Chat 회원가입</h1>
            <p>다국어 실시간 채팅 시작하기</p>
        </div>
        
        <form method="POST" id="registerForm" onsubmit="return registerOK();">
            <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token'];?>">
            
            <div class="form-group">
                <label for="username" class="required">사용자 이름</label>
                <div class="input-with-icon">
                    <input type="text" id="username" name="username" 
                           value="<?php echo htmlspecialchars($_POST['username'] ?? ''); ?>" 
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
                               value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>" 
                               required
                               placeholder="example@gmail.com">
                        <i class="fas fa-envelope"></i>
                    </div>
                </div>
                <div class="form-group">
                    <label for="phone">전화번호</label>
                    <div class="input-with-icon">
                        <input type="tel" id="phone" name="phone" 
                               value="<?php echo htmlspecialchars($_POST['phone'] ?? ''); ?>"
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
                    <span>G-Chat의 <a href="/help/terms.html" target="_blank">이용약관</a>과 <a href="/help/privacy.html" target="_blank">개인정보처리방침</a>에 동의합니다.</span>
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
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js"></script>
<script src="/common/js/register.js?v=<?php echo VERSION;?>"></script>