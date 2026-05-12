import { useState } from 'react'
import { X, Users, Plus } from 'lucide-react'
import { api } from '../../utils/api'
import toast from 'react-hot-toast'
import Avatar from '../ui/Avatar'

export default function GroupModal({ users, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)

  const toggle = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleCreate = async () => {
    if (!name.trim()) return toast.error('Group name required')
    if (selected.length === 0) return toast.error('Select at least 1 member')
    setLoading(true)
    try {
      const { data } = await api.post('/api/groups/', {
        name: name.trim(),
        description: description.trim(),
        member_ids: selected
      })
      toast.success(`Group "${data.name}" created!`)
      onCreated(data)
      onClose()
    } catch {
      toast.error('Failed to create group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ background: '#16161d', border: '1px solid rgba(124,58,237,0.2)' }}>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-purple-400" />
            <h2 className="font-bold text-lg">Create Group</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Group Name *
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Team Alpha"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
              style={{ background: '#222230', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Description
            </label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What's this group about?"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
              style={{ background: '#222230', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Add Members ({selected.length} selected)
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => toggle(u.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition"
                style={{
                  background: selected.includes(u.id)
                    ? 'rgba(124,58,237,0.2)'
                    : 'rgba(255,255,255,0.03)',
                  border: selected.includes(u.id)
                    ? '1px solid rgba(124,58,237,0.4)'
                    : '1px solid transparent'
                }}
              >
                <Avatar name={u.display_name || u.username} size="sm" />
                <span className="text-sm font-medium flex-1 text-left">
                  {u.display_name || u.username}
                </span>
                {selected.includes(u.id) && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: '#7c3aed' }}>
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><Plus size={16} /> Create Group</>
          )}
        </button>
      </div>
    </div>
  )
}
