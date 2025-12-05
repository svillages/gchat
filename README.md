본 앱을 사용하기 위해서 해야할 3가지 설정

테스트 환경
운영체제 : Locky Linux 9.7
웹 서버 : Nginx 1.28.0
DB : MariaDGB 11.4.9
앱 : PHP 8.4.15
node.js 16.20.2

1. DB 폴더
- DB 계정 및 DB 생성 후 sql 적용

2. SERVER폴더 
- .env 파일 수정
- openai API 키 발급 후 입력
- DB 정보 입력
- SERVER 폴더 내에서 실행
   npm init -y
   npm install
   npm install -g pm2
   pm2 gchat_server.js --name gchatserver

3. WWW 폴더
- nginx의 server 설정으로 WWW 디렉토리 설정
- nginx의 설정에 아래 부분 추가 또는 수정
  ------------------------
  location /ws {
        proxy_pass http://localhost:8080;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
  }
  location / {
        index  index.html index.php index.htm;
        autoindex off;

        rewrite ^/member/login/?$ /member/login.php last;
        rewrite ^/member/logout/?$ /member/logout.php last;
        rewrite ^/member/settings/?$ /member/settings.php last;
        rewrite ^/member/register/?$ /member/register.php last;
        rewrite ^/member/findpassword/?$ /member/find_password.php last;

        rewrite ^/api/chats/?$ /apps/chats.php last;
        rewrite ^/api/messages/?$ /apps/messages.php last;
        rewrite ^/api/room_info/?$ /apps/room_info.php last;
        rewrite ^/api/search_users/?$ /apps/search_users.php last;

 }
--------------------------
