import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storage } from '../services/storage/database'
import type { CPRSession } from '../types'

export const useHistoryStore = defineStore('history', () => {
  const sessions = ref<CPRSession[]>([])
  async function load() {
    sessions.value = (await storage.sessions()).reverse()
  }
  async function add(session: CPRSession) {
    await storage.saveSession(session)
    await load()
  }
  async function remove(id: string) {
    await storage.deleteSession(id)
    await load()
  }
  async function clear() {
    await storage.clearSessions()
    sessions.value = []
  }
  return { sessions, load, add, remove, clear }
})
