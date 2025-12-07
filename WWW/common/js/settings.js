// 언어 선택 업데이트
function updateLanguageSelection() {
    const selectedValue = document.getElementById('language_code').value;
    document.querySelectorAll('.language-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`.language-option[onclick*="'${selectedValue}'"]`).classList.add('selected');
}

function updateProfile() {
	let jsonData = {}; 
	
	jsonData['username'] = $("#username").val();
	jsonData['email'] = $("#email").val();
	jsonData['phone'] = $("#phone").val();
	jsonData['language_code'] = $("#language_code").val();
	jsonData['csrftoken'] = $("#csrftoken").val();
	jsonData['user_id'] = $("#user_id").val();
	jsonData['code'] = "update_profile";
	
	if(jsonData['username'] =="") {
		toastr["error"]("사용자 이름을 입력해 주세요.");
		$("#username").focus();
		return false;
	}
	if(jsonData['email'] =="") {
		toastr["warning"]("이메일을 입력해 주세요.");
		$("#email").focus();
		return false;
	}
	console.log(jsonData);
	$.ajax({
	  url: '/ajax/settings_ok',
	  type: 'POST',
	  data: jsonData,
	  success: function(response) {
		console.log(response);
		data = JSON.parse(response.trim());
		if(data['result']=='Y') {
	    	toastr["success"](data['msg']);
	    	return false	    	
	    } else {
	    	toastr["error"](data['msg']);
	    	return false
	    }
	    
	  },
	  error: function(error) {
	    toastr["error"]("에러가 발생했습니다. 다시 시도해 주세요.");
		return false
	  }
	});
	return false;
}
function changePassword() {
	let jsonData = {}; 
	
	jsonData['current_password'] = $("#current_password").val();
	jsonData['new_password'] = $("#new_password").val();
	jsonData['confirm_password'] = $("#confirm_password").val();
	jsonData['csrftoken'] = $("#csrftoken").val();
	jsonData['user_id'] = $("#user_id").val();
	jsonData['code'] = "change_password";
	
	if(jsonData['current_password'] =="") {
		toastr["warning"]("현재 비밀번호를 입력해 주세요.");
		$("#current_password").focus();
		return false;
	}
	if(jsonData['new_password'] =="") {
		toastr["warning"]("새 비밀번호를 입력해 주세요.");
		$("#new_password").focus();
		return false;
	}
	if(jsonData['confirm_password'] =="") {
		toastr["warning"]("새 비밀번호를 확인해 주세요.");
		$("#confirm_password").focus();
		return false;
	}
	
	$.ajax({
	  url: '/ajax/settings_ok',
	  type: 'POST',
	  data: jsonData,
	  success: function(response) {
		console.log(response);
		data = JSON.parse(response.trim());
		if(data['result']=='Y') {
	    	toastr["success"](data['msg']);
			$("#current_password").val("");
			$("#new_password").val("");
			$("#confirm_password").val("");
	    	return false	    	
	    } else {
	    	toastr["error"](data['msg']);
	    	return false
	    }
	    
	  },
	  error: function(error) {
	    toastr["error"]("에러가 발생했습니다. 다시 시도해 주세요.");
		return false
	  }
	});
	return false;
}
// 페이지 로드 시 선택된 언어 표시
document.addEventListener('DOMContentLoaded', function() {
    updateLanguageSelection();
});

// 계정 삭제 확인
function confirmAccountDeletion() {
    
    if ($("#confirm_delete").val() !== "DELETE") {
        toastr["warning"]('정확히 "DELETE"를 입력해주세요.');
        $("#confirm_delete").focus();
        return false;
    }
	
	if(confirm('⚠️ 경고: 이 작업은 되돌릴 수 없습니다.\n\n정말로 계정을 삭제하시겠습니까?\n계정 삭제 시 모든 채팅 기록, 설정 및 개인정보가 영구적으로 삭제됩니다.')) {
		let jsonData = {}; 
		
		jsonData['confirm_delete'] = $("#confirm_delete").val();
		jsonData['csrftoken'] = $("#csrftoken").val();
		jsonData['user_id'] = $("#user_id").val();
		jsonData['code'] = "confirm_delete";
		
		$.ajax({
		  url: '/ajax/settings_ok',
		  type: 'POST',
		  data: jsonData,
		  success: function(response) {
			data = JSON.parse(response.trim());
			if(data['result']=='Y') {
		    	document.location.replace("/");
		    	return false	    	
		    } else {
		    	toastr["error"](data['msg']);
		    	return false
		    }
		  },
		  error: function(error) {
		    toastr["error"]("에러가 발생했습니다. 다시 시도해 주세요.");
			return false
		  }
		});
		return false;
	}
}

// 비밀번호 일치 확인
document.getElementById('new_password')?.addEventListener('input', function() {
    const newPassword = this.value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const submitButton = document.querySelector('button[name="change_password"]');
	const submitButtontitle = document.getElementById('passbutton');
    
    if (confirmPassword && newPassword !== confirmPassword) {
        submitButton.disabled = true;        
        submitButton.style.opacity = '0.6';
		submitButtontitle.innerHTML = '비밀번호가 일치하지 않습니다';
    } else {
        submitButton.disabled = false;        
        submitButton.style.opacity = '1';
		submitButtontitle.innerHTML = '비밀번호 변경';
    }
});

document.getElementById('confirm_password')?.addEventListener('input', function() {
    const newPassword = document.getElementById('new_password').value;
    const confirmPassword = this.value;
	const submitButton = document.querySelector('button[name="change_password"]');
	const submitButtontitle = document.getElementById('passbutton');
    
    if (newPassword && newPassword !== confirmPassword) {
        submitButton.disabled = true;
		submitButton.style.opacity = '0.6';
		submitButtontitle.innerHTML = '비밀번호가 일치하지 않습니다';
    } else {
        submitButton.disabled = false;
		submitButton.style.opacity = '1';
		submitButtontitle.innerHTML = '비밀번호 변경';
    }
});