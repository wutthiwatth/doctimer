<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { BellRing, CircleStop, Pause, Play, RotateCcw, Volume2, VolumeX, Zap } from '@lucide/vue'
import { useSessionStore } from '../stores/session.store'
import { useSettingsStore } from '../stores/settings.store'
const session = useSessionStore(),
  settings = useSettingsStore(),
  router = useRouter(),
  now = ref(Date.now()),
  manualOpen = ref(false)
let interval: number | undefined
let wakeLock: WakeLockSentinel | undefined
const currentAlert = computed(() => session.alerts[0])
const active = computed(() => session.active)
const elapsed = computed(() => {
  if (!active.value) return 0
  const end =
    active.value.status === 'paused' && active.value.pausedAt ? active.value.pausedAt : now.value
  return Math.max(0, end - active.value.startedAt - active.value.totalPausedDuration)
})
const cprCycles = computed(
  () => active.value?.timerStates.find((t) => t.timerId === 'cpr-cycle')?.completedCycles ?? 0,
)
const fmt = (ms: number) =>
  `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`
const remaining = (id: string) => {
  const state = active.value?.timerStates.find((t) => t.timerId === id)
  return state && active.value ? session.engine.remainingMs(state, active.value) : 0
}
const stateFor = (id: string) => active.value?.timerStates.find((t) => t.timerId === id)
const elapsedFor = (id: string) => {
  const state = stateFor(id)
  if (!state || !active.value) return 0
  const end =
    active.value.status === 'paused' && active.value.pausedAt ? active.value.pausedAt : now.value
  return Math.max(0, end - state.startedAt)
}
const displayTime = (id: string, mode: 'countdown' | 'countup' | undefined) =>
  mode === 'countup' ? elapsedFor(id) : remaining(id)
const statusFor = (id: string, warn = 0) => {
  const r = remaining(id)
  const s = stateFor(id)
  if (s && s.completedCycles > s.acknowledgedCycles) return 'due'
  if (r <= warn * 1000) return 'warning'
  return 'active'
}
const progress = (id: string, total: number, mode: 'countdown' | 'countup' | undefined) => {
  if (mode === 'countup') return ((elapsedFor(id) % (total * 1000)) / (total * 1000)) * 100
  return Math.max(0, Math.min(100, remaining(id) / (total * 10)))
}
async function wake() {
  try {
    if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen')
  } catch {
    wakeLock = undefined
  }
}
async function stop() {
  if (!confirm('ยืนยันหยุด Session และบันทึกสรุป?')) return
  await session.stop()
  await router.push(`/summary/${session.active?.id}`)
}
function manual(title: string) {
  session.manual(title)
  manualOpen.value = false
}
function handleVisibility() {
  if (document.visibilityState === 'visible') {
    session.process()
    void wake()
  } else void session.persist()
}
onMounted(() => {
  if (!active.value) {
    router.replace('/')
    return
  }
  interval = window.setInterval(() => {
    now.value = Date.now()
    session.process()
  }, 250)
  document.addEventListener('visibilitychange', handleVisibility)
  void wake()
})
onBeforeUnmount(() => {
  if (interval) clearInterval(interval)
  document.removeEventListener('visibilitychange', handleVisibility)
  void wakeLock?.release()
  void session.persist()
})
</script>
<template>
  <section v-if="active" class="session-shell">
    <header class="session-header">
      <div>
        <div class="meta">เวลารวม</div>
        <div class="session-clock">{{ fmt(elapsed) }}</div>
      </div>
      <div class="session-status">
        <strong>{{ active.status === 'paused' ? 'หยุดชั่วคราว' : 'กำลังจับเวลา' }}</strong
        ><span
          >{{ active.groupSnapshot.name }} • {{ new Date(now).toLocaleTimeString('th-TH') }}</span
        >
      </div>
      <div class="cycle-total">
        <span class="meta">CPR CYCLE</span><strong>{{ cprCycles }}</strong>
      </div>
    </header>
    <div class="timer-grid">
      <article
        v-for="timer in active.groupSnapshot.timers
          .filter((t) => t.enabled)
          .sort((a, b) => remaining(a.id) - remaining(b.id))"
        :key="timer.id"
        class="timer-card"
        :class="statusFor(timer.id, timer.warningBeforeSeconds)"
      >
        <div class="timer-card-top">
          <span class="timer-name">{{ timer.name }}</span
          ><span
            >{{ timer.displayMode === 'countup' ? 'นับขึ้น • ' : 'นับถอยหลัง • '
            }}{{
              statusFor(timer.id, timer.warningBeforeSeconds) === 'due'
                ? 'ครบเวลา'
                : statusFor(timer.id, timer.warningBeforeSeconds) === 'warning'
                  ? 'ใกล้ครบ'
                  : 'กำลังจับเวลา'
            }}</span
          >
        </div>
        <div class="countdown">{{ fmt(displayTime(timer.id, timer.displayMode)) }}</div>
        <div class="progress">
          <span
            :style="{
              width: `${progress(timer.id, timer.intervalSeconds, timer.displayMode)}%`,
              background: timer.color || '#ef4444',
            }"
          ></span>
        </div>
        <div class="timer-meta">
          <span>รอบที่ {{ (stateFor(timer.id)?.completedCycles ?? 0) + 1 }}</span
          ><span>ครบแล้ว {{ stateFor(timer.id)?.completedCycles ?? 0 }} รอบ</span>
        </div>
        <div class="timer-controls">
          <button
            class="ack"
            :disabled="
              (stateFor(timer.id)?.completedCycles ?? 0) <=
              (stateFor(timer.id)?.acknowledgedCycles ?? 0)
            "
            @click="session.acknowledge(timer.id)"
          >
            รับทราบ</button
          ><button @click="session.reset(timer.id)"><RotateCcw :size="17" /> รีเซ็ต</button
          ><button @click="session.trigger(timer.id)"><Zap :size="17" /> ครบตอนนี้</button>
        </div>
      </article>
    </div>
    <div class="session-controls">
      <button
        class="button amber"
        @click="active.status === 'running' ? session.pause() : session.resume()"
      >
        <Pause v-if="active.status === 'running'" /><Play v-else />{{
          active.status === 'running' ? 'หยุดชั่วคราว' : 'ดำเนินการต่อ'
        }}</button
      ><button class="button secondary" @click="manualOpen = !manualOpen">
        <BellRing />เพิ่มเหตุการณ์</button
      ><button class="button secondary" @click="settings.muted = !settings.muted">
        <VolumeX v-if="settings.muted" /><Volume2 v-else />{{
          settings.muted ? 'เปิดเสียง' : 'ปิดเสียง'
        }}</button
      ><button class="button danger" @click="stop"><CircleStop />หยุด Session</button>
    </div>
    <div v-if="manualOpen" class="alert-overlay" style="background: #160d0df5">
      <div class="alert-box">
        <h2 style="font-size: 2.4rem">เพิ่มเหตุการณ์</h2>
        <div class="grid grid-2" style="margin: 22px 0">
          <button
            v-for="title in [
              'ให้ Adrenaline แล้ว',
              'ตรวจ Rhythm แล้ว',
              'Shock',
              'ROSC',
              'เปลี่ยนผู้ทำ CPR',
              'ใส่ Airway',
            ]"
            :key="title"
            class="button secondary"
            @click="manual(title)"
          >
            {{ title }}
          </button>
        </div>
        <button class="button secondary" @click="manualOpen = false">ยกเลิก</button>
      </div>
    </div>
    <div v-if="currentAlert" class="alert-overlay" aria-live="assertive">
      <div class="alert-box">
        <BellRing :size="56" />
        <p>ครบเวลา</p>
        <h2>{{ active.groupSnapshot.timers.find((t) => t.id === currentAlert.timerId)?.name }}</h2>
        <p>
          รอบที่ {{ currentAlert.cycle }} •
          {{
            active.groupSnapshot.timers.find((t) => t.id === currentAlert.timerId)?.displayMode ===
            'countup'
              ? 'กำลังจับเวลาต่อเนื่อง'
              : 'รอบใหม่เริ่มอัตโนมัติแล้ว'
          }}
        </p>
        <button class="button" @click="session.acknowledge(currentAlert.timerId)">รับทราบ</button>
      </div>
    </div>
  </section>
</template>
