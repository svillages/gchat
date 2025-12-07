// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    loadChats();
    connectWebSocket();
});

// WebSocket 연결
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws = new WebSocket(wsUrl);

    ws.onopen = function() {
        console.log('WebSocket 연결 성공');
        // 사용자 정보 전송
        ws.send(JSON.stringify({
            type: 'auth',
            userId: currentUserId,
            languageCode: currentUserLang
        }));
    };

    // WebSocket 메시지 처리
    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        
		//console.log(data);
		
        switch(data.type) {
			case 'message':
	            displayMessage(data.message);
	            break;
	        case 'translated_message':
	            displayTranslatedMessage(data.message);
	            break;
	        case 'room_created':
	            loadChats();
	            hideNewChatModal();
	            break;
	        case 'room_invitation':
				loadChats();
	            handleRoomInvitation(data);
	            break;
	        case 'member_added':
				loadChats();
	            handleMemberAdded(data);
	            break;
	        case 'member_added_notification':
	            handleMemberAddedNotification(data);
	            break;
	        case 'refresh_room_members':
	            refreshRoomMembers(data);
	            break;
	        case 'members_added_result':
	            handleMembersAddedResult(data);
	            break;
	        case 'error':
	            showNotification(data.message, 'error');
	            break;
	    }
    };

    ws.onclose = function() {
        console.log('WebSocket 연결 종료, 3초 후 재연결...');
        setTimeout(connectWebSocket, 3000);
    };
}

// 멤버 추가 결과 처리
function handleMembersAddedResult(data) {
    if (data.success) {
        showNotification(data.message, 'success');
        
        // 추가된 멤버 정보 업데이트
        if (data.addedMembersInfo && data.addedMembersInfo.length > 0) {
            data.addedMembersInfo.forEach(member => {
                addMemberToUI(member);
            });
        }
    } else {
        showNotification(data.message, 'error');
    }
}

// 멤버 추가 알림 처리 (새로 추가된 멤버에게)
function handleMemberAdded(data) {
    if (data.roomId === currentRoomId) {
        // 현재 채팅방에 추가된 경우
        showNotification(data.message || '채팅방에 추가되었습니다!', 'info');
        
        // 채팅방 정보 새로고침
        loadRoomInfo(currentRoomId);
        
        // WebSocket으로 채팅방 참여 알림
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'join_room',
                roomId: currentRoomId
            }));
        }
    } else {
        // 다른 채팅방에 추가된 경우 알림만
        showNotification(`${data.newMember?.username}님이 ${data.roomName} 채팅방에 추가되었습니다.`, 'info');
    }
}

// 멤버 추가 알림 처리 (기존 멤버들에게)
function handleMemberAddedNotification(data) {
    if (data.roomId === currentRoomId) {
        // 현재 채팅방에 멤버가 추가된 경우
        showNotification(data.message, 'info');
        
        // 채팅방 멤버 목록 새로고침
        refreshRoomMembers(data.roomId);
        
        // 추가된 멤버들을 UI에 추가
        if (data.addedMembers && data.addedMembers.length > 0) {
            data.addedMembers.forEach(member => {
                addMemberToUI(member);
            });
        }
    }
}

// 채팅방 초대 처리
function handleRoomInvitation(data) {
    const confirmAdd = confirm(`${data.roomName} 채팅방에 초대되었습니다. 참여하시겠습니까?`);
    
    if (confirmAdd) {
        // 채팅방 참여
        joinChatRoom(data.roomId);
        
        // 서버에 참여 알림
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'join_room',
                roomId: data.roomId
            }));
        }
    }
}

// 채팅방 멤버 새로고침
async function refreshRoomMembers(roomId) {
    if (roomId === currentRoomId) {
        await loadRoomInfo(roomId);
    }
}

// UI에 멤버 추가
function addMemberToUI(member) {
    const chatMembers = document.getElementById('chatMembers');
    if (!chatMembers) return;
    
    // 이미 추가되어 있는지 확인
    const existingMember = chatMembers.querySelector(`[data-user-id="${member.id}"]`);
    if (existingMember) return;
    
    const memberTag = document.createElement('div');
    memberTag.className = 'member-tag';
    memberTag.dataset.userId = member.id;
    memberTag.innerHTML = `
        ${member.flag || '👤'} ${escapeHtml(member.username)}
        <span>(${member.language_name})</span>
    `;
    chatMembers.appendChild(memberTag);
}

// 사용자 추가 요청 함수 수정
async function addUsersToRoom() {
    if (!currentRoomId) {
        alert('채팅방 정보를 찾을 수 없습니다.');
        return false;
    }
    
    if (selectedUsersToAdd.length === 0) {
        alert('추가할 사용자를 선택해주세요.');
        return false;
    }
    
    // 로딩 표시
    const addButton = document.querySelector('#addUserModal .btn-primary');
    const originalText = addButton.textContent;
    addButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 처리중...';
    addButton.disabled = true;
    
    try {
        // WebSocket으로 멤버 추가 요청
        ws.send(JSON.stringify({
            type: 'add_member',
            roomId: currentRoomId,
            userIds: selectedUsersToAdd.map(users => users.id)
        }));
        
        // 모달 닫기 (서버 응답을 기다리지 않고 닫음)
        hideAddUserModal();
        
        // 선택된 사용자 초기화
        selectedUsersToAdd = [];
        
    } catch (error) {
        console.error('사용자 추가 중 오류:', error);
        alert('사용자 추가 중 오류가 발생했습니다.');
        
        // 버튼 상태 복원
        addButton.textContent = originalText;
        addButton.disabled = false;
    }
    
    return false;
}
// 채팅 목록 로드
async function loadChats() {
    try {
        const response = await fetch('/api/chats');
        const chats = await response.json();
        
        const chatList = document.getElementById('chatList');
        chatList.innerHTML = '';
        
        chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.innerHTML = `
                <div class="chat-item-header">
                    <div class="chat-name">${escapeHtml(chat.room_name)}</div>
                    <div class="chat-time">${formatTime(chat.last_message_time)}</div>
                </div>
                <div class="chat-preview">${escapeHtml(chat.last_message || '아직 메시지가 없습니다')}</div>
            `;
            
			// 클릭 이벤트 추가
            chatItem.addEventListener('click', function(e) {
                joinChatRoom(chat.room_id);
            });
            chatList.appendChild(chatItem);
        });
    } catch (error) {
        console.error('채팅 목록 로드 실패:', error);
    }
}

// 채팅방 참여
function joinChatRoom(roomId) {
	currentRoomId = roomId;
	        
    // 채팅방 활성화 표시
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const chatItem = event.target.closest('.chat-item');
    if (chatItem) {
        chatItem.classList.add('active');
    }
    
    // 채팅 입력 활성화
    document.getElementById('messageInput').disabled = false;
    document.getElementById('sendButton').disabled = false;
    
    // 채팅방 정보 및 메시지 로드
    loadRoomInfo(roomId);
    loadMessages(roomId);
    
    // WebSocket으로 채팅방 참여 알림
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'join_room',
            roomId: roomId
        }));
    }
    
    // 모바일 환경에서 화면 전환
    if (isMobile()) {
        // 사이드바 숨기기
        document.querySelector('.sidebar').classList.add('hidden');
        // 메인 채팅 영역 보이기
        document.getElementById('chatMain').classList.add('active');
    }
	// 히스토리 업데이트
	updateHistoryState('chat', roomId);
}


// UI에서 멤버 제거
function removeMemberFromUI(userId) {
    const chatMembers = document.getElementById('chatMembers');
    if (!chatMembers) return;
    
    const memberTag = chatMembers.querySelector(`[data-user-id="${userId}"]`);
    if (memberTag) {
        memberTag.remove();
    }
}
// 채팅방 정보 로드
async function loadRoomInfo(roomId) {
    try {
        const response = await fetch(`/api/room_info?room_id=${roomId}`);
        const roomInfo = await response.json();
        
		// 기존 멤버 정보 저장
		existingRoomMembers = roomInfo.members.map(member => member.id);
					
        const chatHeader = document.getElementById('chatHeader');
        const chatTitle = document.querySelector('.chat-title');
        
        chatTitle.innerHTML = `
            <h2>${escapeHtml(roomInfo.room_name)}</h2>
            <div class="chat-members" id="chatMembers">
                ${roomInfo.members.map(member => `
                    <div class="member-tag" data-user-id="${member.id}">
                        ${member.flag || '👤'} ${escapeHtml(member.username)}
                        <span>(${member.language_name})</span>
                    </div>
                `).join('')}
            </div>
        `;
        
    } catch (error) {
        console.error('채팅방 정보 로드 실패:', error);
    }
}

// 사용자 추가 관련 변수
let selectedUsersToAdd = [];
let existingRoomMembers = []; // 현재 채팅방 멤버 목록 저장

// 사용자 추가 모달 표시
function showAddUserModal() {
    // 현재 채팅방이 선택되어 있는지 확인
    if (!currentRoomId) {
        alert('채팅방을 먼저 선택해주세요.');
        return false;
    }
    
    // 기존 채팅방 멤버 정보 가져오기
    loadExistingRoomMembers();
    
    // 초기화
    selectedUsersToAdd = [];
    updateSelectedUsersDisplay();
    document.getElementById('userSearchResultsToAdd').innerHTML = '';
    document.getElementById('userSearchToAdd').value = '';
    
    // 모달 제목 설정
    document.getElementById('addUserModalSubtitle').textContent = 
        `현재 채팅방에 사용자를 추가합니다.`;
    
    // 모달 표시
    const modal = document.getElementById('addUserModal');
    modal.style.display = 'flex';
    
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    return false;
}

// 사용자 추가 모달 숨기기
function hideAddUserModal(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const modal = document.getElementById('addUserModal');
    if (!modal) return false;
    
    modal.classList.remove('show');
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    
    return false;
}

// 기존 채팅방 멤버 정보 로드
async function loadExistingRoomMembers() {
    try {
        const response = await fetch(`/api/room_info?room_id=${currentRoomId}`);
        const roomInfo = await response.json();
        
        // 기존 멤버 ID 저장
        existingRoomMembers = roomInfo.members.map(member => member.id);
        
        //console.log('기존 채팅방 멤버:', existingRoomMembers);
    } catch (error) {
        //console.error('채팅방 멤버 정보 로드 실패:', error);
    }
}

// 사용자 추가 검색
async function searchUsersToAdd(query) {
    if (!query.trim()) {
        document.getElementById('userSearchResultsToAdd').innerHTML = '';
        return;
    }
    
    try {
        const response = await fetch(`/api/search_users?q=${encodeURIComponent(query)}&exclude_self=true`);
        const users = await response.json();
        
        const resultsDiv = document.getElementById('userSearchResultsToAdd');
        resultsDiv.innerHTML = '';
        
        users.forEach(user => {
            // 이미 선택되었는지 확인
            const isSelected = selectedUsersToAdd.some(users => users.id === user.id);
            // 이미 채팅방 멤버인지 확인
            const isExistingMember = existingRoomMembers.includes(user.id);
            
            const userDiv = document.createElement('div');
            userDiv.className = 'user-option';
            
            if (isExistingMember) {
                userDiv.innerHTML = `
                    <div class="user-option-info">
                        <div class="user-option-name">
                            ${escapeHtml(user.username)}
                            <span class="existing-badge">기존 멤버</span>
                        </div>
                        <div class="user-option-details">${user.language_code}</div>
                    </div>
                    <button type="button" class="select-user-btn" disabled>
                        이미 멤버
                    </button>
                `;
            } else {
                userDiv.innerHTML = `
                    <div class="user-option-info">
                        <div class="user-option-name">${escapeHtml(user.username)}</div>
                        <div class="user-option-details">${user.language_code}</div>
                    </div>
                    <button type="button" class="select-user-btn" 
                            onclick="selectUserToAdd(${user.id}, '${escapeHtml(user.username)}', '${user.language_code}')"
                            ${isSelected ? 'disabled' : ''}>
                        ${isSelected ? '선택됨' : '선택'}
                    </button>
                `;
            }
            
            resultsDiv.appendChild(userDiv);
        });
    } catch (error) {
        console.error('사용자 검색 실패:', error);
    }
}

// 사용자 선택
function selectUserToAdd(userId, username, languageName) {
	// 이미 선택되었는지 확인
    if (selectedUsersToAdd.some(users => users.id === userId)) {
        return;
    }
    
    // 이미 채팅방 멤버인지 확인
    if (existingRoomMembers.includes(userId)) {
        alert('이미 채팅방 멤버입니다.');
        return;
    }
    
    // 선택된 사용자 json 객체로 추가
    selectedUsersToAdd.push({
	    id: userId,
	    name: username,
	    language: languageName
	});
    
    // UI 업데이트
    updateSelectedUsersDisplay();
    
    // 검색 결과에서 버튼 비활성화
    updateSearchResultButtons();
    
    // 검색 입력란 초기화
    document.getElementById('userSearchToAdd').value = '';
    document.getElementById('userSearchResultsToAdd').innerHTML = '';
}

// 선택된 사용자 표시 업데이트
function updateSelectedUsersDisplay() {
    const selectedDiv = document.getElementById('selectedUsersToAdd');
    selectedDiv.innerHTML = '';
    
    if (selectedUsersToAdd.length === 0) {
        selectedDiv.innerHTML = '<div class="empty-message">선택된 사용자가 없습니다.</div>';
        return;
    }
    
    // TODO: 실제 사용자 정보를 가져와서 표시하는 것이 좋지만,
    // 현재는 간단히 ID만 표시
    selectedUsersToAdd.forEach(users => {
        // 사용자 정보는 이미 알고 있는 정보를 사용하거나 API로 가져옴
        const userTag = document.createElement('div');
        userTag.className = 'selected-user-tag';
		userTag.setAttribute('data-user-id', users.id);
        userTag.innerHTML = `
            <span class="user-name">사용자 이름 : ${users.name}</span>
			<span class="user-language">(${users.language})</span>
            <span class="remove-user" onclick="removeSelectedUser(${users.id})">
                <i class="fas fa-times"></i>
            </span>
        `;
        selectedDiv.appendChild(userTag);
    });
	// 선택된 사용자 수 표시
    const counter = document.createElement('div');
    counter.className = 'selected-counter';
    counter.textContent = `선택됨: ${selectedUsersToAdd.length}명`;
    selectedDiv.appendChild(counter);
}

// 선택된 사용자 제거
function removeSelectedUser(userId) {
    selectedUsersToAdd = selectedUsersToAdd.filter(users => users.id !== userId);
    updateSelectedUsersDisplay();
    updateSearchResultButtons();
}

// 검색 결과 버튼 상태 업데이트
function updateSearchResultButtons() {
    const buttons = document.querySelectorAll('.select-user-btn');
    buttons.forEach(button => {
        const onclickAttr = button.getAttribute('onclick');
        if (onclickAttr) {
            const match = onclickAttr.match(/selectUserToAdd\((\d+),/);
            if (match) {
                const userId = parseInt(match[1]);
                if (selectedUsersToAdd.some(users => users.id === userId)) {
                    button.disabled = true;
                    button.textContent = '선택됨';
                } else {
                    button.disabled = false;
                    button.textContent = '선택';
                }
            }
        }
    });
}
	
// 메시지 로드
async function loadMessages(roomId) {
    try {
        const response = await fetch(`/api/messages?room_id=${roomId}`);
        const messages = await response.json();
        
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        
        messages.forEach(message => {
            displayMessage(message);
        });
        
        // 스크롤을 최하단으로
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error('메시지 로드 실패:', error);
    }
}

// 메시지 표시
function displayMessage(message) {
    if (message.room_id != currentRoomId) return;
    
    const chatMessages = document.getElementById('chatMessages');
    const isSent = message.sender_id == currentUserId;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    messageDiv.dataset.messageId = message.id;  // 메시지 ID를 data 속성으로 저장
    messageDiv.dataset.senderId = message.sender_id;
    messageDiv.dataset.originalLang = message.original_lang;
    
	// 1. translated_message를 JSON으로 파싱
	let translations = {};
	try {
	    translations = JSON.parse(message.translated_message);
	} catch (e) {
	    //console.error("JSON parsing error:", e);
	}
	
	// 2. 원문 언어와 동일한 경우 → 원문 출력
	//if (currentUserLang === message.original_lang) {
	//    m = message.original_message;
	//} 
	// 3. 번역이 존재하는 경우 → 번역 출력
	//else
	 if (translations[currentUserLang]) {
	    savemessage = translations[currentUserLang];
	} 
	// 4. 번역이 없을 때 → fallback 처리
	else {
	    savemessage = message.original_message;
	}
	

    const senderName = isSent ? ' ' : escapeHtml(message.sender_name);
    const languageFlag = getLanguageFlag(message.original_lang);
    
    messageDiv.innerHTML = `
        <div class="message-sender">
            <span class="sender-name">${senderName}</span>
            <span class="language-flag">${languageFlag}</span>
        </div>
        <div class="message-content original-message">
            ${escapeHtml(savemessage)}
        </div>
        <div class="message-translations" id="translations-${message.id}">
            <!-- 번역된 메시지가 여기에 추가됩니다 -->
        </div>
        <div class="message-time">${formatTime(message.created_at)}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // 만약 이 메시지가 나에게 온 것이라면, 내 언어로 표시된 원본 메시지가 이미 보이므로
    // 추가 번역은 필요 없음
    if (!isSent && message.original_lang !== currentUserLang) {
        // 다른 언어로 된 메시지에 번역 버튼 추가
        //addTranslationButton(messageDiv, message.id, message.original_lang);
    }
}

// 번역된 메시지 표시
function displayTranslatedMessage(message) {
	
	//console.log(message);
	if (message.room_id != currentRoomId) return;
	    
    const chatMessages = document.getElementById('chatMessages');
    const isSent = message.sender_id == currentUserId;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    messageDiv.dataset.messageId = message.id;  // 메시지 ID를 data 속성으로 저장
    messageDiv.dataset.senderId = message.sender_id;
    messageDiv.dataset.originalLang = message.original_lang;
    
    const senderName = isSent ? ' ' : escapeHtml(message.sender_name);
    const languageFlag = getLanguageFlag(message.original_lang);
    
    messageDiv.innerHTML = `
        <div class="message-sender">
            <span class="sender-name">${senderName}</span>
            <span class="language-flag">${languageFlag}</span>
        </div>
        <div class="message-content target-message">
            ${escapeHtml(message.translated_message)}
        </div>
        <div class="message-translations" id="translations-${message.id}">
            <!-- 번역된 메시지가 여기에 추가됩니다 -->
        </div>
        <div class="message-time">${formatTime(message.created_at)}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // 만약 이 메시지가 나에게 온 것이라면, 내 언어로 표시된 원본 메시지가 이미 보이므로
    // 추가 번역은 필요 없음
    if (!isSent && message.original_lang !== currentUserLang) {
        // 다른 언어로 된 메시지에 번역 버튼 추가
        //addTranslationButton(messageDiv, message.id, message.original_lang);
    }
		
		
    
}
function displayTranslatedMessage_back(data) {
	if (data.room_id != currentRoomId) return;
	    
    const messageDiv = document.querySelector(`.message[data-message-id="${data.message_id}"]`);
    
    if (!messageDiv) {
        console.log('메시지를 찾을 수 없음:', data.message_id);
        return;
    }
    
    // 번역 컨테이너 찾기 또는 생성
    let translationsContainer = messageDiv.querySelector('.message-translations');
    if (!translationsContainer) {
        translationsContainer = document.createElement('div');
        translationsContainer.className = 'message-translations';
        messageDiv.appendChild(translationsContainer);
    }
    
    // 이미 같은 언어로 번역된 메시지가 있는지 확인
    const existingTranslation = translationsContainer.querySelector(`[data-target-lang="${data.target_language}"]`);
    if (existingTranslation) {
        // 이미 존재하면 업데이트
        existingTranslation.querySelector('.translated-text').textContent = escapeHtml(data.translated_message);
    } else {
        // 새로운 번역 메시지 추가
        const translationDiv = document.createElement('div');
        translationDiv.className = 'translation-message';
        translationDiv.dataset.targetLang = data.target_language;
        
        translationDiv.innerHTML = `
            <div class="translation-header">
                <span class="translation-language">${getLanguageName(data.target_language)} ${getLanguageFlag(data.target_language)}</span>
                <span class="translation-label">번역</span>
            </div>
            <div class="translation-content">
                <div class="translated-text">${escapeHtml(data.translated_message)}</div>
            </div>
        `;
        
        translationsContainer.appendChild(translationDiv);
    }
    
    // 번역 버튼 숨기기
    const translateBtn = messageDiv.querySelector('.translate-btn');
    if (translateBtn && data.target_language === currentUserLang) {
        translateBtn.style.display = 'none';
    }
}
// 번역 버튼 추가 함수
function addTranslationButton(messageDiv, messageId, originalLang) {
    // 이미 번역 버튼이 있는지 확인
    if (messageDiv.querySelector('.translate-btn')) return;
    
    const translateBtn = document.createElement('button');
    translateBtn.className = 'translate-btn';
    translateBtn.innerHTML = '<i class="fas fa-language"></i> 번역보기';
    translateBtn.onclick = function() {
        requestTranslation(messageId, originalLang, currentUserLang);
    };
    
    const messageContent = messageDiv.querySelector('.message-content');
    messageContent.appendChild(translateBtn);
}

// 번역 요청 함수
function requestTranslation(messageId, sourceLang, targetLang) {
    ws.send(JSON.stringify({
        type: 'request_translation',
        messageId: messageId,
        sourceLang: sourceLang,
        targetLang: targetLang,
        roomId: currentRoomId
    }));
}

// 언어 코드로 깃발 가져오기
function getLanguageFlag(langCode) {
	const country = langCode.split('-')[1].toLowerCase();
	
	return `<img src="/flags/4x3/${country}.svg">`;
    //return flags[langCode] || '🌐';
}

// 언어 코드로 언어 이름 가져오기
function getLanguageName(langCode) {
    const names = {
        'ko': '한국어',
        'zh': '중국어',
        'ja': '일본어',
        'en': '영어',
        'es': '스페인어',
        'fr': '프랑스어',
        'de': '독일어',
        'ru': '러시아어'
    };
    return names[langCode] || langCode;
}

// 채팅 멤버 업데이트
function updateChatMembers(roomId, user) {
    if (roomId !== currentRoomId) return;
    
    const chatMembers = document.getElementById('chatMembers');
    if (!chatMembers) return;
    
    const memberTag = document.createElement('div');
    memberTag.className = 'member-tag';
    memberTag.innerHTML = `
        ${getLanguageFlag(user.language_code)} ${escapeHtml(user.username)}
        <span>(${getLanguageName(user.language_code)})</span>
    `;
    chatMembers.appendChild(memberTag);
}

// 채팅 멤버 제거
function removeChatMember(roomId, userId) {
    if (roomId !== currentRoomId) return;
    
    const chatMembers = document.getElementById('chatMembers');
    if (!chatMembers) return;
    
    // 해당 사용자 찾아서 제거 (간단한 구현)
    // 실제로는 서버에서 업데이트된 멤버 목록을 받아서 전체 리렌더링하는 것이 좋음
}

// 알림 표시
function showNotification(message, type = 'info') {
	toastr[type](message);
}
// 메시지 전송
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message || !currentRoomId) return;
    
    ws.send(JSON.stringify({
        type: 'message',
        roomId: currentRoomId,
        message: message,
        languageCode: currentUserLang
    }));
    
    input.value = '';
}

// Enter 키로 메시지 전송
document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// 새 채팅방 모달 표시
function showNewChatModal() {
	if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // 초기화
    selectedUsers = [];
    document.getElementById('selectedUsers').innerHTML = '';
    document.getElementById('userSearchResults').innerHTML = '';
    document.getElementById('roomName').value = '';
    
    // 모달 표시
    const modal = document.getElementById('newChatModal');
    if (modal) {
        modal.style.display = 'flex';
        
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // 모바일에서 body 스크롤 방지
        if (isMobile()) {
            document.body.style.overflow = 'hidden';
        }
        
        // 히스토리 업데이트
        updateHistoryState('modal', null);
    }
    
    return false;
}

// 새 채팅방 모달 숨기기
// 모달 닫기 함수 수정
function hideNewChatModal(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const modal = document.getElementById('newChatModal');
    if (!modal) return false;
    
    // 애니메이션 제거
    modal.classList.remove('show');
    
    // 애니메이션 완료 후 숨기기
    setTimeout(() => {
        modal.style.display = 'none';
        
        // 모바일에서 body 스크롤 복원
        if (isMobile()) {
            document.body.style.overflow = '';
        }
    }, 0);
    
    return false;
}
// 사용자 검색
async function searchUsers(query) {
    if (!query.trim()) {
        document.getElementById('userSearchResults').innerHTML = '';
        return;
    }
    
    try {
        const response = await fetch(`/api/search_users?q=${encodeURIComponent(query)}`);
        const users = await response.json();
        
        const resultsDiv = document.getElementById('userSearchResults');
        resultsDiv.innerHTML = '';
        
        users.forEach(user => {
            if (user.id == currentUserId || selectedUsers.includes(user.id)) return;
            
            const userDiv = document.createElement('div');
            userDiv.className = 'user-option';
            userDiv.innerHTML = `
                <div>
                    <strong>${escapeHtml(user.username)}</strong>
                    <small>(${user.language_code})</small>
                </div>
            `;
            
            userDiv.onclick = () => selectUser(user);
            resultsDiv.appendChild(userDiv);
        });
    } catch (error) {
        console.error('사용자 검색 실패:', error);
    }
}

// 사용자 선택
function selectUser(user) {
    if (!selectedUsers.includes(user.id)) {
        selectedUsers.push(user.id);
        
        const selectedDiv = document.getElementById('selectedUsers');
        const userTag = document.createElement('span');
        userTag.className = 'member-tag';
        userTag.setAttribute('data-user-id', user.id); // 데이터 속성 추가
        userTag.innerHTML = `
            ${user.flag || '👤'} ${escapeHtml(user.username)}
            <i class="fas fa-times" onclick="removeUser(${user.id})" style="cursor: pointer; margin-left: 5px;"></i>
        `;
        selectedDiv.appendChild(userTag);
        
        document.getElementById('userSearchResults').innerHTML = '';
        document.getElementById('userSearch').value = '';
    }
}

// 사용자 제거
function removeUser(userId) {
	    
    // 배열에서 사용자 제거
    selectedUsers = selectedUsers.filter(id => id != userId);
    
    // 해당 사용자 태그 찾기
    const tagToRemove = document.querySelector(`.member-tag[data-user-id="${userId}"]`);
    if (tagToRemove) {
        tagToRemove.remove();
    }
}

// 새 채팅방 생성
function createNewChat() {
    const roomName = document.getElementById('roomName').value.trim();
    
    if (!roomName || selectedUsers.length === 0) {
        alert('채팅방 이름과 최소 1명의 사용자를 선택해주세요.');
        return;
    }
    
    ws.send(JSON.stringify({
        type: 'create_room',
        roomName: roomName,
        userIds: selectedUsers
    }));
}

// 유틸리티 함수들
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '방금';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ko-KR');
}

// 모바일 환경 확인 함수
function isMobile() {
    return window.innerWidth <= 768;
}


// 화면 크기 변경 시 처리
window.addEventListener('resize', function() {
    if (!isMobile()) {
        // 데스크탑 크기로 돌아오면 항상 양쪽 다 보이도록
        document.querySelector('.sidebar').classList.remove('hidden');
        document.getElementById('chatMain').classList.remove('active');
    }
});

// 페이지 로드 시 모바일 확인
document.addEventListener('DOMContentLoaded', function() {
	initHistoryState();
	
    if (isMobile()) {
        console.log('모바일 환경입니다');
        // 모바일에서는 초기에 사이드바만 보이도록
        document.querySelector('.sidebar').classList.remove('hidden');
        document.getElementById('chatMain').classList.remove('active');
    }
});

// ESC 키로 뒤로가기 (모바일 가상 키보드 제외)
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && isMobile() && currentRoomId) {
        goBackToSidebar();
    }
});

// 터치 제스처로 뒤로가기 (모바일)
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', function(event) {
    touchStartX = event.changedTouches[0].screenX;
}, false);

document.addEventListener('touchend', function(event) {
    touchEndX = event.changedTouches[0].screenX;
    handleSwipe();
}, false);

function handleSwipe() {
    // 오른쪽에서 왼쪽으로 스와이프 (뒤로가기)
    if (touchEndX < touchStartX - 100 && isMobile() && currentRoomId) {
        goBackToSidebar();
    }
}
// History API를 사용한 뒤로가기 관리
function navigateToChatRoom(roomId) {
    if (isMobile()) {
        // 히스토리 상태 추가
        history.pushState({ roomId: roomId, from: 'sidebar' }, '', `#chat-${roomId}`);
        joinChatRoom(roomId);
    } else {
        joinChatRoom(roomId);
    }
}
// 히스토리 상태 관리
    let currentViewState = 'sidebar'; // 'sidebar', 'chat', 'modal'
    
    // 히스토리 초기화
    function initHistoryState() {
        if (typeof history !== 'undefined') {
            // 초기 상태 설정
            history.replaceState({ 
                view: 'sidebar',
                roomId: null,
                timestamp: Date.now()
            }, '', window.location.pathname);
            
            // popstate 이벤트 리스너
            window.addEventListener('popstate', function(event) {
                handleBrowserBackButton(event);
            });
        }
    }
    
    // 브라우저 뒤로가기 버튼 처리
    function handleBrowserBackButton(event) {
        //console.log('브라우저 뒤로가기 버튼 클릭', event.state);
        
        if (event.state && event.state.view) {
            const targetView = event.state.view;
            
            if (targetView === 'sidebar') {
                // 사이드바로 돌아가기
                navigateToSidebar();
            } else if (targetView === 'chat' && event.state.roomId) {
                // 특정 채팅방으로 이동
                navigateToChatRoom(event.state.roomId);
            } else if (targetView === 'modal') {
                // 모달 열기 (이 경우는 드물지만)
                showNewChatModal();
            }
        } else {
            // 상태가 없으면 사이드바로
            navigateToSidebar();
        }
        
        // 페이지 이동 방지
        if (event) {
            event.preventDefault();
        }
    }
    
    // 사이드바로 네비게이션
    function navigateToSidebar() {
        //console.log('사이드바로 이동');
        
        // 현재 열려있는 것들 닫기
        const modal = document.getElementById('newChatModal');
        if (modal && modal.style.display === 'flex') {
            hideNewChatModal();
        }
        
        // 채팅방 닫기
        if (currentRoomId) {
            closeChatRoom();
        }
        
        // 화면 상태 업데이트
        const sidebar = document.querySelector('.sidebar');
        const chatMain = document.getElementById('chatMain');
        
        if (sidebar) sidebar.classList.remove('hidden');
        if (chatMain) chatMain.classList.remove('active');
        
        currentViewState = 'sidebar';
        currentRoomId = null;
        
        // 히스토리 업데이트
        updateHistoryState('sidebar', null);
    }
	// 채팅방 닫기
    function closeChatRoom() {
        if (!currentRoomId) return;
        
        // WebSocket에서 채팅방 나가기
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'leave_room',
                roomId: currentRoomId
            }));
        }
        
        // UI 초기화
        document.getElementById('messageInput').disabled = true;
        document.getElementById('sendButton').disabled = true;
        
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const chatTitle = document.querySelector('.chat-title h2');
        if (chatTitle) chatTitle.textContent = '채팅방을 선택하세요';
        
        const chatMembers = document.getElementById('chatMembers');
        if (chatMembers) chatMembers.innerHTML = '';
        
        currentRoomId = null;
    }
    
    // 채팅방으로 네비게이션
    function navigateToChatRoom(roomId) {
        if (!roomId) return;
        
        // 실제 채팅방 로직 실행
        joinChatRoom(roomId);
        
        // 히스토리 업데이트
        updateHistoryState('chat', roomId);
    }
    
    // 히스토리 상태 업데이트
    function updateHistoryState(view, roomId) {
        if (typeof history === 'undefined') return;
        
        const state = {
            view: view,
            roomId: roomId,
            timestamp: Date.now()
        };
        
        history.pushState(state, '', 
            view === 'chat' && roomId ? `#chat-${roomId}` : window.location.pathname);
        
        currentViewState = view;
    }
// 뒤로가기 버튼 클릭 시 사이드바로 돌아가기
function goBackToSidebar(event) {
    // 이벤트 전파 방지
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }
    
	// 모달이 열려있으면 모달만 닫기
    const modal = document.getElementById('newChatModal');
    if (modal && modal.style.display === 'flex') {
        hideNewChatModal(event);
        return false;
    }
    
    // 채팅방이 열려있으면 사이드바로
    if (isMobile() && currentRoomId) {
        navigateToSidebar();
        return false;
    }
    
    // 아무것도 아니면 기본 동작 방지만
    return false;
}
// 뒤로가기 버튼 처리
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.from === 'chat') {
        goBackToSidebar();
    } else if (event.state && event.state.from === 'sidebar') {
        navigateToChatRoom(event.state.roomId);
    }
});