import { X, Reply } from 'lucide-react'

export default function ReplyPreview({ message, onCancel }) {
  if (!message) return null
  const isImage = message.content?.startsWith('data:image')
  return (
    <div className="flex items-center gap-3 px-4 py-2 mx-4 mb-2 rounded-xl"
      style={{ background: 'rgba(124,58,237,0.1)', borderLeft: '3px solid #7c3aed' }}>
      <Reply size={14} className="text-purple-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-purple-400 font-semibold mb-0.5">Replying to message</p>
        <p className="text-xs text-secondary truncate">
          {isImage ? '📷 Image' : message.content}
        </p>
      </div>
      <button onClick={onCancel} className="text-secondary hover:text-white transition flex-shrink-0">
        <X size={14} />
      </button>
    </div>
  )
}
