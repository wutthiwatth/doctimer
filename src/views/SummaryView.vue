<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Download, Home, Printer, RotateCcw } from '@lucide/vue'
import { useHistoryStore } from '../stores/history.store'
import { useSessionStore } from '../stores/session.store'
const route = useRoute(),
  router = useRouter(),
  history = useHistoryStore(),
  current = useSessionStore()
const item = computed(
  () => history.sessions.find((s) => s.id === route.params.id) ?? current.active,
)
const duration = computed(() =>
  item.value
    ? Math.max(
        0,
        (item.value.stoppedAt ?? Date.now()) -
          item.value.startedAt -
          item.value.totalPausedDuration,
      )
    : 0,
)
const fmt = (ms: number) => `${Math.floor(ms / 60000)} นาที ${Math.floor(ms / 1000) % 60} วินาที`
function exportJson() {
  if (!item.value) return
  const blob = new Blob([JSON.stringify(item.value, null, 2)], { type: 'application/json' }),
    url = URL.createObjectURL(blob),
    a = document.createElement('a')
  a.href = url
  a.download = `cpr-session-${item.value.id}.json`
  a.click()
  URL.revokeObjectURL(url)
}
const printSummary = () => window.print()
async function restart() {
  if (!item.value) return
  await current.start(item.value.groupSnapshot)
  await router.push('/session')
}
</script>
<template>
  <section v-if="item" class="page">
    <div class="eyebrow">Session complete</div>
    <h1>สรุป Session</h1>
    <p class="subtitle">
      {{ item.groupSnapshot.name }} • {{ new Date(item.startedAt).toLocaleString('th-TH') }}
    </p>
    <div class="grid summary-stats" style="margin-top: 22px">
      <div class="card stat">
        <span>เวลาปฏิบัติการ</span><strong>{{ fmt(duration) }}</strong>
      </div>
      <div class="card stat">
        <span>เวลาหยุดรวม</span><strong>{{ fmt(item.totalPausedDuration) }}</strong>
      </div>
      <div class="card stat">
        <span>CPR Cycle</span
        ><strong>{{
          item.timerStates.find((t) => t.timerId === 'cpr-cycle')?.completedCycles ?? 0
        }}</strong>
      </div>
      <div class="card stat">
        <span>แจ้งเตือนทั้งหมด</span
        ><strong>{{ item.events.filter((e) => e.type === 'timer_triggered').length }}</strong>
      </div>
    </div>
    <div class="section-head"><h2>จำนวนรอบแต่ละ Timer</h2></div>
    <div class="grid grid-2">
      <div v-for="timer in item.timerStates" :key="timer.timerId" class="card">
        <strong>{{ item.groupSnapshot.timers.find((t) => t.id === timer.timerId)?.name }}</strong>
        <div style="font-size: 2rem; font-weight: 900">{{ timer.completedCycles }} รอบ</div>
        <span class="meta">รับทราบ {{ timer.acknowledgedCycles }} รอบ</span>
      </div>
    </div>
    <div class="section-head"><h2>Timeline เหตุการณ์</h2></div>
    <div class="card timeline">
      <div v-for="event in item.events" :key="event.id" class="event">
        <strong>{{ event.title }}</strong>
        <div class="meta">
          {{ new Date(event.occurredAt).toLocaleTimeString('th-TH')
          }}<span v-if="event.cycle"> • รอบที่ {{ event.cycle }}</span>
        </div>
      </div>
    </div>
    <div class="hero-actions">
      <button class="button secondary" @click="exportJson"><Download />Export JSON</button
      ><button class="button secondary" @click="printSummary"><Printer />พิมพ์</button
      ><button class="button primary" @click="restart"><RotateCcw />เริ่มใหม่จาก Group เดิม</button
      ><RouterLink to="/" class="button secondary"><Home />หน้าหลัก</RouterLink>
    </div>
  </section>
</template>
