// Multiplayer.js
import { blocks } from './Block.js';

export class Multiplayer {
    constructor(network, displayPlayersCallback, nickname) { // nickname 추가
        this.network = network;
        this.playerNicknames = {};
        this.messageHandlers = [];
        this.isHost = false;
        this.startButton = null;
        this.displayPlayersCallback = displayPlayersCallback;
        this.nickname = nickname; // 로컬 닉네임 저장
        this.gameEnded = false; // 게임 종료 여부 플래그 추가
        this.initializeNetworkHandlers();
    }

    initializeNetworkHandlers() {
        this.network.addMessageHandler((message) => {
            switch (message.type) {
                case 'update_players':
                    this.displayPlayersCallback(message.players, message.host);
                    this.playerNicknames = {};
                    message.players.forEach(p => {
                        this.playerNicknames[p] = p;
                    });
                    if (this.nickname && this.nickname === message.host) {
                        console.log("현재 사용자가 방장입니다.");
                        console.log("방 제목:", message.title); // 방 제목 확인                    
                        this.isHost = true;
                        this.displayStartButton(message.title); // title이 제대로 전달되었는지 확인
                    } else {
                        this.isHost = false;
                        this.hideStartButton();
                    }
                    break;
                case 'chat':
                    this.handleChatMessage(message);
                    break;
                case 'start':
                    this.handleStartMessage(message);
                    break;
                case 'game_end':
                    this.handleGameEnd(message); // 개선된 핸들링
                    break;
                case 'game_state':
                    this.updatePlayerScreen(message.player_id, message.state);
                    break;
                case 'add_garbage':
                    this.handleAddGarbage(message.count);
                    break;
                case 'remove_garbage':
                    this.handleRemoveGarbage(message.count);
                    break;

                default:
                    break;
            }
            // 모든 메시지를 외부 핸들러로 전달
            this.messageHandlers.forEach(handler => handler(message));
        });
    }

    handleStartMessage(message) {
        console.log("Start message received:", message); // 로그 추가
        this.messageHandlers.forEach((handler) => handler(message));
        this.hideStartButton(); // 게임이 시작되면 버튼 숨기기
    }

    handleGameEnd(message) {
        if (this.isHost) {
            this.displayStartButton(message.title); // 게임 종료 후 시작 버튼 다시 표시
        }
        // 모든 플레이어의 캔버스를 초기화
        const multiplayerContainer = document.getElementById("multiplayer-container");
        if (multiplayerContainer) {
            const playerCanvases = multiplayerContainer.querySelectorAll("canvas");
            playerCanvases.forEach(canvas => {
                const context = canvas.getContext('2d');
                context.clearRect(0, 0, canvas.width, canvas.height);
                // 또한 플레이어의 grid 상태를 초기화할 수 있다면 추가적으로 구현
            });
            console.log("타 플레이어의 캔버스가 초기화되었습니다.");
        }
        if (!this.gameEnded) { // 게임이 아직 끝나지 않은 경우에만 처리
            this.gameEnded = true;
            if (this.isHost) {
                this.displayStartButton(message.title);
            }
            window.game.stop(); // 한 번만 호출
            // 통계 팝업은 main.js에서 처리되므로 여기서는 추가 작업 필요 없음
            console.log("게임 종료가 처리되었습니다.");
        }
    }

    handleChatMessage(message) {
        const chatBox = document.getElementById('chat-box');
        const chatMessage = document.createElement('p');
        chatMessage.textContent = `${message.sender}: ${message.message}`;
        chatBox.appendChild(chatMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    sendChatMessage(message) {
        this.network.send({
            type: "chat",
            message: message,
        });
    }

    updatePlayerScreen(playerNickname, data) {
        // 로컬 플레이어면 패스 (자신의 화면은 Game.js에서 렌더)
        if (playerNickname === this.nickname) return;

        let playerContainer = document.getElementById(`player-container-${playerNickname}`);
        if (!playerContainer) {
            playerContainer = document.createElement('div');
            playerContainer.id = `player-container-${playerNickname}`;
            playerContainer.classList.add('other-player-container');

            const playerCanvas = document.createElement('canvas');
            playerCanvas.id = `player-${playerNickname}`;
            playerCanvas.width = 100;
            playerCanvas.height = 200;

            const nicknameElement = document.createElement('p');
            nicknameElement.id = `nickname-${playerNickname}`;
            nicknameElement.style.color = 'white';
            nicknameElement.innerText = playerNickname;

            playerContainer.appendChild(playerCanvas);
            playerContainer.appendChild(nicknameElement);

            // multiplayer-container 영역에 추가
            document.getElementById('multiplayer-container').appendChild(playerContainer);
        }

        const playerCanvas = document.getElementById(`player-${playerNickname}`);
        const context = playerCanvas.getContext('2d');
        context.clearRect(0, 0, playerCanvas.width, playerCanvas.height);

        const cellSize = playerCanvas.width / 10;

        data.grid.forEach((cellType, index) => {
            if (cellType !== -1) {
                const x = index % 10;
                const y = Math.floor(index / 10);
                this.drawCell(context, x, y, cellType, 0, 0, cellSize);
            }
        });

        if (data.activeTetra) {
            const { x, y, type, angle } = data.activeTetra;
            blocks[type].shape[angle].forEach(([dx, dy]) => {
                const cellX = x + dx;
                const cellY = y + dy;
                if (cellY >= 0) {
                    this.drawCell(context, cellX, cellY, type, 0, 0, cellSize);
                }
            });
        }

        console.log(`playerNickname ${playerNickname}의 화면이 업데이트되었습니다.`);
    }

    drawCell(context, x, y, type, offsetX = 0, offsetY = 0, size) {
        const block = blocks[type];
        const cellX = offsetX + x * size;
        const cellY = offsetY + y * size;

        context.fillStyle = block.color;
        context.fillRect(cellX + 0.5, cellY + 0.5, size - 1, size - 1);

        context.strokeStyle = block.highlight;
        context.beginPath();
        context.moveTo(cellX + 0.5, cellY + size - 0.5);
        context.lineTo(cellX + 0.5, cellY + 0.5);
        context.lineTo(cellX + size - 0.5, cellY + 0.5);
        context.stroke();

        context.strokeStyle = block.shadow;
        context.beginPath();
        context.moveTo(cellX + 0.5, cellY + size - 0.5);
        context.lineTo(cellX + size - 0.5, cellY + size - 0.5);
        context.lineTo(cellX + size - 0.5, cellY + 0.5);
        context.stroke();
    }

    displayStartButton(roomTitle) { // Receive room title
        if (this.isHost) {
            if (!this.startButton) {
                this.startButton = document.createElement('button');
                this.startButton.innerText = 'Start Game';
                this.startButton.addEventListener('click', () => {
                    this.network.send({ type: 'start_request' });
                });
                document.getElementById('game-controls').appendChild(this.startButton);
            }
            this.startButton.style.display = 'block';

            // Optionally, update the button text or add additional info
            this.startButton.title = `${roomTitle} 방을 시작합니다.`;
        }
    }

    hideStartButton() {
        if (this.startButton) {
            this.startButton.style.display = 'none';
        }
    }
    handleAddGarbage(count) {
        console.log(`Received add_garbage message with count: ${count}`); // 추가된 로그
        if (count > 0) {
            window.game.addGarbageLines(count);
            console.log(`GarbageLines 추가됨: ${count}`);
        }
    }    

    handleRemoveGarbage(count) {
        if (count > 0) {
            window.game.removeGarbageLines(count);
            console.log(`GarbageLines 제거됨: ${count}`);
        }
    }
    addGarbageLines(count) {
        // 자신의 필드에 가비지 라인 추가
        const garbageLines = [];
        for (let i = 0; i < count; i++) {
            const garbageLine = new Array(this.stageWidth).fill(6); // 6은 garbage block의 type index
            const gapIndex = Math.floor(Math.random() * this.stageWidth);
            garbageLine[gapIndex] = null;
            garbageLines.push(garbageLine);
        }
        window.game.addGarbageLines(garbageLines);
    }
    addMessageHandler(handler) {
        this.messageHandlers.push(handler);
    }
}

