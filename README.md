# Senior Care Dashboard

로봇의 상태와 돌봄 이벤트를 수집해 Firebase 기반 웹 대시보드로 제공하는 프로젝트

## 예정 구조

```text
apps/
├── robot-agent/              # RPi5에서 실행
│   ├── care_telemetry_agent/ # ROS 2 구독·변환·전송
│   └── config/              # 토픽·판정 기준·전송 설정
└── web/                     # 보호자용 React PWA
firebase/                    # RTDB·인증·알림·호스팅 설정
packages/
└── contracts/               # 상태·이벤트 데이터 형식
scripts/                     # 실행·배포
```

## 연동 흐름

```text
mobile-robot의 ROS 2 토픽 → RPi5의 robot-agent → HTTPS → Firebase RTDB → 웹/PWA
```

RPi5의 에이전트가 토픽을 구독해 운행 상태,돌봄 이벤트를 JSON으로 요약합니다. 상태는 변경 시 전송하고 변화가 없으면 5초마다 갱신하며, 이벤트는 즉시 전송합니다. 단절 중 이벤트는 SQLite에 보관했다가 재전송합니다.

영상,센서,정밀 위치는 보내지 않으며, 웹에서 로봇을 제어하지 않습니다.
