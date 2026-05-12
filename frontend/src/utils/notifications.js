export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export function showNotification(title, body, icon = '/vite.svg') {
  if (Notification.permission !== 'granted') return
  const n = new Notification(title, { body, icon, silent: false })
  setTimeout(() => n.close(), 4000)
}
