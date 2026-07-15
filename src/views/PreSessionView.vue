<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Bell, CheckCircle2, Lock, Play, Volume2, Waves } from '@lucide/vue'
import { beep, requestNotification, unlockAudio } from '../services/alerts/alerts'
import { useGroupStore } from '../stores/group.store'
import { useSessionStore } from '../stores/session.store'
const route = useRoute(),
  router = useRouter(),
  groups = useGroupStore(),
  session = useSessionStore(),
  permission = ref<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied',
  )
const group = computed(() => groups.groups.find((item) => item.id === route.params.id)),
  wakeSupported = 'wakeLock' in navigator
const time = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
async function testSound() {
  await unlockAudio()
  beep('trigger')
}
function testVibration() {
  if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
}
async function ask() {
  permission.value = await requestNotification()
}
async function start() {
  if (!group.value) return
  await session.start(group.value)
  await router.push('/session')
}
</script>
<template>
  <section v-if="group" class="page">
    <button class="button secondary" @click="router.back()"><ArrowLeft />กลับ</button>
    <div class="eyebrow" style="margin-top: 26px">พร้อมเริ่ม Session</div>
    <h1>{{ group.name }}</h1>
    <p class="subtitle">ตรวจสอบรายการและความพร้อมของอุปกรณ์ก่อนเริ่มจับเวลา</p>
    <div class="grid grid-2" style="margin-top: 22px">
      <article v-for="timer in group.timers.filter((t) => t.enabled)" :key="timer.id" class="card">
        <div style="display: flex; justify-content: space-between">
          <strong style="font-size: 1.2rem">{{ timer.name }}</strong
          ><CheckCircle2 color="#16a34a" />
        </div>
        <p class="meta">
          {{ timer.displayMode === 'countup' ? 'นับขึ้นจาก 00:00' : 'นับถอยหลัง' }} • Track ทุก
          {{ time(timer.intervalSeconds) }} • เตือนก่อน {{ timer.warningBeforeSeconds || 0 }} วินาที
        </p>
      </article>
    </div>
    <div class="section-head"><h2>ตรวจสอบอุปกรณ์</h2></div>
    <div class="card grid">
      <div style="display: flex; justify-content: space-between">
        <span><Volume2 :size="18" /> เสียงแจ้งเตือน</span
        ><button class="button secondary" @click="testSound">ทดสอบเสียง</button>
      </div>
      <div style="display: flex; justify-content: space-between">
        <span><Waves :size="18" /> การสั่น</span
        ><button class="button secondary" @click="testVibration">ทดสอบสั่น</button>
      </div>
      <div style="display: flex; justify-content: space-between">
        <span><Bell :size="18" /> Notification: {{ permission }}</span
        ><button class="button secondary" @click="ask">ขอสิทธิ์</button>
      </div>
      <div style="display: flex; justify-content: space-between">
        <span><Lock :size="18" /> Wake Lock</span
        ><strong>{{ wakeSupported ? 'รองรับ' : 'ไม่รองรับ' }}</strong>
      </div>
    </div>
    <p class="notice" style="margin-top: 18px">
      ตัวจับเวลาทั้ง {{ group.timers.filter((timer) => timer.enabled).length }} ตัวจะเริ่มพร้อมกัน
      แต่ละตัวมีรอบเวลาและจำนวนรอบแยกจากกัน
      ระบบใช้เวลาจริงจากอุปกรณ์และคำนวณรอบที่ผ่านไปเมื่อกลับจากเบื้องหลัง
    </p>
    <button
      class="button primary"
      style="width: 100%; min-height: 64px; font-size: 1.2rem; margin-top: 18px"
      @click="start"
    >
      <Play />เริ่ม Session
    </button>
  </section>
</template>
