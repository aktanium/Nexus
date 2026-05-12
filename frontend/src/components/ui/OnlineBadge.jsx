export default function OnlineBadge({ online, showLabel = false, size = 'sm' }) {
  const dot = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'
  return (
    <div className="flex items-center gap-1.5">
      <div className={`${dot} rounded-full flex-shrink-0 ${online ? 'bg-green-400' : 'bg-gray-500'}`}
        style={online ? { boxShadow: '0 0 6px rgba(74,222,128,0.6)' } : {}} />
      {showLabel && (
        <span className={`text-xs font-medium ${online ? 'text-green-400' : 'text-secondary'}`}>
          {online ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  )
}
