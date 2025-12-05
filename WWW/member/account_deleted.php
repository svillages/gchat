<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>계정 삭제 완료 - G-Chat</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .deleted-container {
            background: white;
            padding: 50px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
            width: 100%;
        }

        .icon {
            width: 100px;
            height: 100px;
            background: linear-gradient(45deg, #ff6b6b, #ee5a52);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
            color: white;
            font-size: 40px;
        }

        h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 28px;
        }

        p {
            color: #6c757d;
            line-height: 1.6;
            margin-bottom: 30px;
            font-size: 16px;
        }

        .btn {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s;
            border: none;
            cursor: pointer;
            font-size: 16px;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .info-box {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-top: 30px;
            text-align: left;
        }

        .info-box h3 {
            color: #495057;
            margin-bottom: 10px;
            font-size: 16px;
        }

        .info-box ul {
            color: #6c757d;
            padding-left: 20px;
        }

        .info-box li {
            margin-bottom: 8px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="deleted-container">
        <div class="icon">
            <i class="fas fa-trash-alt"></i>
        </div>
        
        <h1>계정이 삭제되었습니다</h1>
        
        <p>
            G-Chat에서 귀하의 계정이 성공적으로 삭제되었습니다.<br>
            모든 개인 정보와 채팅 기록이 영구적으로 삭제되었습니다.
        </p>
        
        <p>
            G-Chat 서비스를 이용해 주셔서 감사합니다.<br>
            언제든지 다시 가입하실 수 있습니다.
        </p>
        
        <a href="/register.php" class="btn">
            <i class="fas fa-user-plus"></i> 새 계정 만들기
        </a>
        
        <div class="info-box">
            <h3><i class="fas fa-info-circle"></i> 삭제된 정보</h3>
            <ul>
                <li>개인 프로필 정보 (이름, 이메일, 전화번호)</li>
                <li>모든 채팅 기록 및 메시지</li>
                <li>참여했던 모든 채팅방 정보</li>
                <li>계정 설정 및 환경설정</li>
            </ul>
        </div>
        
        <p style="margin-top: 30px; font-size: 14px; color: #adb5bd;">
            삭제 처리에는 최대 24시간이 소요될 수 있습니다.<br>
            문의사항이 있으시면 support@gchat.kr로 연락주세요.
        </p>
    </div>
</body>
</html>