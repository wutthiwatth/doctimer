<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Bell, ChevronRight, Edit3, History, Plus, ShieldCheck, Smartphone } from '@lucide/vue'
import { useGroupStore } from '../stores/group.store'
import { useHistoryStore } from '../stores/history.store'

const groups = useGroupStore(),
  history = useHistoryStore()
const notification = computed(() =>
  !('Notification' in window)
    ? 'ไม่รองรับ'
    : Notification.permission === 'granted'
      ? 'อนุญาตแล้ว'
      : 'ยังไม่อนุญาต',
)
const formatInterval = (seconds: number) =>
  seconds >= 60
    ? `${Math.floor(seconds / 60)} นาที${seconds % 60 ? ` ${seconds % 60} วิ` : ''}`
    : `${seconds} วินาที`
</script>

<template>
  <section class="page">
    <div class="eyebrow">Emergency companion</div>
    <h1>ทุกวินาที<br />ชัดเจนและพร้อมใช้</h1>
    <p class="subtitle">
      จับเวลาหลายรายการพร้อมกัน แจ้งเตือนตรงรอบ และบันทึกเหตุการณ์โดยไม่เก็บข้อมูลระบุตัวผู้ป่วย
    </p>
    <div class="hero-actions">
      <RouterLink
        v-if="groups.groups[0]"
        :to="`/prepare/${groups.groups[0].id}`"
        class="button primary"
        >เริ่ม CPR <ChevronRight /></RouterLink
      ><RouterLink to="/groups/new" class="button secondary"><Plus />สร้าง Group</RouterLink>
    </div>
    <div class="status-row">
      <span class="status-pill"><span class="status-dot" />พร้อมใช้งาน Offline</span
      ><span class="status-pill"><Bell :size="14" />Notification: {{ notification }}</span
      ><span class="status-pill"><Smartphone :size="14" />ติดตั้งเป็น PWA ได้</span>
    </div>
    <div class="section-head">
      <div>
        <div class="eyebrow">Timer groups</div>
        <h2>กลุ่มที่บันทึกไว้</h2>
      </div>
      <RouterLink to="/groups/new" class="button secondary"><Plus />เพิ่ม</RouterLink>
    </div>
    <div class="grid grid-2">
      <article v-for="group in groups.groups" :key="group.id" class="card group-card">
        <div class="group-title">
          <div>
            <h2>{{ group.name }}</h2>
            <p class="meta">
              {{ group.timers.filter((t) => t.enabled).length }} ตัวจับเวลา • อัปเดต
              {{ new Date(group.updatedAt).toLocaleDateString('th-TH') }}
            </p>
          </div>
          <RouterLink :to="`/groups/${group.id}/edit`" class="icon-button" aria-label="แก้ไขกลุ่ม"
            ><Edit3
          /></RouterLink>
        </div>
        <p class="subtitle">{{ group.description }}</p>
        <div>
          <span
            v-for="timer in group.timers.filter((t) => t.enabled)"
            :key="timer.id"
            class="timer-chip"
            >{{ timer.name }} · {{ formatInterval(timer.intervalSeconds) }}</span
          >
        </div>
        <RouterLink
          :to="`/prepare/${group.id}`"
          class="button primary"
          style="width: 100%; margin-top: 18px"
          >เลือกกลุ่มนี้ <ChevronRight
        /></RouterLink>
      </article>
    </div>
    <div class="section-head">
      <div>
        <div class="eyebrow">Recent sessions</div>
        <h2>ประวัติล่าสุด</h2>
      </div>
      <RouterLink to="/history" class="button secondary"><History />ดูทั้งหมด</RouterLink>
    </div>
    <div v-if="history.sessions.length" class="card">
      <div
        v-for="item in history.sessions.slice(0, 3)"
        :key="item.id"
        style="
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid var(--line);
        "
      >
        <div>
          <strong>{{ item.groupSnapshot.name }}</strong>
          <div class="meta">{{ new Date(item.startedAt).toLocaleString('th-TH') }}</div>
        </div>
        <span class="meta"
          >{{ item.events.filter((e) => e.type === 'timer_triggered').length }} แจ้งเตือน</span
        >
      </div>
    </div>
    <div v-else class="card empty">
      <ShieldCheck :size="34" style="margin: auto" />
      <p>ยังไม่มีประวัติ Session</p>
    </div>
    <p class="notice" style="margin-top: 28px">
      <strong>ข้อสำคัญ:</strong> แอปนี้เป็นเครื่องมือช่วยจับเวลาและแจ้งเตือนเท่านั้น
      ไม่ใช่อุปกรณ์ทางการแพทย์ และไม่ใช้แทนแนวทางการรักษาของหน่วยงานคุณ
    </p>
  </section>
</template>
