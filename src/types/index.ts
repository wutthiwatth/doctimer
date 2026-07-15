export interface TimerDefinition {
  id: string
  name: string
  shortName?: string
  intervalSeconds: number
  warningBeforeSeconds?: number
  color?: string
  icon?: string
  soundType?: string
  voiceMessage?: string
  vibrationPattern?: number[]
  autoRepeat: boolean
  enabled: boolean
  sortOrder: number
}
export interface TimerGroup {
  id: string
  name: string
  description?: string
  timers: TimerDefinition[]
  createdAt: string
  updatedAt: string
}
export interface ActiveTimerState {
  timerId: string
  startedAt: number
  nextTriggerAt: number
  lastTriggeredAt?: number
  completedCycles: number
  acknowledgedCycles: number
  warningIssuedForCycle?: number
}
export type SessionEventType =
  | 'session_started'
  | 'session_paused'
  | 'session_resumed'
  | 'session_stopped'
  | 'timer_warning'
  | 'timer_triggered'
  | 'timer_acknowledged'
  | 'manual_event'
export interface SessionEvent {
  id: string
  sessionId: string
  timerId?: string
  type: SessionEventType
  title: string
  message?: string
  cycle?: number
  scheduledAt?: number
  occurredAt: number
  acknowledgedAt?: number
}
export interface CPRSession {
  id: string
  groupId: string
  groupSnapshot: TimerGroup
  status: 'running' | 'paused' | 'stopped'
  startedAt: number
  pausedAt?: number
  stoppedAt?: number
  totalPausedDuration: number
  timerStates: ActiveTimerState[]
  events: SessionEvent[]
}
export interface Clock {
  now(): number
}
export interface TimerSignal {
  kind: 'warning' | 'trigger'
  timerId: string
  cycle: number
  scheduledAt: number
}
