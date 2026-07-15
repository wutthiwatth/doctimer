import { beforeEach, describe, expect, it } from 'vitest'
import { BASIC_GROUP } from '../../constants/defaults'
import type { Clock } from '../../types'
import { TimerEngine } from './timer-engine'

class FakeClock implements Clock {
  time: number
  constructor(time = 1_000_000) {
    this.time = time
  }
  now() {
    return this.time
  }
  advance(ms: number) {
    this.time += ms
  }
}
describe('TimerEngine timestamp calculations', () => {
  let clock: FakeClock, engine: TimerEngine
  beforeEach(() => {
    clock = new FakeClock()
    engine = new TimerEngine(clock)
  })
  it('starts every enabled timer from the same timestamp', () => {
    const session = engine.createSession(BASIC_GROUP)
    expect(new Set(session.timerStates.map((t) => t.startedAt)).size).toBe(1)
    expect(session.timerStates[0]?.nextTriggerAt).toBe(clock.time + 120_000)
    expect(session.timerStates[1]?.nextTriggerAt).toBe(clock.time + 180_000)
  })
  it('triggers one completed CPR cycle', () => {
    const s = engine.createSession(BASIC_GROUP)
    clock.advance(120_000)
    const signals = engine.tick(s)
    expect(signals).toEqual([
      expect.objectContaining({ kind: 'trigger', timerId: 'cpr-cycle', cycle: 1 }),
    ])
    expect(s.timerStates[0]?.completedCycles).toBe(1)
  })
  it('keeps different intervals independent', () => {
    const s = engine.createSession(BASIC_GROUP)
    clock.advance(180_000)
    engine.tick(s)
    expect(s.timerStates.map((t) => t.completedCycles)).toEqual([1, 1])
    expect(s.timerStates[0]?.nextTriggerAt).toBe(1_240_000)
  })
  it('handles simultaneous triggers', () => {
    const s = engine.createSession(BASIC_GROUP)
    clock.advance(360_000)
    const signals = engine.tick(s)
    expect(signals.filter((x) => x.kind === 'trigger')).toHaveLength(2)
    expect(s.timerStates.map((t) => t.completedCycles)).toEqual([3, 2])
  })
  it('pauses and resumes without drift', () => {
    const s = engine.createSession(BASIC_GROUP)
    clock.advance(30_000)
    engine.pause(s)
    const left = engine.remainingMs(s.timerStates[0]!, s)
    clock.advance(90_000)
    expect(engine.remainingMs(s.timerStates[0]!, s)).toBe(left)
    engine.resume(s)
    expect(s.timerStates[0]?.nextTriggerAt).toBe(1_210_000)
    expect(s.totalPausedDuration).toBe(90_000)
  })
  it('recovers every cycle elapsed in background', () => {
    const s = engine.createSession(BASIC_GROUP)
    clock.advance(601_000)
    engine.tick(s)
    expect(s.timerStates.map((t) => t.completedCycles)).toEqual([5, 3])
    expect(s.events.filter((e) => e.type === 'timer_triggered')).toHaveLength(8)
  })
  it('does not duplicate events on the same tick', () => {
    const s = engine.createSession(BASIC_GROUP)
    clock.advance(120_000)
    engine.tick(s)
    engine.tick(s)
    expect(s.events.filter((e) => e.type === 'timer_triggered')).toHaveLength(1)
  })
  it('acknowledges only completed cycles', () => {
    const s = engine.createSession(BASIC_GROUP)
    engine.acknowledge(s, 'cpr-cycle')
    expect(s.timerStates[0]?.acknowledgedCycles).toBe(0)
    clock.advance(120_000)
    engine.tick(s)
    engine.acknowledge(s, 'cpr-cycle')
    expect(s.timerStates[0]?.acknowledgedCycles).toBe(1)
  })
  it('resets only one timer', () => {
    const s = engine.createSession(BASIC_GROUP)
    clock.advance(50_000)
    const adrenaline = s.timerStates[1]?.nextTriggerAt
    engine.resetTimer(s, 'cpr-cycle')
    expect(s.timerStates[0]?.nextTriggerAt).toBe(clock.time + 120_000)
    expect(s.timerStates[1]?.nextTriggerAt).toBe(adrenaline)
  })
  it('stops a session and adds one stop event', () => {
    const s = engine.createSession(BASIC_GROUP)
    engine.stop(s)
    engine.stop(s)
    expect(s.status).toBe('stopped')
    expect(s.events.filter((e) => e.type === 'session_stopped')).toHaveLength(1)
  })
  it('creates a warning once for a cycle', () => {
    const s = engine.createSession(BASIC_GROUP)
    clock.advance(110_000)
    expect(engine.tick(s)[0]?.kind).toBe('warning')
    expect(engine.tick(s)).toHaveLength(0)
  })
  it('supports a manual trigger and begins a fresh interval', () => {
    const s = engine.createSession(BASIC_GROUP)
    clock.advance(20_000)
    engine.triggerNow(s, 'cpr-cycle')
    expect(s.timerStates[0]?.completedCycles).toBe(1)
    expect(s.timerStates[0]?.nextTriggerAt).toBe(clock.time + 120_000)
  })
  it('records manual events', () => {
    const s = engine.createSession(BASIC_GROUP)
    engine.addManualEvent(s, 'Shock')
    expect(s.events.at(-1)).toEqual(
      expect.objectContaining({ type: 'manual_event', title: 'Shock' }),
    )
  })
})
