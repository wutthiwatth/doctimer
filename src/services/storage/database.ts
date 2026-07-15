import { openDB, type DBSchema } from 'idb'
import type { CPRSession, TimerGroup } from '../../types'

interface CPRDatabase extends DBSchema {
  groups: { key: string; value: TimerGroup }
  sessions: { key: string; value: CPRSession; indexes: { 'by-started': number } }
  active: { key: string; value: CPRSession }
}

const db = openDB<CPRDatabase>('cpr-cycle-timer', 1, {
  upgrade(database) {
    database.createObjectStore('groups', { keyPath: 'id' })
    const sessions = database.createObjectStore('sessions', { keyPath: 'id' })
    sessions.createIndex('by-started', 'startedAt')
    database.createObjectStore('active', { keyPath: 'id' })
  },
})
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
export const storage = {
  groups: async () => (await db).getAll('groups'),
  saveGroup: async (group: TimerGroup) => {
    await (await db).put('groups', plain(group))
  },
  deleteGroup: async (id: string) => {
    await (await db).delete('groups', id)
  },
  sessions: async () => (await db).getAllFromIndex('sessions', 'by-started'),
  saveSession: async (session: CPRSession) => {
    await (await db).put('sessions', plain(session))
  },
  deleteSession: async (id: string) => {
    await (await db).delete('sessions', id)
  },
  clearSessions: async () => {
    await (await db).clear('sessions')
  },
  active: async () => (await db).getAll('active').then((items) => items[0]),
  saveActive: async (session: CPRSession) => {
    const database = await db
    await database.clear('active')
    await database.put('active', plain(session))
  },
  clearActive: async () => {
    await (await db).clear('active')
  },
}
