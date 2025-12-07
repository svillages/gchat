// 비밀번호 강도 검사
function checkPasswordStrength() {
    const password = document.getElementById('password').value;
    const strengthText = document.getElementById('strengthText');
    const strengthMeter = document.getElementById('strengthMeter');
    const passwordStrength = document.getElementById('passwordStrength');
    
    // 요구사항 체크
    const reqLength = document.getElementById('reqLength');
    const reqUppercase = document.getElementById('reqUppercase');
    const reqLowercase = document.getElementById('reqLowercase');
    const reqNumber = document.getElementById('reqNumber');
    const reqSpecial = document.getElementById('reqSpecial');
    
    let strength = 0;
    
    // 길이 검사
    if (password.length >= 8) {
        strength += 1;
        reqLength.innerHTML = '<i class="fas fa-check requirement-met"></i> 최소 8자 이상';
    } else {
        reqLength.innerHTML = '<i class="fas fa-times requirement-not-met"></i> 최소 8자 이상';
    }
    
    // 대문자 검사
    if (/[A-Z]/.test(password)) {
        strength += 1;
        reqUppercase.innerHTML = '<i class="fas fa-check requirement-met"></i> 대문자 포함';
    } else {
        reqUppercase.innerHTML = '<i class="fas fa-times requirement-not-met"></i> 대문자 포함';
    }
    
    // 소문자 검사
    if (/[a-z]/.test(password)) {
        strength += 1;
        reqLowercase.innerHTML = '<i class="fas fa-check requirement-met"></i> 소문자 포함';
    } else {
        reqLowercase.innerHTML = '<i class="fas fa-times requirement-not-met"></i> 소문자 포함';
    }
    
    // 숫자 검사
    if (/[0-9]/.test(password)) {
        strength += 1;
        reqNumber.innerHTML = '<i class="fas fa-check requirement-met"></i> 숫자 포함';
    } else {
        reqNumber.innerHTML = '<i class="fas fa-times requirement-not-met"></i> 숫자 포함';
    }
    
    // 특수문자 검사
    if (/[!@#$%^&*()\-_=+{};:,<.>]/.test(password)) {
        strength += 1;
        reqSpecial.innerHTML = '<i class="fas fa-check requirement-met"></i> 특수문자 포함';
    } else {
        reqSpecial.innerHTML = '<i class="fas fa-times requirement-not-met"></i> 특수문자 포함';
    }
    
    // 강도 표시
    if (password.length > 0) {
        passwordStrength.style.display = 'block';
        
        if (strength <= 2) {
            strengthText.textContent = '약함';
            strengthMeter.className = 'strength-meter-fill strength-weak';
        } else if (strength <= 4) {
            strengthText.textContent = '보통';
            strengthMeter.className = 'strength-meter-fill strength-medium';
        } else {
            strengthText.textContent = '강함';
            strengthMeter.className = 'strength-meter-fill strength-strong';
        }
    } else {
        passwordStrength.style.display = 'none';
    }
    
    // 비밀번호 일치 검사도 실행
    checkPasswordMatch();
}

// 비밀번호 일치 검사
function checkPasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const matchElement = document.getElementById('passwordMatch');
    const submitBtn = document.getElementById('submitBtn');
    
    if (password.length === 0 || confirmPassword.length === 0) {
        matchElement.innerHTML = '';
        submitBtn.disabled = true;
        return;
    }
    
    if (password === confirmPassword) {
        matchElement.innerHTML = '<i class="fas fa-check" style="color: #2ecc71;"></i> 비밀번호가 일치합니다';
        matchElement.style.color = '#2ecc71';
        submitBtn.disabled = false;
    } else {
        matchElement.innerHTML = '<i class="fas fa-times" style="color: #e74c3c;"></i> 비밀번호가 일치하지 않습니다';
        matchElement.style.color = '#e74c3c';
        submitBtn.disabled = true;
    }
}

// 폼 제출 전 최종 검증
function registerOK() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // 비밀번호 일치 확인
    if (password !== confirmPassword) {
		toastr["error"]("비밀번호가 일치하지 않습니다.");
        return false;
    }
    
    // 약관 동의 확인
    if (!agreeTerms) {
		toastr["warning"]("이용약관에 동의해야 합니다.");
        return false;
    }
    
    // 비밀번호 강도 검사
    const passwordErrors = [];
    if (password.length < 8) passwordErrors.push('비밀번호는 최소 8자 이상이어야 합니다.');
    if (!/[A-Z]/.test(password)) passwordErrors.push('비밀번호에 최소 1개의 대문자가 포함되어야 합니다.');
    if (!/[a-z]/.test(password)) passwordErrors.push('비밀번호에 최소 1개의 소문자가 포함되어야 합니다.');
    if (!/[0-9]/.test(password)) passwordErrors.push('비밀번호에 최소 1개의 숫자가 포함되어야 합니다.');
    if (!/[!@#$%^&*()\-_=+{};:,<.>]/.test(password)) passwordErrors.push('비밀번호에 최소 1개의 특수문자가 포함되어야 합니다.');
    
    if (passwordErrors.length > 0) {
        alert('비밀번호 요구사항을 충족하지 않습니다:\n\n' + passwordErrors.join('\n'));
		return false;
    }
	
	let formData = $("#registerForm").serialize();
	
	$.ajax({
	  url: '/ajax/register_ok',
	  type: 'POST',
	  data: formData,
	  success: function(response) {
		data = JSON.parse(response.trim());
		if(data['result']=='Y') {
	    	document.location.replace("/");
	    	return false;    	
	    } else {
	    	toastr["error"](data['msg']);
	    	return false;
	    }
	    
	  },
	  error: function(error) {
	    toastr["error"]("에러가 발생했습니다. 다시 시도해 주세요.");
		return false;
	  }
	});
	return false;
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    checkPasswordStrength();
    checkPasswordMatch();
});