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

function loginOK() {
	const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // 이메일 입력
    if (email == "") {
		toastr["error"]("이메일을 입력해 주세요.");
        return false;
    }
    
    // 비밀번호 입력
    if (password == "") {
		toastr["warning"]("비밀번호를 입력해 주세요.");
        return false;
    }

	let formData = $("#loginForm").serialize();
	
	$.ajax({
	  url: '/ajax/login_ok',
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

// 엔터 키로 폼 제출
document.getElementById('loginForm').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && e.target.type !== 'textarea') {
        e.preventDefault();
        loginOK();
    }
});

// 페이지 로드 시 이메일 필드에 포커스
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('email').focus();
});