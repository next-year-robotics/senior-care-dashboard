// care-telemetry/1 문서 타입. 정본: contracts/care-telemetry/v1/README.md (복사본). 필드 추가는 선택 필드만.
export type BridgeState = 'ready' | 'degraded' | 'error' | 'unknown'
export type MissionState = 'idle' | 'starting' | 'active' | 'arrived' | 'cancelling' | 'cancelled' | 'error' | 'unknown'
export type TrackingState = 'unavailable' | 'searching' | 'following' | 'lost' | 'error' | 'unknown'
export type Severity = 'info' | 'warning' | 'critical'
export type EventKind =
  | 'agent.online' | 'agent.offline' | 'link.connected' | 'link.disconnected'
  | 'trip.start' | 'trip.arrived' | 'trip.cancelled' | 'trip.error'
  | 'sos.request' | 'sos.ack' | 'sos.clear' | 'error'

export interface RobotStatus {
  updated_at_ms: number
  agent: { version: string; uptime_s: number; queue_len: number }
  bridge_state: BridgeState | string
  mission_state: MissionState | string
  tracking_state: TrackingState | string
  trip_id: string | null
  from_place_id: string | null
  to_place_id: string | null
  battery_percent: number | null
  last_error: string | null
  phone_link: { connected: boolean; last_seen_ms: number }
  base?: { agent_state: string; cmd_watchdog_ok: boolean; last_seen_ms: number }
}

export interface RobotEvent {
  ts_ms: number
  kind: EventKind | string
  severity: Severity | string
  trip_id?: string | null
  sos_id?: string | null
  message: string
  data?: Record<string, unknown>
}

export interface ActiveSos {
  started_at_ms: number
  updated_at_ms: number
  reason: string
  severity: 'critical' | 'warning' | string
  trip_id: string | null
  app_received: boolean
  location: null | {
    lat: number; lon: number; accuracy_m: number | null; captured_at_ms: number; source: 'cache' | 'fresh' | string; low_confidence: boolean
  }
}

export interface RobotMeta { robot_id: string; display_name: string; agent_version: string; first_seen_ms: number }
export type AccessRole = 'guardian' | 'dev'

/** P2 diagnostics, README §3.5. Optional fields tolerate partial producer snapshots. */
export interface TopicFreshness { last_seen_ms?: number | null; hz?: number | null }
export interface TopicTree { [name: string]: TopicFreshness | TopicTree }
export interface DiagnosticError { ts_ms?: number; source?: string; error?: string }
export interface RobotDiagnostics {
  updated_at_ms?: number
  topics?: TopicTree
  recent_errors?: DiagnosticError[] | Record<string, DiagnosticError>
}
