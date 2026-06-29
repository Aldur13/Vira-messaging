import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { fetchLinkPreview } from '../../lib/linkPreview'
import { useStore } from '../../store/useStore'

interface Props {
  url: string
}

export default function LinkPreview({ url }: Props) {
  const token = useStore(s => s.token)
  const [preview, setPreview] = useState<{ title?: string; description?: string; image?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetchLinkPreview(token, url).then(p => {
      setPreview(p)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [url, token])

  if (loading || !preview) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 block max-w-sm rounded-lg overflow-hidden border border-high/30 hover:border-accent/50 transition-colors cursor-pointer"
    >
      {preview.image && (
        <img src={preview.image} alt="" className="w-full h-32 object-cover" />
      )}
      <div className="p-3 bg-high/20">
        {preview.title && (
          <p className="text-[12px] font-600 text-bright truncate mb-1">{preview.title}</p>
        )}
        {preview.description && (
          <p className="text-[11px] text-ghost line-clamp-2 mb-2">{preview.description}</p>
        )}
        <div className="flex items-center gap-1 text-[10px] text-accent">
          <ExternalLink size={10} />
          {new URL(url).hostname}
        </div>
      </div>
    </a>
  )
}
