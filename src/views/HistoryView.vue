<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Eye, Trash2 } from '@lucide/vue'
import { useHistoryStore } from '../stores/history.store'
const history = useHistoryStore()
async function clear() {
  if (confirm('ล้างประวัติ Session ทั้งหมด?')) await history.clear()
}
</script>
<template>
  <section class="page">
    <div class="section-head">
      <div>
        <div class="eyebrow">Session history</div>
        <h1 style="font-size: 2.7rem">ประวัติการใช้งาน</h1>
      </div>
      <button v-if="history.sessions.length" class="button danger" @click="clear">
        <Trash2 />ล้างทั้งหมด
      </button>
    </div>
    <div class="grid">
      <article
        v-for="item in history.sessions"
        :key="item.id"
        class="card"
        style="display: flex; align-items: center; justify-content: space-between; gap: 12px"
      >
        <div>
          <h2>{{ item.groupSnapshot.name }}</h2>
          <p class="meta">
            {{ new Date(item.startedAt).toLocaleString('th-TH') }} •
            {{ item.events.filter((e) => e.type === 'timer_triggered').length }} แจ้งเตือน
          </p>
          <small class="meta">Session ID: {{ item.id }}</small>
        </div>
        <div class="editor-actions">
          <RouterLink :to="`/summary/${item.id}`" class="icon-button" aria-label="ดูสรุป"
            ><Eye /></RouterLink
          ><button class="icon-button" aria-label="ลบ" @click="history.remove(item.id)">
            <Trash2 />
          </button>
        </div>
      </article>
      <div v-if="!history.sessions.length" class="card empty">ยังไม่มีประวัติ Session</div>
    </div>
  </section>
</template>
