import { getAvatarColor, getInitials } from '../../utils/colors'

export default function Avatar({ name, size = 'md', online = false, showStatus = false }) {
  const [from, to] = getAvatarColor(name || '')
  const initials = getInitials(name)

  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-lg',
  }

  return (
    <div className="relative flex-shrink-0">
      <div
        className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white select-none`}
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        {initials}
      </div>
      {showStatus && (
        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-current ${online ? 'bg-green-400 online-pulse' : 'bg-gray-500'}`} />
      )}
    </div>
  )
}
