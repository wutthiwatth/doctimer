import { defineStore } from 'pinia'
import { ref } from 'vue'
import { BASIC_GROUP } from '../constants/defaults'
import { storage } from '../services/storage/database'
import type { TimerGroup } from '../types'
import { clonePlain } from '../utils/clone'

const BASIC_COUNTUP_MIGRATION_KEY = 'cpr-migration-basic-countup-v1'

export const useGroupStore = defineStore('groups', () => {
  const groups = ref<TimerGroup[]>([]),
    ready = ref(false)
  async function load() {
    try {
      groups.value = await storage.groups()
      if (!groups.value.length) {
        groups.value = [clonePlain(BASIC_GROUP)]
        await storage.saveGroup(groups.value[0]!)
      }
      if (!localStorage.getItem(BASIC_COUNTUP_MIGRATION_KEY)) {
        const basicGroup = groups.value.find((group) => group.id === BASIC_GROUP.id)
        if (basicGroup) {
          basicGroup.timers.forEach((timer) => {
            timer.displayMode = 'countup'
          })
          basicGroup.updatedAt = new Date().toISOString()
          await storage.saveGroup(basicGroup)
        }
        localStorage.setItem(BASIC_COUNTUP_MIGRATION_KEY, 'done')
      }
    } catch {
      groups.value = [clonePlain(BASIC_GROUP)]
    } finally {
      ready.value = true
    }
  }
  async function save(group: TimerGroup) {
    const copy = clonePlain(group)
    copy.updatedAt = new Date().toISOString()
    const index = groups.value.findIndex((item) => item.id === copy.id)
    if (index >= 0) groups.value[index] = copy
    else groups.value.push(copy)
    await storage.saveGroup(copy)
  }
  async function remove(id: string) {
    groups.value = groups.value.filter((item) => item.id !== id)
    await storage.deleteGroup(id)
  }
  return { groups, ready, load, save, remove }
})
