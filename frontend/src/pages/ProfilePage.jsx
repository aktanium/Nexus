import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { api } from '../utils/api'
import toast from 'react-hot-toast'
import Avatar from '../components/ui/Avatar'
import ThemeToggle from '../components/ui/ThemeToggle'
import { ArrowLeft, User, Mail, Edit3, Save, Zap } from 'lucide-react'

export default function ProfilePage() {
  const { user, setAuth, token, logout } = useAuthStore()
  const { theme } = useThemeStore()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    display_name: user?.display_name || '',
    username: user?.username || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const { data } = await api.patch('/api/users/me', form)
      setAuth(data, token)
      toast.success('Profile updated!')
      setEditing(false)
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: theme === 'dark' ? '#1a1a24' : '#f0f0f5',
    border: '1px solid rgba(124,58,237,0.3)',
    color: theme === 'dark' ? '#fff' : '#1a1a2e'
  }

  return (
    <div className={`min-h-screen ${theme}`} style={{ background: theme === 'dark' ? '#0f0f13' : '#f0f0f5' }}>
      <div className="max-w-lg mx-auto p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-purple-400 transition"
          >
            <ArrowLeft size={16} /> Back to Chat
          </button>
          <ThemeToggle />
        </div>

        {/* Profile card */}
        <div className="rounded-2xl p-8 mb-6"
          style={{ background: theme === 'dark' ? '#16161d' : '#ffffff', border: '1px solid rgba(124,58,237,0.15)' }}>

          {/* Avatar section */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4">
              <Avatar name={user?.display_name || user?.username} size="xl" online showStatus />
            </div>
            <h2 className="text-xl font-bold">{user?.display_name || user?.username}</h2>
            <p className="text-sm text-secondary">@{user?.username}</p>
            <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-xs text-green-400 font-medium">Online</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { label: 'Member since', value: 'Today' },
              { label: 'Status', value: 'Active' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-4 text-center"
                style={{ background: theme === 'dark' ? '#0f0f13' : '#f0f0f5' }}>
                <p className="text-lg font-bold text-purple-400">{value}</p>
                <p className="text-xs text-secondary mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Edit form */}
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Display Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-3.5 text-gray-500" />
                  <input
                    value={form.display_name}
                    onChange={e => setForm({...form, display_name: e.target.value})}
                    className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 transition"
                    style={inputStyle}
                    placeholder="Your display name"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                >
                  <Save size={14} /> Save
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-full py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 text-purple-400"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              <Edit3 size={14} /> Edit Profile
            </button>
          )}
        </div>

        {/* Info card */}
        <div className="rounded-2xl p-6"
          style={{ background: theme === 'dark' ? '#16161d' : '#ffffff', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-4">Account Info</h3>
          <div className="space-y-4">
            {[
              { icon: User, label: 'Username', value: '@' + user?.username },
              { icon: Mail, label: 'Email', value: user?.email },
              { icon: Zap, label: 'Plan', value: 'Free Forever' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(124,58,237,0.1)' }}>
                  <Icon size={14} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-secondary">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="w-full mt-4 py-3 rounded-xl text-sm font-semibold text-red-400 transition"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
