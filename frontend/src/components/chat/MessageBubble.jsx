import { format } from 'date-fns'
import { Reply, Pin, Trash2 } from 'lucide-react'
import { useState } from 'react'

export default function MessageBubble({ message, isMine, onReply, onPin, onDelete }) {
  const [showActions, setShowActions] = useState(false)
  const isImage = message.content?.startsWith('data:image')

  return (
    <div
      className={`group flex msg-animate ${isMine ? 'justify-end' : 'justify-start'} items-end gap-2`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="relative max-w-xs lg:max-w-md">

        {/* Reply preview inside bubble */}
        {message.reply_to && (
          <div className={`mb-1 px-3 py-2 rounded-xl text-xs opacity-80 ${isMine ? 'bg-purple-800/50 text-purple-200' : 'bg-white/10 text-secondary'}`}
            style={{ borderLeft: '2px solid rgba(167,139,250,0.6)' }}>
            <p className="font-semibold mb-0.5">
              {message.reply_to.sender_name || 'Message'}
            </p>
            <p className="truncate">
              {message.reply_to.content?.startsWith('data:image') ? '📷 Image' : message.reply_to.content}
            </p>
          </div>
        )}

        {/* Pin indicator */}
        {message.is_pinned && (
          <div className="flex items-center gap-1 mb-1 px-1">
            <Pin size={10} className="text-purple-400" />
            <span className="text-xs text-purple-400">Pinned</span>
          </div>
        )}

        {/* Bubble */}
        <div className={`${isImage ? 'p-1.5' : 'px-4 py-2.5'} text-sm ${isMine ? 'msg-sent' : 'msg-received'}`}>
          {isImage ? (
            <img
              src={message.content}
              alt="shared"
              className="rounded-xl max-w-full max-h-64 object-cover cursor-pointer"
              onClick={() => window.open(message.content, '_blank')}
            />
          ) : (
            <p className="leading-relaxed break-words">{message.content}</p>
          )}
          <p className={`text-xs mt-1 ${isMine ? 'text-purple-200' : 'text-secondary'}`}>
            {message.created_at ? format(new Date(message.created_at), 'HH:mm') : ''}
            {message.pending && <span className="ml-1 opacity-40">●</span>}
          </p>
        </div>

        {/* Action buttons on hover */}
        {showActions && !message.pending && (
          <div
            className={`absolute top-0 ${isMine ? 'right-full mr-2' : 'left-full ml-2'} flex items-center gap-1 py-1 px-2 rounded-xl shadow-lg`}
            style={{ background: '#16161d', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <button
              onClick={() => onReply && onReply(message)}
              className="p-1.5 text-secondary hover:text-purple-400 transition rounded-lg hover:bg-purple-400/10"
              title="Reply"
            >
              <Reply size={13} />
            </button>
            <button
              onClick={() => onPin && onPin(message.id)}
              className={`p-1.5 transition rounded-lg ${message.is_pinned ? 'text-purple-400' : 'text-secondary hover:text-purple-400'} hover:bg-purple-400/10`}
              title={message.is_pinned ? 'Unpin' : 'Pin'}
            >
              <Pin size={13} />
            </button>
            {isMine && (
              <button
                onClick={() => onDelete && onDelete(message.id)}
                className="p-1.5 text-secondary hover:text-red-400 transition rounded-lg hover:bg-red-400/10"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
