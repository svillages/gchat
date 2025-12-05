// 비밀번호 표시/숨기기 토글
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleButton = document.querySelector('.password-toggle i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleButton.className = 'fas fa-eye';
    }
}

// 소셜 로그인 (구현 필요)
function socialLogin(provider) {
    alert(provider + ' 로그인 기능은 준비 중입니다.');
}

// 엔터 키로 폼 제출
document.getElementById('loginForm').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && e.target.type !== 'textarea') {
        e.preventDefault();
        this.submit();
    }
});

// 페이지 로드 시 이메일 필드에 포커스
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('email').focus();
});