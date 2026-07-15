<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { Activity, Clock3, Home, Moon, Sun, Volume2, VolumeX } from '@lucide/vue'
import { useGroupStore } from './stores/group.store'
import { useHistoryStore } from './stores/history.store'
import { useSessionStore } from './stores/session.store'
import { useSettingsStore } from './stores/settings.store'

const groups = useGroupStore(),
  history = useHistoryStore(),
  session = useSessionStore(),
  settings = useSettingsStore(),
  router = useRouter()
const updateReady = ref(false)
const reloadApp = () => window.location.reload()
const classes = computed(() => ({ dark: settings.dark, contrast: settings.highContrast }))
onMounted(async () => {
  await Promise.all([groups.load(), history.load(), session.restore()])
  window.addEventListener('pwa-update-ready', () => {
    updateReady.value = true
  })
  if (session.isActive && router.currentRoute.value.path !== '/session') router.push('/session')
})
</script>

<template>
  <div class="app-shell" :class="classes">
    <header class="topbar">
      <RouterLink to="/" class="brand" aria-label="หน้าหลัก CPR Cycle Timer"
        ><span class="brand-mark"><Activity :size="23" /></span
        ><span
          ><strong>CPR Cycle Timer</strong><small>จับเวลา • แจ้งเตือน • บันทึก</small></span
        ></RouterLink
      >
      <div class="top-actions">
        <button
          class="icon-button"
          :aria-label="settings.muted ? 'เปิดเสียง' : 'ปิดเสียง'"
          @click="settings.muted = !settings.muted"
        >
          <VolumeX v-if="settings.muted" /><Volume2 v-else />
        </button>
        <button
          class="icon-button"
          :aria-label="settings.dark ? 'ใช้โหมดสว่าง' : 'ใช้โหมดมืด'"
          @click="settings.dark = !settings.dark"
        >
          <Sun v-if="settings.dark" /><Moon v-else />
        </button>
      </div>
    </header>
    <div v-if="updateReady && !session.isActive" class="update-banner">
      แอปเวอร์ชันใหม่พร้อมแล้ว <button @click="reloadApp">อัปเดต</button>
    </div>
    <main><RouterView /></main>
    <nav v-if="!session.isActive" class="bottom-nav" aria-label="เมนูหลัก">
      <RouterLink to="/"><Home /><span>หน้าหลัก</span></RouterLink
      ><RouterLink to="/history"><Clock3 /><span>ประวัติ</span></RouterLink>
    </nav>
  </div>
</template>
