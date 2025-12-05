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
        
		console.log(data);
		
        switch(data.type) {
            case 'message':
                displayMessage(data.message);
                break;
            case 'room_created':
                loadChats();
                hideNewChatModal();
                break;
            case 'translated_message':
                displayTranslatedMessage(data.message);
                break;
            case 'user_joined':
                updateChatMembers(data.roomId, data.user);
                break;
            case 'user_left':
                removeChatMember(data.roomId, data.userId);
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
            
            chatItem.onclick = () => joinChatRoom(chat.room_id);
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
    event.target.closest('.chat-item').classList.add('active');
    
    // 채팅 입력 활성화
    document.getElementById('messageInput').disabled = false;
    document.getElementById('sendButton').disabled = false;
    
    // 채팅방 정보 및 메시지 로드
    loadRoomInfo(roomId);
    loadMessages(roomId);
    
    // WebSocket으로 채팅방 참여 알림
    ws.send(JSON.stringify({
        type: 'join_room',
        roomId: roomId
    }));
}

// 채팅방 정보 로드
async function loadRoomInfo(roomId) {
    try {
        const response = await fetch(`/api/room_info?room_id=${roomId}`);
        const roomInfo = await response.json();
        
        const chatHeader = document.getElementById('chatHeader');
        chatHeader.innerHTML = `
            <div class="chat-title">
                <h2>${escapeHtml(roomInfo.room_name)}</h2>
                <div class="chat-members" id="chatMembers">
                    ${roomInfo.members.map(member => `
                        <div class="member-tag">
                            ${member.flag || '👤'} ${escapeHtml(member.username)}
                            <span>(${member.language_name})</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('채팅방 정보 로드 실패:', error);
    }
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
	
	console.log(message);
	if (message.room_id != currentRoomId) return;
	    
    const chatMessages = document.getElementById('chatMessages');
    const isSent = message.sender_id == currentUserId;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    messageDiv.dataset.messageId = message.id;  // 메시지 ID를 data 속성으로 저장
    messageDiv.dataset.senderId = message.sender_id;
    messageDiv.dataset.originalLang = message.original_lang;
    
    const senderName = isSent ? ' ' : escapeHtml(message.sender_name);
    const languageFlag = message.language_flag || getLanguageFlag(message.original_lang);
    
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
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
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
    document.getElementById('newChatModal').style.display = 'flex';
    selectedUsers = [];
    document.getElementById('selectedUsers').innerHTML = '';
    document.getElementById('userSearchResults').innerHTML = '';
}

// 새 채팅방 모달 숨기기
function hideNewChatModal() {
    document.getElementById('newChatModal').style.display = 'none';
}

// 사용자 검색
async function searchUsers(query) {
    if (!query.trim()) {
        document.getElementById('userSearchResults').innerHTML = '';
        return;
    }
    
    try {
        const response = await fetch(`/api/search_users?q=${encodeURIComponent(query)}`);
        console.log(response);
        const users = await response.json();
        console.log(users);
        
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
    selectedUsers = selectedUsers.filter(id => id != userId);
    
    const tags = document.getElementById('selectedUsers').querySelectorAll('.member-tag');
    tags.forEach(tag => {
        if (tag.textContent.includes(`(${userId})`)) {
            tag.remove();
        }
    });
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