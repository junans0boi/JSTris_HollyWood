// Network.js
export class Network {
  constructor(url, nickname, roomId, token) {
    this.url = url;
    this.nickname = nickname;
    this.roomId = roomId;
    this.token = token;
    this.socket = new WebSocket(`${url}${roomId}`);
    this.handlers = [];

    this.socket.onopen = () => {
      console.log("WebSocket connection established");
      this.onOpen();
    };

    this.socket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      console.log("WebSocket 메시지 수신:", data); // 모든 메시지 로그
      // 추가적인 메시지 타입 처리
      this.handlers.forEach(handler => handler(data));
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket 연결 오류:', error);
      setTimeout(() => {
        console.log('WebSocket 재연결 시도 중...');
        this.socket = new WebSocket(`${this.url}${roomId}`);
      }, 5000);  // 5초 후 재시도
    };

    this.socket.onclose = () => {
      console.log("Disconnected from server!");
    };
  }

  send(message) {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      console.log("WebSocket 메시지 전송:", message); // 전송 메시지 로그
    } else {
      console.warn("WebSocket is not open. Cannot send message.");
    }
  }

  sendChatMessage(message) {
    this.send({
      type: "chat",
      message: message
    });
  }

  addMessageHandler(handler) {
    this.handlers.push(handler);  // Register message handler
  }
}
