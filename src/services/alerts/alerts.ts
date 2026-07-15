import type { TimerDefinition } from '../../types'

let audioContext: AudioContext | undefined
export async function unlockAudio(): Promise<void> {
  audioContext ??= new AudioContext()
  if (audioContext.state === 'suspended') await audioContext.resume()
}
export function beep(kind: 'warning' | 'trigger'): void {
  if (!audioContext) return
  const oscillator = audioContext.createOscillator(),
    gain = audioContext.createGain()
  oscillator.frequency.value = kind === 'trigger' ? 880 : 560
  gain.gain.setValueAtTime(0.18, audioContext.currentTime)
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + (kind === 'trigger' ? 0.5 : 0.25),
  )
  oscillator.connect(gain).connect(audioContext.destination)
  oscillator.start()
  oscillator.stop(audioContext.currentTime + (kind === 'trigger' ? 0.5 : 0.25))
}
export async function notifyTimer(
  timer: TimerDefinition,
  kind: 'warning' | 'trigger',
  muted: boolean,
  speech: boolean,
): Promise<void> {
  if (!muted) beep(kind)
  if (kind === 'trigger') {
    if ('vibrate' in navigator) navigator.vibrate(timer.vibrationPattern ?? [300, 100, 300])
    if (speech && 'speechSynthesis' in window) {
      speechSynthesis.cancel()
      speechSynthesis.speak(
        new SpeechSynthesisUtterance(timer.voiceMessage ?? `ครบเวลา ${timer.name}`),
      )
    }
    if (Notification.permission === 'granted') {
      const registration = await navigator.serviceWorker?.ready
      if (registration)
        await registration.showNotification(`ครบเวลา ${timer.name}`, {
          body: `รอบใหม่เริ่มแล้ว • รอบที่ครบ ${timer.name}`,
          tag: `timer-${timer.id}`,
        })
    }
  }
}
export async function requestNotification(): Promise<NotificationPermission> {
  return 'Notification' in window ? Notification.requestPermission() : 'denied'
}
