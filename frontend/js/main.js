// main.js

import { Game } from './Game.js';
import { Multiplayer } from './Multiplayer.js';
import { Network } from './Network.js';

// 이미 구현된 코드에서 토큰을 가져와 WebSocket 연결 시 포함
const token = localStorage.getItem("token");
if (!token) {
    alert("로그인이 필요합니다.");
    window.location.href = 'login.html';
}

// URL 파라미터에서 room_id 추출
const params = new URLSearchParams(window.location.search);
const roomId = params.get('room_id');
if (!roomId) {
    console.error("URL 파라미터에서 room_id를 찾을 수 없습니다.");
    window.location.href = 'index.html';
} else {
    localStorage.setItem("room_id", roomId);
}

async function leaveRoom(roomId, nickname) {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("로그인이 필요합니다.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`http://tetris.junzzang.kro.kr:5002/api/rooms/${roomId}/leave`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nickname: nickname }) // nickname 제거
        });
        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            window.location.href = 'index.html';
        } else {
            alert(`에러: ${result.detail || '알 수 없는 오류가 발생했습니다.'}`);
        }
    } catch (error) {
        console.error("방 나가기 중 오류:", error);
        alert("방 나가기 중 오류가 발생했습니다.");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const stageCanvas = document.getElementById("stage");
    const nextCanvas = document.getElementById("next");
    let isGameEnded = false;

    const token = localStorage.getItem("token");
    if (!token) {
        alert("로그인이 필요합니다.");
        window.location.href = 'login.html';
    }

    const nickname = localStorage.getItem("nickname"); // nickname 정의
    if (!nickname) {
        alert("닉네임이 필요합니다.");
        window.location.href = 'login.html';
    }

    // displayPlayers 함수를 DOMContentLoaded 내부로 이동
    function displayPlayers(players, host = null) {
        const multiplayerContainer = document.getElementById("multiplayer-container");
        multiplayerContainer.innerHTML = ""; // 기존 플레이어 캔버스 초기화

        players.forEach((player) => {
            if (player !== nickname) { // self 제외
                const playerContainer = document.createElement("div");
                playerContainer.classList.add("other-player-container");
                const playerCanvas = document.createElement("canvas");
                playerCanvas.id = `player-${player}`;
                playerCanvas.width = 100;
                playerCanvas.height = 200;
                const nicknameElement = document.createElement("p");
                nicknameElement.id = `nickname-${player}`;
                nicknameElement.style.color = 'white';
                nicknameElement.innerText = player === host ? `${player} (방장)` : player;
                playerContainer.appendChild(playerCanvas);
                playerContainer.appendChild(nicknameElement);
                multiplayerContainer.appendChild(playerContainer);
            }
        });

        // 플레이어 목록 업데이트
        const playerDisplay = document.getElementById("players-display");
        playerDisplay.innerText = `참여 인원 (${players.length}명): ${players.map(p => p === host ? `${p} (방장)` : p).join(', ')}`;
    }

    class CustomNetwork extends Network {
        constructor(url, nickname, roomId, token) {
            super(url, nickname, roomId, token);
        }
        onOpen() {
            // WebSocket 초기 연결 시 서버에 토큰과 player_id(nickname)를 전달
            this.send({
                token: this.token,
                player_id: this.nickname // player_id를 nickname으로 설정
            });
        }
    }

    const network = new CustomNetwork("ws://tetris.junzzang.kro.kr:5002/ws/", nickname, roomId, token);
    network.socket.onopen = () => {
        console.log("WebSocket connection established");
        network.onOpen();
    };

    const multiplayer = new Multiplayer(network, displayPlayers, nickname); // nickname 전달
    const game = new Game(stageCanvas, nextCanvas, network);

    // Expose the Game instance globally for Multiplayer.js to access
    window.game = game;

    multiplayer.addMessageHandler((message) => {
        if (message.type === 'start') {
            console.log("start 메시지 수신");
            game.start();
            multiplayer.hideStartButton(); // 게임 시작 시 버튼 숨기기
        } else if (message.type === 'game_end') {
            console.log("game_end 메시지 수신:", message.rankings);
            isGameEnded = true;
            showStatisticsPopup(message.rankings);
            game.stop(); // 게임 중지 및 캔버스 초기화
            game.reset(); // 게임 상태 리셋

            // 게임 컨트롤 버튼 비활성화
            const controls = document.querySelectorAll('#game-controls button, .tetris-button');
            controls.forEach(button => {
                button.disabled = true;
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
            });

            console.log("게임이 종료되었고 입력이 비활성화되었습니다.");
        }else if (message.type === 'game_state') {
            if (!isGameEnded) { // 게임이 종료되지 않은 경우에만 처리
                // game_state 메시지 처리
                // 예: 업데이트된 게임 상태 반영
            }
        }
    });

    setInterval(() => {
        if (game.isRunning) {
            const serializedGrid = game.grid.serialize();
            const activeTetraData = game.currentTetra ? game.currentTetra.getBlockData() : null;

            const gameState = {
                type: 'game_state',
                state: {
                    nickname, // nickname 사용
                    grid: serializedGrid,
                    activeTetra: activeTetraData
                },
                roomId: roomId
            };
            network.send(gameState);
        }
    }, 500);

    game.onGameOver = () => {
        network.send({ type: 'game_over' });
    };

    let isSendingMessage = false;
    let currentMessage = "";

    // 방 나가기 버튼
    const leaveButton = document.getElementById("leave-room-button");
    if (leaveButton) {
        leaveButton.addEventListener("click", () => {
            const storedRoomId = localStorage.getItem("room_id");
            leaveRoom(storedRoomId, nickname);
        });
    }

    // 채팅 전송 버튼
    const chatSendButton = document.getElementById("chat-send-button");
    if (chatSendButton) {
        chatSendButton.addEventListener("click", () => {
            const chatInput = document.getElementById("chat-input");
            if (!chatInput) return;
            const message = chatInput.value.trim();
            if (message && !isSendingMessage) {
                isSendingMessage = true;
                multiplayer.sendChatMessage(message);
                chatInput.value = "";
                isSendingMessage = false;
            }
        });
    }

    // 채팅 입력 필드
    const chatInput = document.getElementById("chat-input");
    if (chatInput) {
        chatInput.addEventListener("input", (event) => {
            currentMessage = event.target.value.trim();
        });

        chatInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && currentMessage) {
                if (!isSendingMessage) {
                    isSendingMessage = true;
                    multiplayer.sendChatMessage(currentMessage);
                    chatInput.value = "";
                    currentMessage = "";
                    isSendingMessage = false;
                }
                event.preventDefault();
            }
        });
    }

    // 통계 팝업 함수
    function showStatisticsPopup(rankings) {
        console.log("showStatisticsPopup 호출됨:", rankings); // 로그 추가

        // 팝업 요소 생성
        const popup = document.createElement('div');
        popup.id = 'statistics-popup';
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        popup.style.color = 'white';
        popup.style.padding = '20px';
        popup.style.borderRadius = '10px';
        popup.style.zIndex = '1000';
        popup.style.textAlign = 'center';
        popup.style.width = '300px';

        // 타이틀 추가
        const title = document.createElement('h2');
        title.innerText = '게임이 종료되었습니다.';
        popup.appendChild(title);

        // 등수 테이블 생성
        const table = document.createElement('table');
        table.style.margin = '0 auto';
        table.style.borderCollapse = 'collapse';
        table.style.width = '100%';
        table.style.marginBottom = '10px';

        const headerRow = document.createElement('tr');
        const rankHeader = document.createElement('th');
        rankHeader.innerText = '등수';
        rankHeader.style.border = '1px solid white';
        rankHeader.style.padding = '8px';
        const nicknameHeader = document.createElement('th');
        nicknameHeader.innerText = '닉네임';
        nicknameHeader.style.border = '1px solid white';
        nicknameHeader.style.padding = '8px';
        headerRow.appendChild(rankHeader);
        headerRow.appendChild(nicknameHeader);
        table.appendChild(headerRow);

        rankings.forEach(player => {
            const row = document.createElement('tr');
            const rankCell = document.createElement('td');
            rankCell.innerText = `${player.rank}등`;
            rankCell.style.border = '1px solid white';
            rankCell.style.padding = '8px';
            const nicknameCell = document.createElement('td');
            nicknameCell.innerText = player.nickname;
            nicknameCell.style.border = '1px solid white';
            nicknameCell.style.padding = '8px';
            row.appendChild(rankCell);
            row.appendChild(nicknameCell);
            table.appendChild(row);
        });

        popup.appendChild(table);

        // 남은 시간 표시
        const countdown = document.createElement('p');
        countdown.id = 'countdown-timer';
        countdown.innerText = '10초 후에 닫힙니다.';
        popup.appendChild(countdown);

        document.body.appendChild(popup);
        console.log("통계 팝업이 DOM에 추가되었습니다."); // 로그 추가

        let remainingSeconds = 10;
        const countdownInterval = setInterval(() => {
            remainingSeconds -= 1;
            if (remainingSeconds > 0) {
                countdown.innerText = `${remainingSeconds}초 후에 닫힙니다.`;
            } else {
                clearInterval(countdownInterval);
                popup.remove();
                console.log("통계 팝업이 닫혔습니다."); // 로그 추가

                // 버튼 재활성화
                const controls = document.querySelectorAll('#game-controls button, .tetris-button');
                controls.forEach(button => {
                    button.disabled = false;
                    button.style.opacity = '1';
                    button.style.cursor = 'pointer';
                });

                isGameEnded = false; // 게임 종료 플래그 리셋
            }
        }, 1000);
    }
});

