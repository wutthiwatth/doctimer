import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { notifyTimer, unlockAudio } from '../services/alerts/alerts'
import { storage } from '../services/storage/database'
import { TimerEngine } from '../services/timer-engine/timer-engine'
import type { CPRSession, TimerGroup, TimerSignal } from '../types'
import { useHistoryStore } from './history.store'
import { useSettingsStore } from './settings.store'

export const useSessionStore = defineStore('session', () => {
  const active = ref<CPRSession>(),
    alerts = ref<TimerSignal[]>([]),
    engine = new TimerEngine()
  const isActive = computed(() => active.value && active.value.status !== 'stopped')
  function start(group: TimerGroup) {
    void unlockAudio().catch(() => undefined)
    active.value = engine.createSession(group)
    void persist()
  }
  async function restore() {
    const saved = await storage.active()
    if (saved && saved.status !== 'stopped') {
      active.value = saved
      process()
    }
  }
  function process() {
    if (!active.value) return
    const signals = engine.tick(active.value)
    if (signals.length) {
      alerts.value.push(...signals.filter((item) => item.kind === 'trigger'))
      const settings = useSettingsStore()
      for (const signal of signals) {
        const timer = active.value.groupSnapshot.timers.find((item) => item.id === signal.timerId)
        if (timer) void notifyTimer(timer, signal.kind, settings.muted, settings.speech)
      }
    }
    void persist()
  }
  function pause() {
    if (active.value) {
      engine.pause(active.value)
      void persist()
    }
  }
  function resume() {
    if (active.value) {
      engine.resume(active.value)
      void persist()
    }
  }
  function trigger(timerId: string) {
    if (active.value) {
      alerts.value.push(engine.triggerNow(active.value, timerId))
      process()
    }
  }
  function acknowledge(timerId: string) {
    if (active.value) {
      engine.acknowledge(active.value, timerId)
      alerts.value = alerts.value.filter((item) => item.timerId !== timerId)
      void persist()
    }
  }
  function reset(timerId: string) {
    if (active.value) {
      engine.resetTimer(active.value, timerId)
      void persist()
    }
  }
  function manual(title: string) {
    if (active.value) {
      engine.addManualEvent(active.value, title)
      void persist()
    }
  }
  async function stop() {
    if (!active.value) return
    engine.stop(active.value)
    await useHistoryStore().add(active.value)
    await storage.clearActive()
  }
  async function discard() {
    active.value = undefined
    alerts.value = []
    await storage.clearActive()
  }
  async function persist() {
    if (active.value && active.value.status !== 'stopped') await storage.saveActive(active.value)
  }
  return {
    active,
    alerts,
    isActive,
    engine,
    start,
    restore,
    process,
    pause,
    resume,
    trigger,
    acknowledge,
    reset,
    manual,
    stop,
    discard,
    persist,
  }
})
