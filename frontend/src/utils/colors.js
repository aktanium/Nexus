const AVATAR_COLORS = [
  ['#7c3aed', '#4c1d95'],
  ['#db2777', '#831843'],
  ['#059669', '#064e3b'],
  ['#d97706', '#78350f'],
  ['#dc2626', '#7f1d1d'],
  ['#2563eb', '#1e3a8a'],
  ['#0891b2', '#164e63'],
  ['#65a30d', '#365314'],
]

export function getAvatarColor(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function getInitials(name) {
  if (!name) return '??'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}
