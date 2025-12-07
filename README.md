Rocky Linux

MariaDB

PHP

Nginx

noce.js



1. DB 세팅 후 DB 폴더의 sql 적용
2. SERVER의 .env 환경에 맞게 수정
3. node.js로 gchat\_server.js 실행
4. nginx에서 WWW 폴더 root로 지정
5. nginx proxy 설정



nginx.conf



\# WebSocket 프록시 설정

location /ws {

&nbsp;   proxy\_pass http://localhost:8080;

&nbsp;   

&nbsp;   proxy\_http\_version 1.1;

&nbsp;   proxy\_set\_header Upgrade $http\_upgrade;

&nbsp;   proxy\_set\_header Connection "upgrade";

&nbsp;   proxy\_set\_header Host $host;

&nbsp;   proxy\_set\_header X-Real-IP $remote\_addr;

&nbsp;   proxy\_set\_header X-Forwarded-For $proxy\_add\_x\_forwarded\_for;

&nbsp;   proxy\_set\_header X-Forwarded-Proto $scheme;

&nbsp;   proxy\_read\_timeout 86400;

}



location / {	

&nbsp;	index  index.html index.php index.htm;

&nbsp;	autoindex off;		

&nbsp;	

&nbsp;	rewrite ^/member/login/?$ /member/login.php last;

&nbsp;	rewrite ^/member/logout/?$ /member/logout.php last;

&nbsp;	rewrite ^/member/settings/?$ /member/settings.php last;

&nbsp;	rewrite ^/member/register/?$ /member/register.php last;

&nbsp;	rewrite ^/member/find\_password/?$ /member/find\_password.php last;

&nbsp;	

&nbsp;	rewrite ^/api/chats/?$ /apps/chats.php last;

&nbsp;	rewrite ^/api/messages/?$ /apps/messages.php last;

&nbsp;	rewrite ^/api/room\_info/?$ /apps/room\_info.php last;

&nbsp;	rewrite ^/api/search\_users/?$ /apps/search\_users.php last;

&nbsp;	rewrite ^/api/add\_member/?$ /apps/add\_member.php last;

&nbsp;	

&nbsp;	rewrite ^/ajax/register\_ok/?$ /apps/register\_ok.php last;

&nbsp;	rewrite ^/ajax/login\_ok/?$ /apps/login\_ok.php last;

&nbsp;	rewrite ^/ajax/settings\_ok/?$ /apps/settings\_ok.php last;	

}   	

