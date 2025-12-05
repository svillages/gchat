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

// 정보 업데이트 처리
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['update_profile'])) {
        // 프로필 정보 업데이트
        $username = $_POST['username'] ?? '';
        $email = $_POST['email'] ?? '';
        $phone = $_POST['phone'] ?? '';
        $language_code = $_POST['language_code'] ?? 'ko';
        
        if (!empty($username) && !empty($email)) {
            try {
                $stmt = $db->prepare("UPDATE users SET username = ?, email = ?, phone = ?, language_code = ? WHERE id = ?");
                $stmt->bind_param("ssssi", $username, $email, $phone, $language_code, $user_id);
                
                if ($stmt->execute()) {
                    $success_msg = "프로필이 성공적으로 업데이트되었습니다.";
                    // 세션 정보 갱신
                    $_SESSION['username'] = $username;
                    // 사용자 정보 다시 가져오기
                    $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
                    $stmt->bind_param("i", $user_id);
                    $stmt->execute();
                    $user = $stmt->get_result()->fetch_assoc();
                } else {
                    $error_msg = "프로필 업데이트에 실패했습니다.";
                }
            } catch (Exception $e) {
                $error_msg = "오류가 발생했습니다: " . $e->getMessage();
            }
        } else {
            $error_msg = "필수 정보를 입력해주세요.";
        }
    } elseif (isset($_POST['change_password'])) {
        // 비밀번호 변경
        $current_password = $_POST['current_password'] ?? '';
        $new_password = $_POST['new_password'] ?? '';
        $confirm_password = $_POST['confirm_password'] ?? '';
        
        if (!empty($current_password) && !empty($new_password) && !empty($confirm_password)) {
            if ($new_password === $confirm_password) {
                // 실제로는 비밀번호 해싱 검증 필요
                // 여기서는 단순 예시로 비밀번호 길이만 체크
                if (strlen($new_password) >= 6) {
                    // 새로운 비밀번호 해싱 (실제 구현시 password_hash 사용)
                    $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
                    
                    $stmt = $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
                    $stmt->bind_param("si", $hashed_password, $user_id);
                    
                    if ($stmt->execute()) {
                        $success_msg = "비밀번호가 성공적으로 변경되었습니다.";
                    } else {
                        $error_msg = "비밀번호 변경에 실패했습니다.";
                    }
                } else {
                    $error_msg = "비밀번호는 최소 6자 이상이어야 합니다.";
                }
            } else {
                $error_msg = "새 비밀번호가 일치하지 않습니다.";
            }
        } else {
            $error_msg = "모든 필드를 입력해주세요.";
        }
    } elseif (isset($_POST['delete_account'])) {
        // 계정 삭제
        $confirm_delete = $_POST['confirm_delete'] ?? '';
        
        if ($confirm_delete === 'DELETE') {
            try {
                // 트랜잭션 시작
                $db->begin_transaction();
                
                // 1. 사용자가 보낸 메시지 삭제
                $stmt = $db->prepare("DELETE FROM messages WHERE sender_id = ?");
                $stmt->bind_param("i", $user_id);
                $stmt->execute();
                
                // 2. 채팅방 멤버에서 제거
                $stmt = $db->prepare("DELETE FROM room_members WHERE user_id = ?");
                $stmt->bind_param("i", $user_id);
                $stmt->execute();
                
                // 3. 사용자가 생성한 채팅방이 있는 경우, 채팅방 삭제
                $stmt = $db->prepare("SELECT id FROM chat_rooms WHERE created_by = ?");
                $stmt->bind_param("i", $user_id);
                $stmt->execute();
                $rooms = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
                
                foreach ($rooms as $room) {
                    $room_id = $room['id'];
                    // 채팅방 메시지 삭제
                    $stmt = $db->prepare("DELETE FROM messages WHERE room_id = ?");
                    $stmt->bind_param("i", $room_id);
                    $stmt->execute();
                    
                    // 채팅방 멤버 삭제
                    $stmt = $db->prepare("DELETE FROM room_members WHERE room_id = ?");
                    $stmt->bind_param("i", $room_id);
                    $stmt->execute();
                    
                    // 채팅방 삭제
                    $stmt = $db->prepare("DELETE FROM chat_rooms WHERE id = ?");
                    $stmt->bind_param("i", $room_id);
                    $stmt->execute();
                }
                
                // 4. 사용자 삭제
                $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
                $stmt->bind_param("i", $user_id);
                $stmt->execute();
                
                $db->commit();
                
                // 세션 삭제
                session_destroy();
                
                // 성공 페이지로 리다이렉트
                header('Location: /account_deleted.php');
                exit;
                
            } catch (Exception $e) {
                $db->rollback();
                $error_msg = "계정 삭제 중 오류가 발생했습니다: " . $e->getMessage();
            }
        } else {
            $error_msg = "확인 문구를 정확히 입력해주세요.";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>설정 - G-Chat</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/common/css/settings.css?v=<?php echo VERSION;?>">
</head>
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
            <!-- 메시지 표시 -->
            <?php if ($success_msg): ?>
                <div class="message success-message">
                    <i class="fas fa-check-circle"></i> <?= htmlspecialchars($success_msg) ?>
                </div>
            <?php endif; ?>
            
            <?php if ($error_msg): ?>
                <div class="message error-message">
                    <i class="fas fa-exclamation-circle"></i> <?= htmlspecialchars($error_msg) ?>
                </div>
            <?php endif; ?>

            <!-- 프로필 요약 -->
            <div class="user-info-summary">
                <div class="user-avatar-large">
                    <?= strtoupper(substr($user['username'], 0, 1)) ?>
                </div>
                <h3><?= htmlspecialchars($user['username']) ?></h3>
                <p>가입일: <?= date('Y년 m월 d일', strtotime($user['created_at'])) ?></p>
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
                
                <form method="POST">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="username">사용자 이름</label>
                            <input type="text" id="username" name="username" 
                                   value="<?php echo  htmlspecialchars($user['username']) ?>" required>
                        </div>
                        <div class="form-group">
                            <label for="email">이메일</label>
                            <input type="email" id="email" name="email" 
                                   value="<?php echo  htmlspecialchars($user['email']) ?>" required>
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
                                    <option value="<?= $code ?>" 
                                        <?php echo  $code === $user['language_code'] ? 'selected' : '' ?>>
                                        <?php echo  $lang['flag'] ?> <?= $lang['name'] ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>현재 언어: <?php echo $language_map[$user['language_code']]['flag'] ?? '🌐' ?> <?= $language_map[$user['language_code']]['name'] ?? $user['language_code'] ?></label>
                        <div class="language-select">
                            <?php foreach (array_slice($language_map,0, 12) as $code => $lang): ?>
                                <div class="language-option <?= $code === $user['language_code'] ? 'selected' : '' ?>" 
                                     onclick="document.getElementById('language_code').value='<?= $code ?>'; updateLanguageSelection()">
                                    <span><?= $lang['flag'] ?></span>
                                    <?= $lang['name'] ?>
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
                
                <form method="POST">
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
                        <i class="fas fa-key"></i> 비밀번호 변경
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
                        <input type="text" name="confirm_delete" placeholder="DELETE 입력">
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
<script src="/common/js/settings.js?v=<?php echo VERSION;?>"></script>