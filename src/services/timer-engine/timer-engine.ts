import type {
  ActiveTimerState,
  Clock,
  CPRSession,
  SessionEvent,
  TimerDefinition,
  TimerSignal,
} from '../../types'
import { clonePlain } from '../../utils/clone'

export const systemClock: Clock = { now: () => Date.now() }
const uid = () => crypto.randomUUID()

export class TimerEngine {
  private readonly clock: Clock
  constructor(clock: Clock = systemClock) {
    this.clock = clock
  }
  createSession(group: CPRSession['groupSnapshot']): CPRSession {
    const now = this.clock.now(),
      sessionId = uid()
    const timerStates = group.timers
      .filter((timer) => timer.enabled)
      .map((timer) => ({
        timerId: timer.id,
        startedAt: now,
        nextTriggerAt: now + timer.intervalSeconds * 1000,
        completedCycles: 0,
        acknowledgedCycles: 0,
      }))
    return {
      id: sessionId,
      groupId: group.id,
      groupSnapshot: clonePlain(group),
      status: 'running',
      startedAt: now,
      totalPausedDuration: 0,
      timerStates,
      events: [this.event(sessionId, 'session_started', 'เริ่ม Session', now)],
    }
  }
  remainingMs(state: ActiveTimerState, session: CPRSession): number {
    const now =
      session.status === 'paused' && session.pausedAt ? session.pausedAt : this.clock.now()
    return Math.max(0, state.nextTriggerAt - now)
  }
  tick(session: CPRSession): TimerSignal[] {
    if (session.status !== 'running') return []
    const now = this.clock.now(),
      signals: TimerSignal[] = []
    for (const state of session.timerStates) {
      const timer = this.timer(session, state.timerId),
        intervalMs = timer.intervalSeconds * 1000,
        warningMs = (timer.warningBeforeSeconds ?? 0) * 1000,
        currentCycle = state.completedCycles + 1
      if (
        warningMs > 0 &&
        now >= state.nextTriggerAt - warningMs &&
        now < state.nextTriggerAt &&
        state.warningIssuedForCycle !== currentCycle
      ) {
        state.warningIssuedForCycle = currentCycle
        signals.push({
          kind: 'warning',
          timerId: timer.id,
          cycle: currentCycle,
          scheduledAt: state.nextTriggerAt - warningMs,
        })
        this.pushUnique(
          session,
          this.event(
            session.id,
            'timer_warning',
            `ใกล้ครบเวลา ${timer.name}`,
            now,
            timer.id,
            currentCycle,
            state.nextTriggerAt - warningMs,
          ),
        )
      }
      if (now >= state.nextTriggerAt) {
        const elapsedCycles = Math.floor((now - state.nextTriggerAt) / intervalMs) + 1
        for (let index = 0; index < elapsedCycles; index += 1) {
          const cycle = state.completedCycles + index + 1,
            scheduledAt = state.nextTriggerAt + index * intervalMs
          this.pushUnique(
            session,
            this.event(
              session.id,
              'timer_triggered',
              `ครบเวลา ${timer.name}`,
              now,
              timer.id,
              cycle,
              scheduledAt,
            ),
          )
        }
        state.completedCycles += elapsedCycles
        state.lastTriggeredAt = state.nextTriggerAt + (elapsedCycles - 1) * intervalMs
        state.nextTriggerAt += elapsedCycles * intervalMs
        state.warningIssuedForCycle = undefined
        signals.push({
          kind: 'trigger',
          timerId: timer.id,
          cycle: state.completedCycles,
          scheduledAt: state.lastTriggeredAt,
        })
      }
    }
    return signals
  }
  pause(session: CPRSession): void {
    if (session.status !== 'running') return
    const now = this.clock.now()
    session.status = 'paused'
    session.pausedAt = now
    this.pushUnique(session, this.event(session.id, 'session_paused', 'หยุดชั่วคราว', now))
  }
  resume(session: CPRSession): void {
    if (session.status !== 'paused' || !session.pausedAt) return
    const now = this.clock.now(),
      pausedFor = Math.max(0, now - session.pausedAt)
    session.timerStates.forEach((timer) => {
      timer.nextTriggerAt += pausedFor
      timer.startedAt += pausedFor
    })
    session.totalPausedDuration += pausedFor
    session.status = 'running'
    session.pausedAt = undefined
    this.pushUnique(session, this.event(session.id, 'session_resumed', 'ดำเนินการต่อ', now))
  }
  resetTimer(session: CPRSession, timerId: string): void {
    const state = session.timerStates.find((item) => item.timerId === timerId)
    if (!state) return
    const now = this.clock.now(),
      timer = this.timer(session, timerId)
    state.startedAt = now
    state.nextTriggerAt = now + timer.intervalSeconds * 1000
    state.warningIssuedForCycle = undefined
  }
  triggerNow(session: CPRSession, timerId: string): TimerSignal {
    const state = session.timerStates.find((item) => item.timerId === timerId)
    if (!state) throw new Error('Timer not found')
    const now = this.clock.now(),
      timer = this.timer(session, timerId)
    state.completedCycles += 1
    state.lastTriggeredAt = now
    state.nextTriggerAt = now + timer.intervalSeconds * 1000
    state.warningIssuedForCycle = undefined
    this.pushUnique(
      session,
      this.event(
        session.id,
        'timer_triggered',
        `ครบเวลา ${timer.name}`,
        now,
        timerId,
        state.completedCycles,
        now,
      ),
    )
    return { kind: 'trigger', timerId, cycle: state.completedCycles, scheduledAt: now }
  }
  acknowledge(session: CPRSession, timerId: string): void {
    const state = session.timerStates.find((item) => item.timerId === timerId)
    if (!state || state.acknowledgedCycles >= state.completedCycles) return
    const now = this.clock.now()
    state.acknowledgedCycles = state.completedCycles
    const event = [...session.events]
      .reverse()
      .find(
        (item) =>
          item.timerId === timerId && item.type === 'timer_triggered' && !item.acknowledgedAt,
      )
    if (event) event.acknowledgedAt = now
    this.pushUnique(
      session,
      this.event(
        session.id,
        'timer_acknowledged',
        `รับทราบ ${this.timer(session, timerId).name}`,
        now,
        timerId,
        state.completedCycles,
      ),
    )
  }
  addManualEvent(session: CPRSession, title: string): void {
    this.pushUnique(session, this.event(session.id, 'manual_event', title, this.clock.now()))
  }
  stop(session: CPRSession): void {
    if (session.status === 'stopped') return
    const now = this.clock.now()
    if (session.status === 'paused' && session.pausedAt)
      session.totalPausedDuration += now - session.pausedAt
    session.status = 'stopped'
    session.stoppedAt = now
    session.pausedAt = undefined
    this.pushUnique(session, this.event(session.id, 'session_stopped', 'หยุด Session', now))
  }
  private timer(session: CPRSession, id: string): TimerDefinition {
    const timer = session.groupSnapshot.timers.find((item) => item.id === id)
    if (!timer) throw new Error('Timer definition not found')
    return timer
  }
  private pushUnique(session: CPRSession, event: SessionEvent): void {
    const duplicate = session.events.some(
      (item) =>
        item.type === event.type &&
        item.timerId === event.timerId &&
        item.cycle === event.cycle &&
        item.scheduledAt === event.scheduledAt,
    )
    if (!duplicate) session.events.push(event)
  }
  private event(
    sessionId: string,
    type: SessionEvent['type'],
    title: string,
    occurredAt: number,
    timerId?: string,
    cycle?: number,
    scheduledAt?: number,
  ): SessionEvent {
    return {
      id: uid(),
      sessionId,
      type,
      title,
      occurredAt,
      ...(timerId ? { timerId } : {}),
      ...(cycle ? { cycle } : {}),
      ...(scheduledAt ? { scheduledAt } : {}),
    }
  }
}
