const WebSocket = require('ws');
const mysql = require('mysql2/promise');
const axios = require('axios');
require('dotenv').config();

// 데이터베이스 연결 풀 생성
const dbPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
	port: parseInt(process.env.DB_PORT) || 3306,  // 포트 설정 추가
    user: process.env.DB_USER || 'gchat_user',
    password: process.env.DB_PASS || 'your_password',
    database: process.env.DB_NAME || 'gchat',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
	timezone: '+09:00',  // 한국 시간대 설정
    connectTimeout: 10000,  // 연결 타임아웃 10초
    // 추가 연결 옵션
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
    } : undefined,
    // 풀링 옵션
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});
console.log(`데이터베이스 연결 설정:
- 호스트: ${process.env.DB_HOST || 'localhost'}
- 포트: ${parseInt(process.env.DB_PORT) || 3306}
- 데이터베이스: ${process.env.DB_NAME || 'gchat'}
- 사용자: ${process.env.DB_USER || 'gchat_user'}
`);
// WebSocket 서버 생성
const wss = new WebSocket.Server({ 
    port: process.env.WS_PORT || 8080,
    perMessageDeflate: {
        zlibDeflateOptions: {
            chunkSize: 1024,
            memLevel: 7,
            level: 3
        },
        zlibInflateOptions: {
            chunkSize: 10 * 1024
        },
        clientNoContextTakeover: true,
        serverNoContextTakeover: true,
        serverMaxWindowBits: 10,
        concurrencyLimit: 10,
        threshold: 1024
    }
});

console.log(`WebSocket 서버가 ${process.env.WS_PORT || 8080} 포트에서 실행 중입니다.`);

// 데이터베이스 연결 테스트 함수
async function testDatabaseConnection() {
    try {
        const connection = await dbPool.getConnection();
        console.log('✅ 데이터베이스 연결 성공');
        
        // 데이터베이스 버전 확인
        const [rows] = await connection.query('SELECT VERSION() as version');
        console.log(`📊 데이터베이스 버전: ${rows[0].version}`);
        
        // 현재 연결 수 확인
        const [connections] = await connection.query('SHOW STATUS LIKE "Threads_connected"');
        console.log(`🔗 현재 연결 수: ${connections[0].Value}`);
        
        connection.release();
        
        // 주기적인 연결 상태 확인
        setInterval(async () => {
            try {
                const conn = await dbPool.getConnection();
                const [result] = await conn.query('SELECT 1 as ping');
                conn.release();
                
                if (result[0].ping === 1) {
                    console.log('🟢 데이터베이스 연결 상태: 정상');
                }
            } catch (error) {
                console.error('🔴 데이터베이스 연결 상태: 오류', error.message);
            }
        }, 300000); // 5분마다 체크
        
    } catch (error) {
        console.error('❌ 데이터베이스 연결 실패:', error.message);
        console.log('재연결을 시도합니다...');
        
        // 재시도 로직
        setTimeout(testDatabaseConnection, 5000);
    }
}

// 서버 시작 시 데이터베이스 연결 테스트
testDatabaseConnection();

// 연결된 클라이언트 관리
const clients = new Map();
const userRooms = new Map();

// OpenAI API 설정
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

// WebSocket 연결 처리
wss.on('connection', (ws) => {
    console.log('새 클라이언트 연결');
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            await handleMessage(ws, data);
        } catch (error) {
            console.error('메시지 처리 오류:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: '메시지 처리 중 오류가 발생했습니다.'
            }));
        }
    });
    
    ws.on('close', () => {
        console.log('클라이언트 연결 종료');
        // 클라이언트 제거
        for (const [userId, client] of clients.entries()) {
            if (client === ws) {
                clients.delete(userId);
                userRooms.delete(userId);
                break;
            }
        }
    });
});

// WebSocket 메시지 핸들러 업데이트
async function handleMessage(ws, data) {
    switch (data.type) {
	case 'auth':
		await handleAuth(ws, data);
		break;
	case 'join_room':
	    await handleJoinRoom(ws, data);
	    break;
	case 'message':
	    await handleChatMessage(ws, data);
	    break;
	case 'create_room':
	    await handleCreateRoom(ws, data);
	    break;
	case 'request_translation':
	    await handleTranslationRequest(ws, data);
	    break;
	case 'add_member':
		await handleAddMember(ws, data);
		break;
	case 'leave_room':
		await handleLeaveRoom(ws, data);
		break;
	default:
	    console.log('알 수 없는 메시지 타입:', data.type);
    }
}

// 인증 처리
async function handleAuth(ws, data) {
    const { userId, languageCode } = data;
    
    try {
        // 사용자 정보 확인
        const [users] = await dbPool.execute(
            'SELECT id, username FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            ws.send(JSON.stringify({
                type: 'error',
                message: '사용자를 찾을 수 없습니다.'
            }));
            return;
        }
        
        // 클라이언트 저장
        clients.set(userId, ws);
        ws.userId = userId;
        ws.languageCode = languageCode;
        
        console.log(`사용자 인증 성공: ${users[0].username} (${userId})`);
        
    } catch (error) {
        console.error('인증 오류:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: '인증 중 오류가 발생했습니다.'
        }));
    }
}

// 채팅방 참여 처리
async function handleJoinRoom(ws, data) {
    const { roomId } = data;
    const userId = ws.userId;
    
    try {
        // 사용자가 채팅방 멤버인지 확인
        const [members] = await dbPool.execute(
            'SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?',
            [roomId, userId]
        );
        
        if (members.length === 0) {
            ws.send(JSON.stringify({
                type: 'error',
                message: '채팅방에 접근할 권한이 없습니다.'
            }));
            return;
        }
        
        // 사용자 채팅방 매핑 업데이트
        userRooms.set(userId, roomId);
        
        console.log(`사용자 ${userId} 가 채팅방 ${roomId} 에 참여했습니다.`);
        
    } catch (error) {
        console.error('채팅방 참여 오류:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: '채팅방 참여 중 오류가 발생했습니다.'
        }));
    }
}

// 채팅방 나가기 처리
async function handleLeaveRoom(ws, data) {
    const { roomId } = data;
    const userId = ws.userId;
    
    try {
        userRooms.delete(userId);
        console.log(`사용자 ${userId} 가 채팅방 ${roomId} 에서 나갔습니다.`);
        
    } catch (error) {
        console.error('채팅방 나가기 오류:', error);
        sendError(ws, '채팅방 나가기 중 오류가 발생했습니다.');
    }
}

// 채팅 메시지 처리
async function handleChatMessage(ws, data) {
    const { roomId, message, languageCode } = data;
    const senderId = ws.userId;
    
    if (!message.trim()) return;
    
    try {
        // 메시지 저장
        const [result] = await dbPool.execute(
            'INSERT INTO messages (room_id, sender_id, original_message, original_lang) VALUES (?, ?, ?, ?)',
            [roomId, senderId, message.trim(), languageCode]
        );
        
        const messageId = result.insertId;
        
        // 채팅방 멤버들 가져오기
        const [members] = await dbPool.execute(`
            SELECT u.id, u.username, u.language_code 
            FROM room_members rm
            JOIN users u ON rm.user_id = u.id
            WHERE rm.room_id = ?
        `, [roomId]);
        
        // 원본 메시지 전송 (보낸 사람 포함)
        //const [senderInfo] = await dbPool.execute(
        //    'SELECT username FROM users WHERE id = ?',
        //    [senderId]
        //);
        
        const messageData = {
            type: 'message',
            message: {
                id: messageId,
                room_id: roomId,
                sender_id: senderId,
                sender_name: 'myself',
                original_message: message,
                original_lang: languageCode,
                created_at: new Date().toISOString()
            }
        };
        
        // 보낸 사람에게 메시지 전송
        ws.send(JSON.stringify(messageData));
        
        // 방에 있는 목록을 가지고 한꺼번에 번역본을 가져오기
		await sendTranslatedMessage({
            roomId,
            messageId,
			sender_id: senderId,
            originalMessage: message,
            members: members
        });

		/*						
        for (const member of members) {
            if (member.language_code !== languageCode) {
                await sendTranslatedMessage({
                    roomId,
                    messageId,
					sender_id: senderId,
					sender_name: senderInfo[0]?.username || '알 수 없음',
                    originalMessage: message,
                    originalLang: languageCode,
                    targetLang: member.language_code,
                    targetUserId: member.id
                });
            } else {
                // 같은 언어면 원본 메시지 전송
                const client = clients.get(member.id);
                if (client) {
                    client.send(JSON.stringify(messageData));
                }
            }
        }
		*/
        
    } catch (error) {
        console.error('메시지 처리 오류:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: '메시지 전송 중 오류가 발생했습니다.'
        }));
    }
}

// 번역된 메시지 전송
async function sendTranslatedMessage(data) {
    const {
        roomId,
        messageId,
		sender_id,
        originalMessage,
        members
    } = data;
    
	// 받은 멤버스에서 보낸 사람 찾고, 나머지는 서로 다른 언어 구한다.
	let languages = [];
	for (let i = 0; i < members.length; i++) {
	  if (members[i].id === sender_id) {
	    originalLang = members[i].language_code;
		sender_name = members[i].username;	    
	  } else {
		languages.push(members[i].language_code);
	  }
	}
	// 서로 다른 언어에서 중복된 값과, 보낸 사람의 언어는 제거한다.
	const languages_code = [...new Set(languages)]
	    .filter(lang => lang !== originalLang);
		
    try {
        // ChatGPT API를 사용한 번역
        const translatedMessage = await translateWithChatGPT(
            originalMessage,
            originalLang,
            languages_code
        );
        	
		const translations = JSON.parse(translatedMessage);
		// 멤버 반복
		for (const member of members) {
			// 멤버id가 같으면 보낸 사람이므로, member.id가 다른 사람에게 메세지 발송
			if(member.id != sender_id) {
				// 언어코드가 다르면 번역한 내용을 보내고 그렇지 않으면 오리지널 메시지를 그냥 보냄
            	if (member.language_code !== originalLang) {
					// 번역된 메시지 전송
			        const client = clients.get(member.id);
			        if (client) {
						// 보내는 쪽 사람의 언어에 맞는 것만 추린다.
						const lang = member.language_code;
						if (translations.hasOwnProperty(lang)) {
						   tlang = translations[lang];
						} else {
						   tlang = originalMessage;
						}
			            client.send(JSON.stringify({
							type: 'translated_message',
				            message: {
				                id: messageId,
				                room_id: roomId,
				                sender_id: sender_id,
				                sender_name: sender_name,
				                original_message: originalMessage,
				                original_lang: originalLang,
								translated_message: tlang,
								target_lang: member.language_code,
				                created_at: new Date().toISOString()
				            }
			               // type: 'message',
			               //message_id: messageId,
			               //room_id: roomId,
			               //original_message: originalMessage,
			               //translated_message: translatedMessage,
			               //original_language: languageNames[originalLang] || originalLang,
			               //target_language: languageNames[targetLang] || targetLang,
			               //timestamp: new Date().toISOString()
			            }));
			        }
					
					
					
				} else {
	               // 같은 언어면 원본 메시지 전송
	               const client = clients.get(member.id);
	               if (client) {
						const messageData = {
				            type: 'translated_message',
				            message: {
				                id: messageId,
				                room_id: roomId,
				                sender_id: sender_id,
				                sender_name: sender_name,
				                original_message: originalMessage,
				                original_lang: originalLang,
								translated_message: originalMessage,
								target_lang: originalLang,
				                created_at: new Date().toISOString()
				            }
				        };
	                   client.send(JSON.stringify(messageData));
	               }
	           }
			}
		}
        
        
        // 번역된 메시지도 데이터베이스에 저장 (선택사항)
        try {
            await dbPool.execute(
                'INSERT INTO message_translations (message_id, translated_message) VALUES (?, ?)',
                [messageId, translatedMessage]
            );
        } catch (error) {
            console.error('번역 메시지 저장 오류:', error);
        }
        
    } catch (error) {
        console.error('번역 오류:', error);
        // 번역 실패 시 원본 메시지 전송
		/*
        const client = clients.get(targetUserId);
        if (client) {
            client.send(JSON.stringify({
                type: 'message',
                message: {
                    id: messageId,
                    room_id: roomId,
                    original_message: originalMessage,
                    created_at: new Date().toISOString(),
                    is_translation: false
                }
            }));
        }
		*/
    }
}

// ChatGPT API를 사용한 번역
//$model1 = "gpt-4o";
//$model2 = "gpt-4.1-mini";
//$model3 = "gpt-4.1-nano";
async function translateWithChatGPT(text, sourceLang, targetLang) {
    if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API 키가 설정되지 않았습니다.');
    }
    
    //const sourceLangName = languageNames[sourceLang] || sourceLang;
    //const targetLangName = languageNames[targetLang] || targetLang;
    
    try {
        const response = await axios.post(OPENAI_URL, {
            model: "gpt-4.1-nano",
            messages: [
                {
                    role: "system",
                    content: `You are a professional translator.
					The source language code is ${sourceLang}.
					Translate the given text into all target languages specified in the following list: ${JSON.stringify(targetLang)}.
					Return the result as a JSON object where each key is the target language code and each value is the translated text in that language.
					Only return the JSON object with no additional text.`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            temperature: 0.3,
            max_tokens: 1000
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        return response.data.choices[0].message.content.trim();
        
    } catch (error) {
        console.error('ChatGPT API 오류:', error.response?.data || error.message);
        throw new Error('번역에 실패했습니다.');
    }
}

// 멤버 추가 처리 (수정된 버전)
async function handleAddMember(ws, data) {
    const { roomId, userIds } = data;
    const addedByUserId = ws.userId;
    
    console.log(`멤버 추가 요청: 방 ${roomId}, 추가할 사용자 ${userIds}, 추가한 사람 ${addedByUserId}`);
    
    try {
        // 추가 권한 확인
        const [isMember] = await dbPool.execute(
            'SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?',
            [roomId, addedByUserId]
        );
        
        if (isMember.length === 0) {
            sendError(ws, '채팅방 멤버만 사용자를 추가할 수 있습니다.');
            return;
        }
        
        const addedMembers = [];
        const alreadyMembers = [];
        const failedMembers = [];
        const addedMembersInfo = [];
		
		// 채팅방 이름 가져오기
		const [roomResult] = await dbPool.execute(`
		    SELECT room_name FROM chat_rooms WHERE id = ?
		`, [roomId]);

		// 변수를 블록 밖에서 선언
		let roomName;
		// 결과 사용 예시
		if (roomResult.length > 0) {
		    roomName = roomResult[0].room_name;		   
		} else {
			roomName = roomId;
		}
		console.log(`채팅방 이름: ${roomName}`);
        
        // 채팅방 기존 멤버 목록 가져오기 (알림용)
        const [existingMembers] = await dbPool.execute(`
            SELECT u.id FROM room_members rm
            JOIN users u ON rm.user_id = u.id
            WHERE rm.room_id = ?
        `, [roomId]);
        
        const existingMemberIds = existingMembers.map(m => m.id);
        
        // 각 사용자 추가
        for (const userId of userIds) {
            // 이미 멤버인지 확인
            if (existingMemberIds.includes(userId)) {
                alreadyMembers.push(userId);
                continue;
            }
            
            try {
                // 새 멤버 추가
                await dbPool.execute(
                    'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
                    [roomId, userId]
                );
                
                // 추가된 멤버 정보 가져오기
                const [userInfo] = await dbPool.execute(`
                    SELECT u.id, u.username, u.language_code 
                    FROM users u WHERE u.id = ?
                `, [userId]);
                
                if (userInfo.length > 0) {
                    const memberInfo = userInfo[0];
                    memberInfo.flag = memberInfo.language_code;
                    memberInfo.language_name = memberInfo.language_code;
                    
                    addedMembers.push(userId);
                    addedMembersInfo.push(memberInfo);
                    
                    console.log(`멤버 추가 성공: ${memberInfo.username} (${userId})`);
                    
                    // 새로 추가된 멤버에게 알림
                    const newMemberClient = clients.get(userId);
                    if (newMemberClient) {
                        newMemberClient.send(JSON.stringify({
                            type: 'member_added',
                            roomId: roomId,
							roomName: roomName,
                            newMember: memberInfo,
                            addedBy: addedByUserId,
                            timestamp: new Date().toISOString(),
                            message: `${memberInfo.username}님이 채팅방에 초대되었습니다.`
                        }));
                        
                        // 새 멤버가 현재 채팅방에 참여 중이라면 바로 업데이트
                        if (userRooms.get(userId) === roomId) {
                            newMemberClient.send(JSON.stringify({
                                type: 'refresh_room',
                                roomId: roomId,
                                message: '채팅방 멤버가 업데이트되었습니다.'
                            }));
                        }
                    }
                }
                
            } catch (error) {
                console.error(`멤버 추가 실패 (사용자 ${userId}):`, error);
                failedMembers.push(userId);
            }
        }
        
        // 기존 멤버들에게 알림 (추가한 사람 포함)
        if (addedMembers.length > 0) {
            // 추가한 사람 정보 가져오기
            const [adderInfo] = await dbPool.execute(
                'SELECT username FROM users WHERE id = ?',
                [addedByUserId]
            );
            
            const adderName = adderInfo[0]?.username || '알 수 없음';
            
            // 모든 기존 멤버들에게 알림 (추가한 사람 포함)
            for (const memberId of existingMemberIds) {
                const client = clients.get(memberId);
                if (client && client.readyState === 1) { // WebSocket.OPEN
                    client.send(JSON.stringify({
                        type: 'member_added_notification',
                        roomId: roomId,
                        addedMembers: addedMembersInfo,
                        addedBy: addedByUserId,
                        addedByName: adderName,
                        timestamp: new Date().toISOString(),
                        message: `${addedMembersInfo.map(m => m.username).join(', ')}님이 ${adderName}님에 의해 채팅방에 추가되었습니다.`
                    }));
                    
                    // 현재 채팅방에 참여 중인 멤버에게는 실시간 업데이트
                    if (userRooms.get(memberId) === roomId) {
                        client.send(JSON.stringify({
                            type: 'refresh_room_members',
                            roomId: roomId,
                            message: '새 멤버가 추가되었습니다. 멤버 목록을 새로고침하세요.'
                        }));
                    }
                }
            }
            
            // 추가된 멤버들도 기존 멤버 리스트에 추가
            existingMemberIds.push(...addedMembers);
        }
        
        // 요청자에게 결과 전송
        ws.send(JSON.stringify({
            type: 'members_added_result',
            success: true,
            roomId: roomId,
            addedMembers: addedMembers,
            alreadyMembers: alreadyMembers,
            failedMembers: failedMembers,
            addedMembersInfo: addedMembersInfo,
            message: `총 ${userIds.length}명 중 ${addedMembers.length}명 추가 완료`
        }));
        
    } catch (error) {
        console.error('멤버 추가 처리 오류:', error);
        sendError(ws, '멤버 추가 중 오류가 발생했습니다.');
    }
}
// 새 채팅방 생성
async function handleCreateRoom(ws, data) {
    const { roomName, userIds } = data;
    const creatorId = ws.userId;
    
    try {
        const connection = await dbPool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // 채팅방 생성
            const [roomResult] = await connection.execute(
                'INSERT INTO chat_rooms (room_name, created_by) VALUES (?, ?)',
                [roomName, creatorId]
            );
            
            const roomId = roomResult.insertId;
            
            // 생성자 추가
            await connection.execute(
                'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
                [roomId, creatorId]
            );
            
            // 선택된 사용자들 추가
            for (const userId of userIds) {
                await connection.execute(
                    'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
                    [roomId, userId]
                );
            }
            
            await connection.commit();
            
            // 생성자에게 성공 응답
            ws.send(JSON.stringify({
                type: 'room_created',
                roomId: roomId,
                roomName: roomName
            }));
            
			// 선택된 사용자들에게 알림
            for (const userId of userIds) {
                const client = clients.get(userId);
                if (client) {
                    client.send(JSON.stringify({
                        type: 'room_invitation',
                        roomId: roomId,
                        roomName: roomName,
                        invitedBy: creatorId,
                        message: `${roomName} 채팅방에 초대되었습니다.`
                    }));
                }
            }
            
            console.log(`새 채팅방 생성: ${roomName} (ID: ${roomId})`);
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('채팅방 생성 오류:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: '채팅방 생성 중 오류가 발생했습니다.'
        }));
    }
}

// 번역 요청 처리
async function handleTranslationRequest(ws, data) {
    const { messageId, sourceLang, targetLang, roomId } = data;
    const userId = ws.userId;
    
    try {
        // 원본 메시지 가져오기
        const [messages] = await dbPool.execute(
            'SELECT original_message FROM messages WHERE id = ? AND room_id = ?',
            [messageId, roomId]
        );
        
        if (messages.length === 0) {
            ws.send(JSON.stringify({
                type: 'error',
                message: '메시지를 찾을 수 없습니다.'
            }));
            return;
        }
        
        const originalMessage = messages[0].original_message;
        
        // 번역 실행
        const translatedMessage = await translateWithChatGPT(
            originalMessage,
            sourceLang,
            targetLang
        );
        
        // 번역 결과 전송
        ws.send(JSON.stringify({
            type: 'translated_message',
            message_id: messageId,
            room_id: roomId,
            original_message: originalMessage,
            translated_message: translatedMessage,
            original_language: sourceLang,
            target_language: targetLang,
            timestamp: new Date().toISOString()
        }));
        
        // 번역 저장
        await dbPool.execute(
            'INSERT INTO message_translations (message_id, target_language, translated_message) VALUES (?, ?, ?)',
            [messageId, targetLang, translatedMessage]
        );
        
    } catch (error) {
        console.error('번역 요청 처리 오류:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: '번역 요청 처리 중 오류가 발생했습니다.'
        }));
    }
}

// 에러 전송 함수
function sendError(ws, message) {
    if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(JSON.stringify({
            type: 'error',
            message: message,
            timestamp: new Date().toISOString()
        }));
    }
}
// 서버 종료 시 정리
process.on('SIGINT', async () => {
    console.log('서버 종료 중...');
    wss.close();
    await dbPool.end();
    process.exit(0);
});