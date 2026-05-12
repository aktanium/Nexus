import { useState } from 'react'
import { Sparkles, Loader } from 'lucide-react'
import { api } from '../../utils/api'
import toast from 'react-hot-toast'

export default function AISuggest({ messages, lastMessage, onSelect }) {
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState(null)

  const getSuggestion = async () => {
    if (!lastMessage) return toast.error('No message to reply to')
    setLoading(true)
    setSuggestion(null)
    try {
      const { data } = await api.post('/api/ai/suggest', {
        conversation: messages.slice(-6),
        last_message: lastMessage
      })
      setSuggestion(data.suggestion)
    } catch {
      toast.error('AI suggestion failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={getSuggestion}
        disabled={loading}
        className="text-secondary hover:text-purple-400 transition p-1 disabled:opacity-50"
        title="AI suggest reply"
      >
        {loading
          ? <Loader size={18} className="animate-spin" />
          : <Sparkles size={18} />
        }
      </button>

      {suggestion && (
        <div
          className="absolute bottom-10 right-0 z-50 w-72 rounded-2xl p-4 shadow-2xl cursor-pointer hover:scale-105 transition-transform"
          style={{ background: 'linear-gradient(135deg, #1a0533, #2d1b69)', border: '1px solid rgba(124,58,237,0.4)' }}
          onClick={() => { onSelect(suggestion); setSuggestion(null) }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={12} className="text-purple-400" />
            <span className="text-xs text-purple-400 font-semibold">AI Suggestion</span>
            <span className="text-xs text-gray-500 ml-auto">tap to use</span>
          </div>
          <p className="text-sm text-white leading-relaxed">"{suggestion}"</p>
        </div>
      )}
    </div>
  )
}
