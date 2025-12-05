// 언어 선택 업데이트
function updateLanguageSelection() {
    const selectedValue = document.getElementById('language_code').value;
    document.querySelectorAll('.language-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`.language-option[onclick*="'${selectedValue}'"]`).classList.add('selected');
}

// 페이지 로드 시 선택된 언어 표시
document.addEventListener('DOMContentLoaded', function() {
    updateLanguageSelection();
});

// 계정 삭제 확인
function confirmAccountDeletion() {
    return confirm('정말로 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.');
}

// 비밀번호 일치 확인
document.getElementById('new_password')?.addEventListener('input', function() {
    const newPassword = this.value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const submitButton = document.querySelector('button[name="change_password"]');
    
    if (confirmPassword && newPassword !== confirmPassword) {
        submitButton.disabled = true;
        submitButton.title = '비밀번호가 일치하지 않습니다';
        submitButton.style.opacity = '0.6';
    } else {
        submitButton.disabled = false;
        submitButton.title = '';
        submitButton.style.opacity = '1';
    }
});

document.getElementById('confirm_password')?.addEventListener('input', function() {
    const newPassword = document.getElementById('new_password').value;
    const confirmPassword = this.value;
    const submitButton = document.querySelector('button[name="change_password"]');
    
    if (newPassword && newPassword !== confirmPassword) {
        submitButton.disabled = true;
        submitButton.title = '비밀번호가 일치하지 않습니다';
        submitButton.style.opacity = '0.6';
    } else {
        submitButton.disabled = false;
        submitButton.title = '';
        submitButton.style.opacity = '1';
    }
});