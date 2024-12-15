# stats_processor.py
import socket
import json

HOST = 'localhost'  # 통신할 호스트
PORT = 65432        # 포트 번호

def handle_message(message):
    # 메시지 처리 로직 (예: 로그 파일에 기록)
    with open('stats.log', 'a') as f:
        f.write(json.dumps(message) + '\n')
    print(f"Received and logged: {message}")

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.bind((HOST, PORT))
    s.listen()
    print(f"Stats processor listening on {HOST}:{PORT}")
    while True:
        conn, addr = s.accept()
        with conn:
            print(f"Connected by {addr}")
            data = conn.recv(1024)
            if not data:
                break
            message = json.loads(data.decode())
            handle_message(message)

