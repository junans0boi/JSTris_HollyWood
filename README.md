# 🎮 Multi-Play Tetris

## 📋 프로젝트 정보

**과목:** 임베디드 소프트웨어 / IoT  
**팀원:**  
- 이준환 [202045066]  
- 이혁주 [202245063]  
**지도 교수:** 이세훈 교수  
**학과:** 컴퓨터 시스템 공학과 2-B  
**제출일:** 2024년 12월 10일  

---

## 📚 목차

1. [서론](#1%ef%b8%8f%ef%b8%8f-%ec%84%9c%eb%a1%a0)  
2. [관련 연구 및 시스템 고찰](#2%ef%b8%8f%ef%b8%8f-%ea%b4%80%eb%a0%a8-%ec%97%b0%ea%b5%ac-%eb%b0%8f-%ec%8b%9c%ec%8a%a4%ed%85%9c-%ea%b3%a0%ec%b0%a8)  
3. [시스템 설계 및 구현](#3%ef%b8%8f%ef%b8%8f-%ec%8b%9c%ec%8a%a4%ed%85%9c-%ec%84%a4%ea%b3%84-%eb%b0%8f-%ea%b5%ac%ed%98%84)  
4. [결론](#4%ef%b8%8f%ef%b8%8f-%ea%b2%b0%eb%8b%a8)  
5. [참고문헌](#5%ef%b8%8f%ef%b8%8f-%ec%b0%b8%ea%b3%a0%eb%ac%b8%ed%97%8c)  
6. [후기](#6%ef%b8%8f%ef%b8%8f-%ed%9b%84%ea%b8%b0)  

---

## 1⃣ 서론

프로젝트의 필요성:  
테트리스는 전 세계적으로 사랑받는 고전 퍼즐 게임으로 다양한 플랫폼에서 구현되어 있습니다. 본 프로젝트는 웹 기반의 FastAPI를 활용한 멀티플레이어 테트리스 게임 서버를 개발하는 것을 목표로 합니다. 주요 기능은 사용자 인증, 실시간 클라이언트 관리, 게임 로비 및 방 관리 등을 포함하며, 이를 통해 클라우드 서버 운영, Python과 C의 상호 운용성, 멀티스레딩 및 프로세스 간 통신(IPC) 등의 기술을 적용해 보는 경험을 제공합니다.

---

## 2⃣ 관련 연구 및 시스템 고찰

### 🔍 2.1 유사 시스템 비교 및 발설

| **유사 시스템** | **기술 스택**             | **차별점**                      |
| --------------- | ----------------------- | -------------------------------- |
| JSTris          | JavaScript, WebSocket   | FastAPI, C 확장 모듈 등을 통해 성능 향상 |

### 📘 2.2 필요 기술 고찰

- **FastAPI:** RESTful API 구현 고성능 비동기 웹 프레임워크
- **MongoDB:** 유연하고 반응성이 높은 NoSQL 데이터베이스
- **C 확장 모듈:** 비밀번호 해시를 통해 성능 최적화
- **WebSocket:** 실시간 클라이언트-서버 간 양방향 통신 구현
- **JWT 인증:** 사용자 인증 및 보안 강화

---

## 3⃣ 시스템 설계 및 구현

### 💪 3.1 전체 시스템 구조

- **서버:** FastAPI 서버 (Ubuntu 22.04)  
- **데이터베이스:** MongoDB  
- **확장 모듈:** C 확장 모듈  
- **통신 프로토콜:** WebSocket  
- **메인 시스템 구조**  

```
클라이언트 ↔ FastAPI 서버 ↔ MongoDB 데이터베이스  
                      ↓  
                   C 확장 모듈  
```

---

## 4⃣ 결론

본 프로젝트에서는 FastAPI 기반의 멀티플레이 테트리스 서버를 구축하여 사용자 인증, 실시간 클라이언트 관리, 게임 로비 및 방 관리 등의 기능을 성공적으로 구현했습니다. 이를 통해 다음과 같은 기술적 성과를 달성했습니다.

- **확장 모듈:** C를 활용한 성능 최적화
- **멀티스레딩:** 실시간 로그 기록을 구현
- **프로세스 간 통신(IPC):** 별도의 프로세스를 통한 게임 결과 데이터 처리
- **클라우드 서버 운영 경험:** Oracle Cloud의 VM 서버 운영 경험

이러한 성과를 바탕으로, 팀원들은 개발 및 협업 능력을 향상시킬 수 있었으며, 클라우드 환경에서의 개발 및 운영 능력을 높일 수 있었습니다.

---

## 5⃣ 참고문헌

- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [MongoDB 공식 문서](https://www.mongodb.com/docs/)
- [Passlib 공식 문서](https://passlib.readthedocs.io/en/stable/)
- [Python threading 공식 문서](https://docs.python.org/3/library/threading.html)
- [Python socket 공식 문서](https://docs.python.org/3/library/socket.html)

---

## 6⃣ 후기

이번 프로젝트를 통해 다양한 기술을 실제로 구현해보는 소중한 경험을 얻었습니다. 특히, C 확장 모듈을 통한 Python 성능 최적화와 멀티스레딩 및 **프로세스 간 통신(IPC)**을 통해 서버 부하를 줄이는 방법을 학습했습니다. 이 과정을 통해 팀원들과의 협업 능력을 키우고 클라우드 서버 운영에 대한 지식도 향상되었습니다. 이번 프로젝트의 경험을 바탕으로 향후 더욱 발전된 소프트웨어 개발자로 성장할 것입니다.

---

**📹 동작 영상:** [YouTube 링크](https://youtu.be/-8EEKLrAIpM)

