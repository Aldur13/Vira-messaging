import type { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth.js'

async function fetchPreview(url: string) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Vira/1.0' }, signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null

    const html = await res.text()
    const ogTitle = html.match(/<meta\s+property=['"]og:title['"][^>]*content=['"]([^'"]+)['"]/)?.[1]
    const ogDesc = html.match(/<meta\s+property=['"]og:description['"][^>]*content=['"]([^'"]+)['"]/)?.[1]
    const ogImage = html.match(/<meta\s+property=['"]og:image['"][^>]*content=['"]([^'"]+)['"]/)?.[1]
    const title = ogTitle || html.match(/<title[^>]*>([^<]+)<\/title>/)?.[1]

    return {
      url,
      title: title?.slice(0, 200),
      description: ogDesc?.slice(0, 300),
      image: ogImage,
    }
  } catch {
    return null
  }
}

export async function previewRoutes(app: FastifyInstance) {
  app.post<{ Body: { url: string } }>(
    '/',
    { onRequest: [authenticate] },
    async (req) => {
      const { url } = req.body
      if (!url) return { error: 'url is required' }

      try {
        new URL(url)
      } catch {
        return { error: 'Invalid URL' }
      }

      const preview = await fetchPreview(url)
      return preview || { url }
    },
  )
}
