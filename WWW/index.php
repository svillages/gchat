<?php
require_once 'config.php';
require_once $SET_SITE_ROOT.'/common/lib/dbconn.php';
checkAuth();

$db = getDB();
$user_id = $_SESSION['user_id'];

// 사용자 정보 가져오기
$stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();

$site_title = "G-Chat - 다국어 실시간 채팅";
$css = "style.css";
require_once $SET_SITE_ROOT.'/common/include/header.php';
?>
<body>
    <div class="chat-container">
        <!-- 사이드바 -->
        <div class="sidebar">
            <!-- 사용자 정보 -->
            <div class="user-info">
                <div class="user-avatar"><?= strtoupper(substr($user['username'], 0, 1)) ?></div>
                <div class="user-details">
                    <h3><?= htmlspecialchars($user['username']) ?></h3>
                    <span><?= $language_map[$user['language_code']]['name'] ?? $user['language_code'] ?></span>
                </div>
            </div>

            <!-- 메뉴 -->
            <div class="menu">
                <div class="menu-item active" onclick="loadChats()">
                    <i class="fas fa-comments"></i>
                    <span>채팅</span>
                </div>
                <div class="menu-item" onclick="showNewChatModal()">
                    <i class="fas fa-plus-circle"></i>
                    <span>새 채팅방</span>
                </div>
                <div class="menu-item" onclick="location.href='/member/settings'">
                    <i class="fas fa-cog"></i>
                    <span>설정</span>
                </div>
                <div class="menu-item" onclick="location.href='/member/logout'">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>로그아웃</span>
                </div>
            </div>

            <!-- 채팅 목록 -->
            <div class="chat-list" id="chatList">
                <!-- 채팅 목록이 동적으로 로드됩니다 -->
            </div>
        </div>

        <!-- 메인 채팅 영역 -->
        <div class="chat-main" id="chatMain">
            <!-- 채팅 헤더 -->
            <div class="chat-header" id="chatHeader">
                <button class="back-button" id="backButton" onclick="return goBackToSidebar(event)">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <button class="add-user-button" id="addUserButton" onclick="showAddUserModal()">
                    <i class="fas fa-user-plus"></i>
                </button>
                <div class="chat-title">
                    <h2>채팅방을 선택하세요</h2>
                </div>
            </div>
        
            <!-- 채팅 메시지 영역 -->
            <div class="chat-messages" id="chatMessages">
                <!-- 메시지들이 동적으로 로드됩니다 -->
            </div>
        
            <!-- 채팅 입력 영역 -->
            <div class="chat-input">
                <input type="text" 
                       class="message-input" 
                       id="messageInput" 
                       placeholder="메시지를 입력하세요..." 
                       disabled>
                <button class="send-button" id="sendButton" onclick="sendMessage()" disabled>
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    </div>

    <!-- 새로운 채팅방 생성 모달 -->
    <div class="modal" id="newChatModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>새 채팅방 만들기</h2>
            </div>
            <form id="newChatForm">
                <div class="form-group">
                    <label for="roomName">채팅방 이름</label>
                    <input type="text" id="roomName" class="form-control" placeholder="채팅방 이름 입력">
                </div>
                <div class="form-group">
                    <label for="userSearch">사용자 추가</label>
                    <input type="text" id="userSearch" class="form-control" placeholder="사용자 이름 검색" onkeyup="searchUsers(this.value)">
                    <div class="user-search" id="userSearchResults">
                        <!-- 검색 결과가 여기에 표시됩니다 -->
                    </div>
                    <div id="selectedUsers">
                        <!-- 선택된 사용자들이 여기에 표시됩니다 -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="hideNewChatModal()">취소</button>
                    <button type="button" class="btn btn-primary" onclick="createNewChat()">생성</button>
                </div>
            </form>
        </div>
    </div>
    <!-- 사용자 추가 모달 -->
    <div class="modal" id="addUserModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>사용자 추가</h2>
                <p class="modal-subtitle" id="addUserModalSubtitle"></p>
            </div>
            <form id="addUserForm">
                <div class="form-group">
                    <label for="userSearchToAdd">사용자 검색</label>
                    <input type="text" id="userSearchToAdd" class="form-control" 
                           placeholder="사용자 이름 또는 이메일로 검색" 
                           onkeyup="searchUsersToAdd(this.value)">
                    <div class="user-search" id="userSearchResultsToAdd">
                        <!-- 검색 결과가 여기에 표시됩니다 -->
                    </div>
                </div>
                <div class="form-group">
                    <label>선택된 사용자</label>
                    <div id="selectedUsersToAdd" class="selected-users-container">
                        <!-- 선택된 사용자 태그가 여기에 표시됩니다 -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" 
                            onclick="return hideAddUserModal(event)">취소</button>
                    <button type="button" class="btn btn-primary" 
                            onclick="addUsersToRoom()">추가</button>
                </div>
            </form>
        </div>
    </div>

      
</body>
</html>
<!-- WebSocket 및 JavaScript -->
<script>
let ws = null;
let currentRoomId = null;
let selectedUsers = [];
const currentUserId = <?php echo $user_id; ?>;
const currentUserLang = '<?php echo $user['language_code']; ?>';  // 이 줄 추가
</script>
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js"></script>
<script src="/common/js/socket.js?v=<?php echo VERSION;?>"></script>