import { Monitor, MonitorOff, PhoneOff } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { IconButton } from '../ui/IconButton'
import { useStore } from '../../store/useStore'

export default function VoiceBar() {
  const channels        = useStore(s => s.channels)
  const members         = useStore(s => s.members)
  const activeId        = useStore(s => s.activeVoiceChannelId)
  const isScreenSharing = useStore(s => s.isScreenSharing)
  const leaveVoice      = useStore(s => s.leaveVoiceChannel)
  const startShare      = useStore(s => s.startScreenShare)
  const stopShare       = useStore(s => s.stopScreenShare)
  const peerStreams      = useStore(s => s.peerScreenStreams)

  if (!activeId) return null

  const ch = channels.find(c => c.id === activeId)
  if (!ch) return null

  const activeMembers = members.slice(0, 4)
  const extra = Math.max(0, members.length - 4)
  const sharingPeers = Object.keys(peerStreams)

  return (
    <>
      {/* Peer screen share panel (appears above voice bar when someone is sharing) */}
      {sharingPeers.length > 0 && (
        <div className="border-t border-white/5 bg-deep px-3 py-2 flex-shrink-0">
          <p className="text-[10px] font-700 uppercase tracking-wider text-ghost mb-2">Screen Share</p>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(sharingPeers.length, 2)}, 1fr)` }}>
            {sharingPeers.map(uid => (
              <div key={uid} className="rounded-xl overflow-hidden bg-lift aspect-video">
                <video
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  ref={el => {
                    if (el && peerStreams[uid]) {
                      el.src = peerStreams[uid]
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voice connected bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-deep border-t border-white/5 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-online flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] font-600 text-online leading-tight">Voice Connected</p>
          <p className="text-[10px] font-500 text-ghost leading-tight truncate">{ch.name}</p>
        </div>

        <div className="flex items-center ml-auto gap-1">
          {/* Member avatars */}
          <div className="flex -space-x-1.5 mr-1">
            {activeMembers.map(m => (
              <Avatar key={m.userId} user={m.user} size="xs" className="border border-dark" />
            ))}
            {extra > 0 && (
              <div className="w-5 h-5 rounded-full bg-high border border-dark flex items-center justify-center text-[8px] font-700 text-ghost">
                +{extra}
              </div>
            )}
          </div>

          <IconButton
            icon={isScreenSharing ? MonitorOff : Monitor}
            label={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            onClick={isScreenSharing ? stopShare : startShare}
            active={isScreenSharing}
            size={13}
          />
          <IconButton
            icon={PhoneOff}
            label="Disconnect"
            onClick={leaveVoice}
            danger
            size={13}
          />
        </div>
      </div>
    </>
  )
}
