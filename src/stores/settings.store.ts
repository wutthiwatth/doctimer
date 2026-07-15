import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const saved = JSON.parse(localStorage.getItem('cpr-settings') ?? '{}') as {
    muted?: boolean
    speech?: boolean
    dark?: boolean
    highContrast?: boolean
  }
  const muted = ref(saved.muted ?? false),
    speech = ref(saved.speech ?? true),
    dark = ref(saved.dark ?? false),
    highContrast = ref(saved.highContrast ?? false)
  watch(
    [muted, speech, dark, highContrast],
    () =>
      localStorage.setItem(
        'cpr-settings',
        JSON.stringify({
          muted: muted.value,
          speech: speech.value,
          dark: dark.value,
          highContrast: highContrast.value,
        }),
      ),
    { deep: true },
  )
  return { muted, speech, dark, highContrast }
})
