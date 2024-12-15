# /home/ubuntu/Project/Tetris/backend/app/utils/logger.py

import logging
from logging.handlers import RotatingFileHandler
import os
import threading
import queue

# 로그 디렉토리 생성
LOG_DIR = "logs"
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

log_queue = queue.Queue()

class QueueHandler(logging.Handler):
    def __init__(self, log_queue):
        super().__init__()
        self.log_queue = log_queue

    def emit(self, record):
        self.log_queue.put(self.format(record))

# 로거 설정
logger = logging.getLogger("tetris_logger")
logger.setLevel(logging.INFO)

# 핸들러 설정: 파일 핸들러 (5MB 단위로 5개 파일 롤링)
file_handler = RotatingFileHandler(
    os.path.join(LOG_DIR, "tetris.log"), maxBytes=5 * 1024 * 1024, backupCount=5
)
formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

# 콘솔 핸들러 (선택 사항)
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

# 큐 핸들러 추가
queue_handler = QueueHandler(log_queue)
queue_handler.setFormatter(formatter)
logger.addHandler(queue_handler)

def log_worker():
    while True:
        log_message = log_queue.get()
        if log_message == "STOP":
            break
        # 로그 메시지를 파일과 콘솔에 기록
        file_handler.emit(
            logging.makeLogRecord({"msg": log_message, "levelno": logging.INFO})
        )
        console_handler.emit(
            logging.makeLogRecord({"msg": log_message, "levelno": logging.INFO})
        )

# 로그 워커 스레드 시작
log_thread = threading.Thread(target=log_worker, daemon=True)
log_thread.start()
