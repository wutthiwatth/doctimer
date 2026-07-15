<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Copy, GripVertical, Plus, Save, Trash2 } from '@lucide/vue'
import { useGroupStore } from '../stores/group.store'
import type { TimerDefinition, TimerGroup } from '../types'
import { clonePlain } from '../utils/clone'

const route = useRoute(),
  router = useRouter(),
  store = useGroupStore(),
  saving = ref(false),
  error = ref('')
const original = computed(() => store.groups.find((item) => item.id === route.params.id))
const now = new Date().toISOString()
const group = ref<TimerGroup>(
  original.value
  ? clonePlain(original.value)
    : {
        id: crypto.randomUUID(),
        name: '',
        description: '',
        createdAt: now,
        updatedAt: now,
        timers: [],
      },
)
const minutes = (timer: TimerDefinition) => Math.floor(timer.intervalSeconds / 60),
  seconds = (timer: TimerDefinition) => timer.intervalSeconds % 60
function setTime(timer: TimerDefinition, min: number, sec: number) {
  timer.intervalSeconds = Math.max(0, Number(min || 0) * 60 + Number(sec || 0))
}
function addTimer() {
  group.value.timers.push({
    id: crypto.randomUUID(),
    name: 'ตัวจับเวลาใหม่',
    intervalSeconds: 120,
    warningBeforeSeconds: 10,
    color: '#dc2626',
    voiceMessage: '',
    vibrationPattern: [300, 100, 300],
    soundType: 'due',
    autoRepeat: true,
    enabled: true,
    sortOrder: group.value.timers.length,
  })
}
function duplicate(timer: TimerDefinition) {
  group.value.timers.push({
      ...clonePlain(timer),
    id: crypto.randomUUID(),
    name: `${timer.name} สำเนา`,
    sortOrder: group.value.timers.length,
  })
}
async function save() {
  error.value = ''
  if (!group.value.name.trim()) error.value = 'กรุณาระบุชื่อ Group'
  else if (!group.value.timers.some((t) => t.enabled))
    error.value = 'ต้องเปิดใช้งาน Timer อย่างน้อยหนึ่งตัว'
  else if (group.value.timers.some((t) => t.enabled && t.intervalSeconds <= 0))
    error.value = 'เวลา Timer ต้องมากกว่า 0 วินาที'
  if (error.value) return
  saving.value = true
  try {
    await store.save(group.value)
    await router.push('/')
  } finally {
    saving.value = false
  }
}
</script>
<template>
  <section class="page">
    <button class="button secondary" @click="router.back()"><ArrowLeft />กลับ</button>
    <div class="section-head">
      <div>
        <div class="eyebrow">Group editor</div>
        <h1 style="font-size: 2.6rem">{{ original ? 'แก้ไข Group' : 'สร้าง Group ใหม่' }}</h1>
      </div>
    </div>
    <div class="card grid">
      <div class="form-group">
        <label for="group-name">ชื่อ Group</label
        ><input id="group-name" v-model="group.name" class="input" placeholder="เช่น Adult CPR" />
      </div>
      <div class="form-group">
        <label for="description">คำอธิบาย</label
        ><textarea
          id="description"
          v-model="group.description"
          class="input"
          rows="2"
          placeholder="คำอธิบายสั้น ๆ"
        ></textarea>
      </div>
    </div>
    <div class="section-head">
      <h2>รายการ Timer</h2>
      <button class="button secondary" @click="addTimer"><Plus />เพิ่ม Timer</button>
    </div>
    <div class="grid">
      <article v-for="(timer, index) in group.timers" :key="timer.id" class="card timer-editor">
        <div class="form-group wide">
          <label>ชื่อ Timer</label><input v-model="timer.name" class="input" />
        </div>
        <div class="form-group">
          <label>นาที</label
          ><input
            :value="minutes(timer)"
            class="input"
            type="number"
            min="0"
            @input="
              setTime(timer, Number(($event.target as HTMLInputElement).value), seconds(timer))
            "
          />
        </div>
        <div class="form-group">
          <label>วินาที</label
          ><input
            :value="seconds(timer)"
            class="input"
            type="number"
            min="0"
            max="59"
            @input="
              setTime(timer, minutes(timer), Number(($event.target as HTMLInputElement).value))
            "
          />
        </div>
        <div class="form-group">
          <label>เตือนก่อน (วิ)</label
          ><input v-model.number="timer.warningBeforeSeconds" class="input" type="number" min="0" />
        </div>
        <div class="editor-actions">
          <button class="tiny-button" aria-label="ลำดับ"><GripVertical /></button
          ><button class="tiny-button" aria-label="ทำสำเนา" @click="duplicate(timer)">
            <Copy /></button
          ><button class="tiny-button" aria-label="ลบ" @click="group.timers.splice(index, 1)">
            <Trash2 />
          </button>
        </div>
        <div class="form-group wide">
          <label>ข้อความเสียง</label
          ><input
            v-model="timer.voiceMessage"
            class="input"
            placeholder="ข้อความที่ให้อ่านเมื่อครบเวลา"
          />
        </div>
        <div class="form-group">
          <label>สี</label><input v-model="timer.color" class="input" type="color" />
        </div>
        <label style="display: flex; gap: 8px; align-items: center; min-height: 48px"
          ><input v-model="timer.enabled" type="checkbox" /> เปิดใช้งาน</label
        >
      </article>
      <div v-if="!group.timers.length" class="card empty">
        ยังไม่มี Timer — กด “เพิ่ม Timer” เพื่อเริ่ม
      </div>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="hero-actions">
      <button class="button primary" :disabled="saving" @click="save">
        <Save />{{ saving ? 'กำลังบันทึก…' : 'บันทึก Group' }}
      </button>
    </div>
  </section>
</template>
