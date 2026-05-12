export default function TypingIndicator({ name }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <div className="msg-received px-3 py-2 rounded-2xl flex items-center gap-1.5">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
      <span className="text-xs text-secondary">{name} is typing...</span>
    </div>
  )
}
