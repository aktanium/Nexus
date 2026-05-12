import { Pin, X } from 'lucide-react'

export default function PinnedBanner({ messages, onUnpin, onClose }) {
  if (!messages || messages.length === 0) return null
  const latest = messages[0]
  const isImage = latest.content?.startsWith('data:image')
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-current/10"
      style={{ background: 'rgba(124,58,237,0.08)' }}>
      <Pin size={13} className="text-purple-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-purple-400 font-semibold">Pinned Message</p>
        <p className="text-xs text-secondary truncate">
          {isImage ? '📷 Image' : latest.content}
        </p>
      </div>
      <button
        onClick={() => onUnpin(latest.id)}
        className="text-xs text-secondary hover:text-red-400 transition px-2 py-1 rounded-lg hover:bg-red-400/10"
      >
        Unpin
      </button>
    </div>
  )
}
