// 로봇 시뮬레이터 — care-telemetry/1 문서를 RTDB **에뮬레이터**에 쓴다.
// 사용:  firebase emulators:start (다른 터미널) → node tools/robot-sim/sim.mjs [--robot mr-001] [--fast]
//        node tools/robot-sim/sim.mjs --grant <uid> [--role guardian|dev]   # 에뮬레이터에 접근 권한 넣기
// 실제 DB에는 쓰지 않는다(서비스 계정이 필요). 실제 DB 시험은 mobile-robot의 mr_care_telemetry --sim 을 쓴다.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const fixtures = (name) => JSON.parse(readFileSync(path.join(root, 'contracts/care-telemetry/v1/fixtures', `${name}.json`), 'utf8'));

const args = process.argv.slice(2);
const robotId = args.includes('--robot') ? args[args.indexOf('--robot') + 1] : 'mr-001';
const fast = args.includes('--fast');
const NS = process.env.RTDB_NS ?? 'senior-care-nyr-default-rtdb';
const HOST = process.env.FIREBASE_DATABASE_EMULATOR_HOST ?? '127.0.0.1:9000';
const base = `http://${HOST}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, fast ? ms / 5 : ms));
const now = () => Date.now();

// RTDB push id (시간순 정렬 보장). firebase 클라이언트 구현을 단순화한 것.
const PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
function pushId(ts = now()) {
  let s = '';
  for (let i = 7; i >= 0; i--) { s = PUSH_CHARS[ts % 64] + s; ts = Math.floor(ts / 64); }
  for (let i = 0; i < 12; i++) s += PUSH_CHARS[Math.floor(Math.random() * 64)];
  return s;
}

async function write(p, body, method = 'PUT') {
  // 에뮬레이터는 Bearer owner 토큰을 관리자(규칙 우회)로 취급한다. 실제 DB에는 통하지 않는다.
  const res = await fetch(`${base}/${p}.json?ns=${NS}`, {
    method, headers: { 'content-type': 'application/json', authorization: 'Bearer owner' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${p} → ${res.status} ${await res.text()}`);
}
const R = (p) => `robots/${robotId}/${p}`;

let status = { ...fixtures('status-idle-offline-phone'), base: { agent_state: 'connected', cmd_watchdog_ok: true, last_seen_ms: now() }, phone_link: { connected: true, last_seen_ms: now() }, last_error: null, bridge_state: 'ready', agent: { version: 'sim', uptime_s: 0, queue_len: 0 } };
async function pushStatus(patch = {}) {
  status = { ...status, ...patch, updated_at_ms: now() };
  status.agent = { ...status.agent, uptime_s: status.agent.uptime_s + 5 };
  status.phone_link = { ...status.phone_link, last_seen_ms: now() };
  status.base = { ...status.base, last_seen_ms: now() };
  await write(R('status'), status);
  await pushDiagnostics();
}
// RTDB object keys cannot contain '/': nested nodes preserve the topic path.
async function pushDiagnostics() {
  const ts = now();
  await write(R('diag'), {
    updated_at_ms: ts,
    topics: {
      base: { status: { last_seen_ms: ts - 100, hz: 9.8 } },
      joint_states: { last_seen_ms: ts - 50, hz: 49.6 },
      marker_track: { last_seen_ms: status.tracking_state === 'unavailable' ? 0 : ts - 100, hz: status.tracking_state === 'unavailable' ? 0 : 10 },
      robot: { app_status: { last_seen_ms: ts, hz: 0.5 } },
    },
    recent_errors: [],
  });
}
async function event(kind, severity, message, data = {}, extra = {}) {
  const ts_ms = now();
  await write(R(`events/${pushId(ts_ms)}`), { ts_ms, kind, severity, message, data, trip_id: status.trip_id ?? null, sos_id: null, ...extra });
  console.log(new Date(ts_ms).toISOString(), kind, '-', message);
}

async function main() {
  console.log(`robot-sim → ${base} ns=${NS} robot=${robotId}`);
  if (args.includes('--grant')) {
    const uid = args[args.indexOf('--grant') + 1];
    const role = args.includes('--role') ? args[args.indexOf('--role') + 1] : 'guardian';
    if (!uid) throw new Error('--grant <uid> [--role guardian|dev]');
    await write(`access/${robotId}/${uid}`, role);
    console.log(`granted ${role} on ${robotId} to ${uid}`);
    return;
  }
  await write(R('meta'), { ...fixtures('meta'), robot_id: robotId, agent_version: 'sim' });
  await pushStatus({ mission_state: 'idle', tracking_state: 'unavailable', trip_id: null, from_place_id: null, to_place_id: null });
  await event('agent.online', 'info', '로봇이 온라인이 되었어요', { version: 'sim' });
  const heartbeat = setInterval(() => pushStatus().catch((e) => console.error(e.message)), 5000);

  for (;;) {
    await sleep(10000);
    const trip_id = crypto.randomUUID();
    await pushStatus({ mission_state: 'starting', trip_id, from_place_id: 'place_home', to_place_id: 'place_market' });
    await event('trip.start', 'info', '집에서 시장으로 출발했어요', { from_place_id: 'place_home', to_place_id: 'place_market' });
    await sleep(3000);
    await pushStatus({ mission_state: 'active', tracking_state: 'following' });
    await sleep(20000);

    const sos_id = crypto.randomUUID();
    await pushStatus({ tracking_state: 'lost' });
    await write(R(`sos/${sos_id}`), { started_at_ms: now(), updated_at_ms: now(), reason: 'tracking_lost', severity: 'critical', trip_id, app_received: false, location: null });
    await event('sos.request', 'critical', '로봇이 어르신을 놓쳤어요', { reason: 'tracking_lost' }, { sos_id });
    await sleep(1500);
    await write(R(`sos/${sos_id}`), { started_at_ms: now() - 1500, updated_at_ms: now(), reason: 'tracking_lost', severity: 'critical', trip_id, app_received: true,
      location: { lat: 36.1234 + Math.random() * 1e-3, lon: 128.5678 + Math.random() * 1e-3, accuracy_m: 4.2, captured_at_ms: now() - 800, source: 'cache', low_confidence: false } });
    await event('sos.ack', 'info', '어르신 폰이 응답했어요', { app_received: true, retries: 0, location: 'cache', accuracy_bucket: 'good' }, { sos_id });
    await sleep(15000);
    await write(R(`sos/${sos_id}`), undefined, 'DELETE');
    await pushStatus({ tracking_state: 'following' });
    await event('sos.clear', 'info', '어르신을 다시 찾았어요', { resolution: 'tracking_recovered' }, { sos_id });
    await sleep(10000);

    await pushStatus({ mission_state: 'cancelling' });
    await sleep(2000);
    await pushStatus({ mission_state: 'cancelled', tracking_state: 'unavailable' });
    await event('trip.cancelled', 'info', '주행을 멈췄어요', { reason: 'user_request' });
    await sleep(3000);
    await pushStatus({ mission_state: 'idle', trip_id: null, from_place_id: null, to_place_id: null });
  }
  // eslint-disable-next-line no-unreachable
  clearInterval(heartbeat);
}
main().catch((e) => { console.error(e); process.exit(1); });
