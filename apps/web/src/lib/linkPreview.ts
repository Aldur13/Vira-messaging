export interface LinkPreview {
  url: string
  title?: string
  description?: string
  image?: string
  favicon?: string
}

const URL_REGEX = /https?:\/\/[^\s]+/gi

export function extractUrls(text: string): string[] {
  const urls: string[] = []
  let match
  while ((match = URL_REGEX.exec(text)) !== null) {
    try {
      new URL(match[0])
      urls.push(match[0])
    } catch {
      // Invalid URL
    }
  }
  return [...new Set(urls)] // Deduplicate
}

export async function fetchLinkPreview(token: string, url: string): Promise<LinkPreview | null> {
  try {
    const res = await fetch('/api/preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
