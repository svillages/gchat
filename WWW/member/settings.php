<?php
require_once '../config.php';
require_once $SET_SITE_ROOT.'/common/lib/lib.php';
require_once $SET_SITE_ROOT.'/common/lib/dbconn.php';

checkAuth();

$db = getDB();
$user_id = $_SESSION['user_id'];
$success_msg = '';
$error_msg = '';

// 사용자 정보 가져오기
$stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();


$site_title = "G-Chat - 설정";
$css = "settings.css";
require_once $SET_SITE_ROOT.'/common/include/header.php';
?>
<body>
    <div class="settings-container">
        <!-- 설정 헤더 -->
        <div class="settings-header">
            <button class="back-button" onclick="window.history.back()">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h1><i class="fas fa-cog"></i> 설정</h1>
            <p>계정 정보와 환경설정을 관리하세요</p>
        </div>

        <!-- 설정 내용 -->
        <div class="settings-content">
        <input type="hidden" name="csrftoken" id="csrftoken"  value="<?php echo $_SESSION['csrf_token'];?>">
        <input type="hidden" name="user_id" id="user_id"  value="<?php echo $_SESSION['user_id'];?>">

            <!-- 프로필 요약 -->
            <div class="user-info-summary">
                <div class="user-avatar-large">
                    <?php echo strtoupper(substr($user['username'], 0, 1)) ?>
                </div>
                <h3><?php echo htmlspecialchars($user['username']) ?></h3>
                <p>가입일: <?php echo date('Y년 m월 d일', strtotime($user['created_at'])) ?></p>
            </div>

            <!-- 계정 통계 -->
            <div class="stats-grid">
                <?php
                // 통계 정보 가져오기
                $stmt = $db->prepare("
                    SELECT 
                        (SELECT COUNT(*) FROM room_members WHERE user_id = ?) as chat_count,
                        (SELECT COUNT(*) FROM messages WHERE sender_id = ?) as message_count,
                        (SELECT COUNT(*) FROM chat_rooms WHERE created_by = ?) as room_created_count
                ");
                $stmt->bind_param("iii", $user_id, $user_id, $user_id);
                $stmt->execute();
                $stats = $stmt->get_result()->fetch_assoc();
                ?>
                <div class="stat-card">
                    <div class="stat-number"><?php echo  $stats['chat_count'] ?? 0 ?></div>
                    <div class="stat-label">참여 채팅방</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number"><?php echo  $stats['message_count'] ?? 0 ?></div>
                    <div class="stat-label">보낸 메시지</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number"><?php echo  $stats['room_created_count'] ?? 0 ?></div>
                    <div class="stat-label">생성한 채팅방</div>
                </div>
            </div>

            <!-- 프로필 정보 섹션 -->
            <div class="settings-section">
                <div class="section-title">
                    <i class="fas fa-user"></i>
                    <span>프로필 정보</span>
                </div>
                
                <form method="POST" onsubmit="return updateProfile();">
                
                    <div class="form-row">
                        <div class="form-group">
                            <label for="username">사용자 이름</label>
                            <input type="text" id="username" name="username" 
                                   value="<?php echo  htmlspecialchars($user['username']) ?>">
                        </div>
                        <div class="form-group">
                            <label for="email">이메일</label>
                            <input type="email" id="email" name="email" 
                                   value="<?php echo  htmlspecialchars($user['email']) ?>" >
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="phone">전화번호</label>
                            <input type="tel" id="phone" name="phone" 
                                   value="<?php echo  htmlspecialchars($user['phone'] ?? '') ?>">
                        </div>
                        <div class="form-group">
                            <label for="language_code">기본 언어</label>
                            <select id="language_code" name="language_code" required>
<?php foreach ($language_map as $code => $lang): ?>
                                    <option value="<?= $code ?>" <?php echo  $code === $user['language_code'] ? 'selected' : '' ?>><?php echo  $lang['flag'] ?> <?= $lang['name'] ?></option>
<?php endforeach; ?>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>현재 언어: <?php echo $language_map[$user['language_code']]['flag'] ?? '🌐' ?> <?= $language_map[$user['language_code']]['name'] ?? $user['language_code'] ?></label>
                        <div class="language-select">
<?php foreach (array_slice($language_map,0, 12) as $code => $lang): ?>
                                <div class="language-option <?= $code === $user['language_code'] ? 'selected' : '' ?>" onclick="document.getElementById('language_code').value='<?= $code ?>'; updateLanguageSelection()">
                                	<span><?= $lang['flag'] ?></span><?= $lang['name'] ?>
                                </div>
 <?php endforeach; ?>
                        </div>
                    </div>
                    
                    <button type="submit" name="update_profile" class="btn btn-primary">
                        <i class="fas fa-save"></i> 변경사항 저장
                    </button>
                </form>
            </div>

            <!-- 비밀번호 변경 섹션 -->
            <div class="settings-section">
                <div class="section-title">
                    <i class="fas fa-lock"></i>
                    <span>비밀번호 변경</span>
                </div>
                
                <form method="POST" onsubmit="return changePassword();">
                    <div class="form-group">
                        <label for="current_password">현재 비밀번호</label>
                        <input type="password" id="current_password" name="current_password">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="new_password">새 비밀번호</label>
                            <input type="password" id="new_password" name="new_password">
                        </div>
                        <div class="form-group">
                            <label for="confirm_password">새 비밀번호 확인</label>
                            <input type="password" id="confirm_password" name="confirm_password">
                        </div>
                    </div>
                    
                    <button type="submit" name="change_password" class="btn btn-primary">
                        <i class="fas fa-key"></i> <span id="passbutton">비밀번호 변경</span>
                    </button>
                </form>
            </div>

            <!-- 위험 구역: 계정 삭제 -->
            <div class="danger-zone">
                <div class="section-title">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>위험 구역</span>
                </div>
                
                <div class="danger-note">
                    <i class="fas fa-exclamation-circle"></i>
                    <strong>경고:</strong> 계정 삭제는 되돌릴 수 없는 작업입니다. 모든 채팅 기록과 데이터가 영구적으로 삭제됩니다.
                </div>
                
                <form method="POST" onsubmit="return confirmAccountDeletion()">
                    <div class="form-group">
                        <label class="warning-text">계정을 삭제하시겠습니까?</label>
                        <p style="color: #6c757d; margin-bottom: 15px;">
                            계정 삭제를 확인하려면 아래 입력란에 <strong>DELETE</strong> 를 입력하세요.
                        </p>
                        <input type="text" name="confirm_delete" id="confirm_delete" placeholder="DELETE 입력">
                    </div>
                    
                    <button type="submit" name="delete_account" class="btn btn-danger">
                        <i class="fas fa-trash-alt"></i> 계정 영구 삭제
                    </button>
                </form>
            </div>
        </div>
    </div>

</body>
</html>
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js"></script>
<script src="/common/js/settings.js?v=<?php echo VERSION;?>"></script>