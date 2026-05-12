import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { api, createWebSocket } from '../utils/api'
import { requestNotificationPermission, showNotification } from '../utils/notifications'
import toast from 'react-hot-toast'
import { Search, Send, LogOut, MessageSquare, Hash, Plus, Pin } from 'lucide-react'
import Avatar from '../components/ui/Avatar'
import OnlineBadge from '../components/ui/OnlineBadge'
import ThemeToggle from '../components/ui/ThemeToggle'
import EmojiButton from '../components/chat/EmojiButton'
import TypingIndicator from '../components/chat/TypingIndicator'
import MessageBubble from '../components/chat/MessageBubble'
import AISuggest from '../components/chat/AISuggest'
import ImageUpload from '../components/chat/ImageUpload'
import GroupModal from '../components/chat/GroupModal'
import ReplyPreview from '../components/chat/ReplyPreview'
import PinnedBanner from '../components/chat/PinnedBanner'
import MobileMenu from '../components/ui/MobileMenu'

export default function ChatPage() {
  const { user, token, logout } = useAuthStore()
  const { theme } = useThemeStore()
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [searchMsg, setSearchMsg] = useState('')
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [activeTab, setActiveTab] = useState('users')
  const [replyTo, setReplyTo] = useState(null)
  const [pinnedMessages, setPinnedMessages] = useState([])
  const [showPinned, setShowPinned] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const wsRef = useRef(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const selectedGroupRef = useRef(null)

  useEffect(() => { selectedGroupRef.current = selectedGroup }, [selectedGroup])

  useEffect(() => { document.body.className = theme }, [theme])

  useEffect(() => {
    if (!user || !token) { navigate('/login'); return }
    loadUsers()
    loadGroups()
    connectWebSocket()
    requestNotificationPermission()
    return () => wsRef.current?.close()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id)
      loadPinned(selectedUser.id)
    }
    setReplyTo(null)
  }, [selectedUser])

  useEffect(() => {
    if (selectedGroup) loadGroupMessages(selectedGroup.id)
    setReplyTo(null)
  }, [selectedGroup])

  const connectWebSocket = () => {
    const ws = createWebSocket(user.id, token)
    ws.onopen = () => {
      console.log('WS connected')
    }
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)

      if (msg.type === 'online_users_list') {
        setOnlineUsers(new Set(msg.user_ids))

      } else if (msg.type === 'user_online') {
        setOnlineUsers(prev => new Set([...prev, msg.user_id]))

      } else if (msg.type === 'user_offline') {
        setOnlineUsers(prev => {
          const s = new Set(prev)
          s.delete(msg.user_id)
          return s
        })

      } else if (msg.type === 'typing') {
        setTypingUsers(prev => new Set([...prev, msg.sender_id]))
        setTimeout(() => {
          setTypingUsers(prev => {
            const s = new Set(prev)
            s.delete(msg.sender_id)
            return s
          })
        }, 2500)

      } else if (msg.type === 'message') {
        setMessages(prev => [...prev, msg])
        showNotification(
          msg.sender_name || 'New message',
          msg.content?.startsWith('data:image') ? '📷 Image' : msg.content
        )
        try { new Audio('/notify.mp3').play() } catch {}

      } else if (msg.type === 'group_message') {
        setMessages(prev => {
          const sg = selectedGroupRef.current
          if (!sg || msg.group_id !== sg.id) return prev
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        try { new Audio('/notify.mp3').play() } catch {}

      } else if (msg.type === 'message_deleted') {
        setMessages(prev => prev.filter(m => m.id !== msg.message_id))

      } else if (msg.type === 'message_pinned') {
        setMessages(prev => prev.map(m =>
          m.id === msg.message_id ? { ...m, is_pinned: msg.is_pinned } : m
        ))
      }
    }
    ws.onclose = () => {
      setTimeout(connectWebSocket, 3000)
    }
    wsRef.current = ws
  }

  const wsSend = (data) => {
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify(data))
    }
  }

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/api/users/')
      setUsers(data)
    } catch { toast.error('Failed to load users') }
  }

  const loadGroups = async () => {
    try {
      const { data } = await api.get('/api/groups/')
      setGroups(data)
    } catch {}
  }

  const loadMessages = async (userId) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/api/messages/conversation/${userId}`)
      setMessages(data)
    } catch { toast.error('Failed to load messages') }
    finally { setLoading(false) }
  }

  const loadPinned = async (userId) => {
    try {
      const { data } = await api.get(`/api/messages/pinned/${userId}`)
      setPinnedMessages(data)
    } catch {}
  }

  const loadGroupMessages = async (groupId) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/api/groups/${groupId}/messages`)
      setMessages(data)
    } catch { toast.error('Failed to load messages') }
    finally { setLoading(false) }
  }

  const sendMessage = async (overrideContent) => {
    const raw = typeof overrideContent === 'string' ? overrideContent : input
    const content = raw.trim()
    if (!content) return
    const tempId = 'temp-' + Date.now()
    const replyContext = replyTo

    const optimistic = {
      id: tempId,
      content,
      sender_id: user.id,
      sender_name: user.display_name || user.username,
      created_at: new Date().toISOString(),
      pending: true,
      reply_to: replyContext ? { id: replyContext.id, content: replyContext.content, sender_name: replyContext.sender_name } : null,
      reply_to_id: replyContext?.id || null,
      is_pinned: false
    }
    setMessages(prev => [...prev, optimistic])
    if (typeof overrideContent !== 'string') setInput('')
    setReplyTo(null)

    try {
      if (selectedGroup) {
        const { data } = await api.post(`/api/groups/${selectedGroup.id}/messages`, {
          content,
          reply_to_id: replyContext?.id || null
        })
        setMessages(prev => prev.map(m => m.id === tempId ? data : m))

        const memberIds = users.map(u => u.id)
        wsSend({
          type: 'group_message',
          group_id: selectedGroup.id,
          member_ids: memberIds,
          sender_id: user.id,
          ...data
        })
      } else if (selectedUser) {
        const { data } = await api.post('/api/messages/', {
          receiver_id: selectedUser.id,
          content,
          reply_to_id: replyContext?.id || null
        })
        setMessages(prev => prev.map(m => m.id === tempId ? data : m))
        wsSend({
          type: 'message',
          receiver_id: selectedUser.id,
          sender_name: user.display_name || user.username,
          ...data
        })
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      toast.error('Failed to send')
    }
  }

  const handleReply = (message) => {
    setReplyTo(message)
    inputRef.current?.focus()
  }

  const handlePin = async (msgId) => {
    try {
      const endpoint = selectedGroup
        ? `/api/groups/${selectedGroup.id}/messages/${msgId}/pin`
        : `/api/messages/${msgId}/pin`
      const { data } = await api.patch(endpoint)
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_pinned: data.is_pinned } : m))
      if (selectedUser) {
        setPinnedMessages(prev =>
          data.is_pinned
            ? [{ ...messages.find(m => m.id === msgId), is_pinned: true }, ...prev]
            : prev.filter(m => m.id !== msgId)
        )
      }
      wsSend({ type: 'message_pinned', message_id: msgId, is_pinned: data.is_pinned, receiver_id: selectedUser?.id })
      toast.success(data.is_pinned ? '📌 Message pinned' : 'Message unpinned')
    } catch { toast.error('Failed to pin') }
  }

  const handleDelete = async (msgId) => {
    try {
      await api.delete(`/api/messages/${msgId}`)
      setMessages(prev => prev.filter(m => m.id !== msgId))
      setPinnedMessages(prev => prev.filter(m => m.id !== msgId))
      wsSend({ type: 'message_deleted', message_id: msgId, receiver_id: selectedUser?.id })
      toast.success('Message deleted')
    } catch { toast.error('Failed to delete') }
  }

  const handleTyping = () => {
    if (!selectedUser) return
    wsSend({ type: 'typing', receiver_id: selectedUser.id, sender_id: user.id })
  }

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.display_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const filteredMessages = searchMsg
    ? messages.filter(m => m.content?.toLowerCase().includes(searchMsg.toLowerCase()))
    : messages

  const lastReceivedMessage = [...messages].reverse().find(m => m.sender_id !== user.id)
  const selectedTyping = selectedUser && typingUsers.has(selectedUser.id)

  return (
    <div className="h-screen flex overflow-hidden">

      {/* SIDEBAR */}
      <div className={`sidebar w-72 flex flex-col border-r flex-shrink-0 ${mobileSidebarOpen ? 'mobile-open' : ''}`}>

        <div className="p-4 border-b border-current/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
              <MessageSquare size={15} className="text-white" />
            </div>
            <span className="font-black text-lg tracking-tight">Nexus</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="p-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-3 text-secondary" />
            <input
              className="search-input w-full rounded-xl pl-8 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 transition"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="px-3 mb-2 flex gap-2">
          {['users', 'groups'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition ${activeTab === tab ? 'text-white' : 'text-secondary hover:bg-white/5'}`}
              style={activeTab === tab ? { background: 'linear-gradient(135deg, #7c3aed, #a855f7)' } : {}}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 py-1">
          {activeTab === 'users' ? (
            filteredUsers.map(u => (
              <button
                key={u.id}
                onClick={() => { setSelectedUser(u); setSelectedGroup(null); setMobileSidebarOpen(false) }}
                className={`user-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left border ${selectedUser?.id === u.id ? 'active' : 'border-transparent'}`}
              >
                <Avatar name={u.display_name || u.username} size="md" online={onlineUsers.has(u.id)} showStatus />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{u.display_name || u.username}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <OnlineBadge online={onlineUsers.has(u.id)} showLabel size="sm" />
                  </div>
                </div>
              </button>
            ))
          ) : (
            <>
              <button
                onClick={() => setShowGroupModal(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-purple-400 transition text-sm font-semibold border border-dashed border-purple-500/30 hover:bg-purple-500/10"
              >
                <Plus size={14} /> New Group
              </button>
              {groups.map(g => (
                <button
                  key={g.id}
                  onClick={() => { setSelectedGroup(g); setSelectedUser(null); setMobileSidebarOpen(false) }}
                  className={`user-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left border ${selectedGroup?.id === g.id ? 'active' : 'border-transparent'}`}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                    {g.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{g.name}</p>
                    <p className="text-xs text-secondary truncate">{g.description || 'Group chat'}</p>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>

        <div className="p-3 border-t border-current/10">
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate('/profile')} className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-80 transition">
              <Avatar name={user?.display_name || user?.username} size="md" online showStatus />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold truncate">{user?.display_name || user?.username}</p>
                <OnlineBadge online showLabel size="sm" />
              </div>
            </button>
            <button onClick={logout} className="text-secondary hover:text-red-400 transition p-1.5 rounded-lg hover:bg-red-400/10">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 mobile-only"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* CHAT AREA */}
      <div className="chat-area flex-1 flex flex-col overflow-hidden">
        {(selectedUser || selectedGroup) ? (
          <>
            <div className="chat-header h-14 border-b border-current/10 flex items-center px-5 gap-3 flex-shrink-0">
              <MobileMenu
                open={mobileSidebarOpen}
                onToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              />
              <Hash size={16} className="text-secondary" />
              {selectedUser ? (
                <Avatar name={selectedUser.display_name || selectedUser.username} size="sm" online={onlineUsers.has(selectedUser.id)} showStatus />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                  {selectedGroup?.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-bold text-sm leading-tight">
                  {selectedUser ? (selectedUser.display_name || selectedUser.username) : selectedGroup?.name}
                </p>
                <div className="flex items-center gap-1">
                  {selectedUser
                    ? <OnlineBadge online={onlineUsers.has(selectedUser.id)} showLabel size="sm" />
                    : <span className="text-xs text-secondary">{selectedGroup?.description || 'Group chat'}</span>
                  }
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {selectedUser && pinnedMessages.length > 0 && (
                  <button
                    onClick={() => setShowPinned(!showPinned)}
                    className={`p-2 rounded-lg transition ${showPinned ? 'text-purple-400 bg-purple-400/10' : 'text-secondary hover:text-purple-400 hover:bg-purple-400/10'}`}
                    title="Pinned messages"
                  >
                    <Pin size={15} />
                  </button>
                )}
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-2.5 text-secondary" />
                  <input
                    className="search-input rounded-lg pl-8 pr-3 py-2 text-xs outline-none focus:ring-1 focus:ring-purple-500 w-40 transition"
                    placeholder="Search messages..."
                    value={searchMsg}
                    onChange={e => setSearchMsg(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {showPinned && selectedUser && (
              <PinnedBanner
                messages={pinnedMessages}
                onUnpin={(id) => handlePin(id)}
                onClose={() => setShowPinned(false)}
              />
            )}

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {loading ? (
                <div className="flex justify-center pt-12">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(124,58,237,0.1)' }}>
                    <MessageSquare size={28} className="text-purple-400 opacity-60" />
                  </div>
                  <p className="text-secondary text-sm">No messages yet — say hello! 👋</p>
                </div>
              ) : (
                filteredMessages.map((msg, i) => {
                  const isMine = msg.sender_id === user.id
                  return (
                    <div key={msg.id || i}>
                      {!isMine && selectedGroup && msg.sender_name && (
                        <p className="text-xs text-secondary ml-1 mb-1">{msg.sender_name}</p>
                      )}
                      <MessageBubble
                        message={msg}
                        isMine={isMine}
                        onReply={handleReply}
                        onPin={handlePin}
                        onDelete={handleDelete}
                      />
                    </div>
                  )
                })
              )}
              {selectedTyping && (
                <TypingIndicator name={selectedUser?.display_name || selectedUser?.username} />
              )}
              <div ref={bottomRef} />
            </div>

            <ReplyPreview message={replyTo} onCancel={() => setReplyTo(null)} />

            <div className="input-area p-4 border-t border-current/10 flex-shrink-0">
              <div className="input-box flex items-center gap-2 rounded-2xl px-4 py-2.5">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => { setInput(e.target.value); handleTyping() }}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={`Message ${selectedUser ? (selectedUser.display_name || selectedUser.username) : selectedGroup?.name}...`}
                  className="flex-1 bg-transparent text-sm outline-none"
                />
                <ImageUpload onImageSelect={(url) => sendMessage(url)} />
                <EmojiButton onSelect={(emoji) => { setInput(prev => prev + emoji); inputRef.current?.focus() }} />
                <AISuggest
                  messages={messages}
                  lastMessage={lastReceivedMessage?.content}
                  onSelect={(text) => { setInput(text); inputRef.current?.focus() }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim()}
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition disabled:opacity-30"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                >
                  <Send size={14} className="text-white" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mobile-only p-3 border-b border-current/10 flex items-center">
              <MobileMenu
                open={mobileSidebarOpen}
                onToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.1)' }}>
                <MessageSquare size={36} className="text-purple-400 opacity-50" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black mb-1">Welcome to Nexus</h3>
                <p className="text-secondary text-sm">Select a user or group to start chatting</p>
              </div>
            </div>
          </>
        )}
      </div>

      {showGroupModal && (
        <GroupModal
          users={users}
          onClose={() => setShowGroupModal(false)}
          onCreated={(g) => setGroups(prev => [...prev, g])}
        />
      )}
    </div>
  )
}
