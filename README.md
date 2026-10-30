# Senior Care Dashboard

로봇 상태와 돌봄 이벤트를 실시간으로 보여 주는 보호자용 웹 대시보드.
RPi5의 `mr_care_telemetry`가 Firebase RTDB에 올린 데이터를 읽으며, 웹에서 로봇을 제어하지 않는다.

```text
mobile-robot → mr_care_telemetry → Firebase RTDB → React 대시보드
```

Google 로그인과 로봇별 접근 권한을 사용한다. 보호자는 상태·이벤트·SOS를 보고, `dev` 역할은 진단 탭도 볼 수 있다. 진단 데이터 읽기 권한은 RTDB 규칙에서도 제한한다.
상태 갱신이 15초 이상 없으면 마지막 값을 유지하며 오프라인으로 표시한다. 폰 위치는 SOS 중에만 표시하고, SOS 종료 시 서버에서 삭제한다.

## 구조

```text
web/                 Vite + React + TypeScript + Tailwind, Firebase Auth·RTDB
contracts/           mobile-robot/software/contracts/care-telemetry의 사본
scripts/             계약 동기화
database.rules.json  RTDB 보안 규칙 사본
firebase.json        Hosting·에뮬레이터 설정
tools/robot-sim/     로봇 시뮬레이터
```

데이터 형식은 [care-telemetry 계약](contracts/care-telemetry/v1/README.md)을 따른다. 계약과 보안 규칙은 [mobile-robot](https://github.com/next-year-robotics/mobile-robot)의 정본에서 동기화한다.

## 로컬 실행

Node.js 22와 Firebase CLI가 필요하다.

```bash
cd web
npm ci
cd ..
firebase emulators:start             # 터미널 1
node tools/robot-sim/sim.mjs          # 터미널 2
cd web
npm run dev                         # 터미널 3: http://127.0.0.1:5173
```

에뮬레이터에서 Google 로그인 후 권한 안내 화면의 uid로 접근 권한을 부여한다.

```bash
node tools/robot-sim/sim.mjs --grant <uid>
node tools/robot-sim/sim.mjs --grant <uid> --role dev
```

로컬 개발은 기본적으로 Auth·RTDB 에뮬레이터를 사용한다. 실제 Firebase 연결은 `web/.env.development.local`에 `VITE_USE_EMULATORS=0`을 설정하고, Google 로그인 제공자와 `/access/{robot_id}/{uid}` 권한을 준비한다.

## 검증

```bash
cd web
npm run lint && npm run typecheck && npm test -- --run && npm run build
npx playwright install chromium    # 최초 1회
npm run test:e2e
```

브라우저 시험은 Auth·RTDB 에뮬레이터가 실행 중이어야 하며, Vite는 자동으로 시작한다. `mr-001` 데이터와 시험 계정 권한을 갱신하므로 별도 시뮬레이터는 종료한다.
로그인·권한 회수·상태·이벤트·SOS·진단과 모바일 200% 글꼴을 검사한다. 실제 DB에는 쓰지 않는다.

## 계약 동기화·배포

```bash
scripts/sync-contracts.sh ../mobile-robot/software/contracts
firebase deploy --only database
firebase deploy --only hosting     # web에서 npm run build 후 실행
```

CI는 웹 검사와 정본 계약의 차이를 확인한다. 정본은 기본적으로 `mobile-robot/main`을 사용하며 저장소 변수 `CONTRACTS_REF`로 변경할 수 있다.
