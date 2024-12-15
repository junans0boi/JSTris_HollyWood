// /home/ubuntu/Project/Tetris/frontend/js/lobby.js
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

(async () => {
  const token = localStorage.getItem("token"); // JWT 토큰
  const nickname = localStorage.getItem("nickname"); // 사용자 닉네임

  const userNicknameSpan = document.getElementById("user-nickname");
  const loginPrompt = document.getElementById("login-prompt");

  function updateUserProfile() {
    if (token && nickname) {
      userNicknameSpan.innerText = nickname;
      if (loginPrompt) loginPrompt.style.display = "none";
    } else {
      userNicknameSpan.innerText = "Loading...";
      if (loginPrompt) loginPrompt.style.display = "block";
    }
  }

  updateUserProfile(); // 초기 프로필 상태

  const createRoomButton = document.getElementById("create-room");
  if (createRoomButton) {
    createRoomButton.addEventListener("click", () => {
      if (!token) {
        alert("방을 만들기 위해서는 로그인이 필요합니다.");
        window.location.href = "login.html";
        return;
      }
      document.getElementById("popup").style.display = "block";
    });
  }

  const closePopupButton = document.getElementById("close-popup");
  if (closePopupButton) {
    closePopupButton.addEventListener("click", () => {
      document.getElementById("popup").style.display = "none";
    });
  }

  const createRoomSubmitButton = document.getElementById("create-room-submit");
  if (createRoomSubmitButton) {
    createRoomSubmitButton.addEventListener("click", async () => {
      if (!token) {
        alert("방을 만들기 위해서는 로그인이 필요합니다.");
        window.location.href = "login.html";
        return;
      }

      const title = document.getElementById("room-title").value.trim();
      const passwordInput = document.getElementById("room-password").value.trim();
      const is_private = !!passwordInput;
      const password = is_private ? passwordInput : null;
      const maxPlayers = parseInt(document.getElementById("max-players").value, 10);
      const host = nickname;

      if (!title) {
        alert("방 제목을 입력하세요.");
        return;
      }

      if (!host) {
        alert("호스트 이름이 유효하지 않습니다.");
        return;
      }

      if (isNaN(maxPlayers) || maxPlayers < 2) {
        alert("최소 2명 이상의 인원을 설정하세요.");
        return;
      }

      const payload = { title, is_private, password, max_players: maxPlayers };
      console.log("Payload to be sent:", payload);

      try {
        const response = await fetch("http://tetris.junzzang.kro.kr:5002/api/rooms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem("host", data.host);
          window.location.href = `game.html?room_id=${data.room_id}`;
        } else {
          const error = await response.json();
          console.error("오류:", error);
          alert(`오류: ${error.detail}`);
        }
      } catch (error) {
        console.error("방 만들기 요청 중 에러 발생:", error);
        alert("방 만들기 중 오류가 발생했습니다.");
      }
    });
  }

  async function refreshRoomList(page = 1, perPage = 4) {
    try {
      const response = await fetch("http://tetris.junzzang.kro.kr:5002/api/rooms", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      const rooms = data.rooms || [];

      console.log("방 목록:", rooms);

      const totalRooms = rooms.length;
      const totalPages = Math.ceil(totalRooms / perPage);
      const currentPage = Math.min(page, totalPages) || 1;
      const startIndex = (currentPage - 1) * perPage;
      const endIndex = startIndex + perPage;
      const roomsToDisplay = rooms.slice(startIndex, endIndex);

      const roomList = document.getElementById("room-list");
      roomList.innerHTML = "";

      roomsToDisplay.forEach((room) => {
        const status = room.game_started ? "게임 시작됨" : "대기 중";
        const roomCard = document.createElement("div");
        roomCard.classList.add("room-card");
        roomCard.innerHTML = `
              <h3>${room.title} (${room.current_players}/${room.max_players})</h3>
              <p>방장: ${room.host}</p>
              <p>${room.password ? "🔒 비공개 방" : "🔓 공개 방"} | 상태: ${status}</p>
              <button onclick="joinRoom('${room.id}', ${!!room.password}, ${room.game_started})">참여</button>
            `;
        roomList.appendChild(roomCard);
      });

      document.getElementById("current-page").innerText = currentPage;
      document.getElementById("total-pages").innerText = totalPages;

      const prevPageButton = document.getElementById("prev-page");
      const nextPageButton = document.getElementById("next-page");

      prevPageButton.disabled = currentPage === 1;
      nextPageButton.disabled = currentPage === totalPages;

      window.currentPage = currentPage;
      window.totalPages = totalPages;

      displayConnectedClients();
    } catch (error) {
      console.error("방 목록 가져오기 중 오류 발생:", error);
      alert("방 목록을 가져오는 중 오류가 발생했습니다.");
    }
  }


  async function displayConnectedClients() {
    if (!token) {
      const clientList = document.getElementById("client-list");
      clientList.innerHTML = "";
      return;
    }

    try {
      const response = await fetch("http://tetris.junzzang.kro.kr:5002/api/clients", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      const clientList = document.getElementById("client-list");
      clientList.innerHTML = "";

      data.clients.forEach(client => {
        if (client !== nickname) {
          const li = document.createElement("li");
          li.textContent = client;
          clientList.appendChild(li);
        }
      });
    } catch (error) {
      console.error("클라이언트 목록 가져오기 중 오류 발생:", error);
      alert("클라이언트 목록을 가져오는 중 오류가 발생했습니다.");
    }
  }

  await refreshRoomList();
  setInterval(() => refreshRoomList(window.currentPage || 1), 10000);

  const refreshButton = document.getElementById("refresh");
  if (refreshButton) {
    refreshButton.addEventListener("click", () => {
      refreshRoomList(window.currentPage || 1);
    });
  } else {
    console.error("새로고침 버튼을 찾을 수 없습니다.");
  }

  const prevPageButton = document.getElementById("prev-page");
  const nextPageButton = document.getElementById("next-page");

  if (prevPageButton) {
    prevPageButton.addEventListener("click", () => {
      if (window.currentPage > 1) {
        refreshRoomList(window.currentPage - 1);
      }
    });
  }

  if (nextPageButton) {
    nextPageButton.addEventListener("click", () => {
      if (window.currentPage < window.totalPages) {
        refreshRoomList(window.currentPage + 1);
      }
    });
  }

  window.joinRoom = async function joinRoom(roomId, isPrivate, gameStarted) {
    if (gameStarted) {
      alert("이미 게임이 시작된 방입니다. 다른 방에 참가해주세요.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("방에 참여하기 위해서는 로그인이 필요합니다.");
      window.location.href = "login.html";
      return;
    }

    const nickname = localStorage.getItem("nickname");
    let password = null;

    if (isPrivate) {
      password = prompt("방 비밀번호를 입력하세요 (비어 있으면 공백 입력):") || null;
    }

    const requestBody = {};
    if (password !== null) {
      requestBody.password = password;
    }

    try {
      const response = await fetch(`http://tetris.junzzang.kro.kr:5002/api/rooms/${roomId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const room = await response.json();
        localStorage.setItem("host", room.host || nickname);
        window.location.href = `game.html?room_id=${roomId}`;
      } else {
        const error = await response.json();
        alert(`참여 실패: ${error.detail}`);
      }
    } catch (error) {
      console.error("방 참가 요청 중 에러 발생:", error);
      alert("방 참가 중 오류가 발생했습니다.");
    }
  };

  window.leaveRoom = async function leaveRoom(roomId, playerId) {
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
        body: JSON.stringify({ nickname: playerId }),
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
  };

  // 로비 채팅 기능 구현
  const lobbyChatBox = document.getElementById('lobby-chat-box');
  const lobbyChatInput = document.getElementById('lobby-chat-input');
  const lobbyChatSendButton = document.getElementById('lobby-chat-send-button');

  if (!token) {
    // 로그인 안된 경우 채팅 비활성화
    lobbyChatInput.disabled = true;
    lobbyChatSendButton.disabled = true;
  } else {
    // 로그인 됐을 때 채팅 전송 핸들러
    lobbyChatSendButton.addEventListener('click', () => {
      const message = lobbyChatInput.value.trim();
      if (message) {
        // 서버에 채팅 메시지 전송
        stompClient.send("/app/lobby/chat", {}, JSON.stringify({
          sender: nickname,
          message: message
        }));
        lobbyChatInput.value = '';
      }
    });
  }

  // WebSocket 연결 및 Stomp 클라이언트 설정
  let stompClient = null;

  async function connectLobbySocket() {
    if (!token) return; // 로그인 안된 경우 로비 소켓 연결 안함

    const socket = new SockJS("http://tetris.junzzang.kro.kr:5002/ws");
    stompClient = Stomp.over(socket);
    stompClient.debug = null; // 디버그 로그 비활성화

    stompClient.connect({ Authorization: `Bearer ${token}` }, (frame) => {
      console.log("로비 Stomp 연결 성공:", frame);

      // 채팅 구독
      stompClient.subscribe('/topic/lobby/chat', (message) => {
        const data = JSON.parse(message.body);
        console.log("로비 Stomp 수신 (채팅):", data);
        if (data.sender !== nickname) {
          const msgDiv = document.createElement('div');
          msgDiv.classList.add('chat-message', 'other');
          msgDiv.textContent = `${data.sender}: ${data.message}`;
          lobbyChatBox.appendChild(msgDiv);
          lobbyChatBox.scrollTop = lobbyChatBox.scrollHeight;
        }
      });

      // 플레이어 목록 구독
      stompClient.subscribe('/topic/lobby/players', (message) => {
        const data = JSON.parse(message.body);
        console.log("로비 Stomp 수신 (플레이어 목록):", data);
        updatePlayerList(data.players);
      });

      // 기타 필요한 구독 추가 가능
    }, (error) => {
      console.error("로비 Stomp 연결 오류:", error);
      alert("로비 소켓 연결 중 오류가 발생했습니다.");
    });
  }

  // 플레이어 목록 업데이트 함수
  function updatePlayerList(players) {
    const clientList = document.getElementById("client-list");
    clientList.innerHTML = "";

    players.forEach(client => {
      if (client !== nickname) {
        const li = document.createElement("li");
        li.textContent = client;
        clientList.appendChild(li);
      }
    });
  }

  // 채팅 메시지 전송 함수
  function sendLobbyMessage() {
    const message = lobbyChatInput.value.trim();
    if (message && stompClient && stompClient.connected) {
      stompClient.send("/app/lobby/chat", {}, JSON.stringify({
        sender: nickname,
        message: message
      }));
      lobbyChatInput.value = '';
    }
  }

  // DOMContentLoaded 후 실행되는 초기 로직에서 connectLobbySocket 호출
  document.addEventListener("DOMContentLoaded", async () => {
    connectLobbySocket();

    const lobbyChatSendButton = document.getElementById('lobby-chat-send-button');
    lobbyChatSendButton.addEventListener('click', sendLobbyMessage);

    const lobbyChatInput = document.getElementById('lobby-chat-input');
    lobbyChatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendLobbyMessage();
      }
    });
  });

})();
