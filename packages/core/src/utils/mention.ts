import type { MentionItem, MentionSource } from '../types.js'

export async function resolveMentionSource(
  source: MentionSource,
  query: string,
): Promise<MentionItem[]> {
  if (Array.isArray(source)) {
    const q = query.toLowerCase()
    return q
      ? source.filter(
          (item) =>
            item.label.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q),
        )
      : source
  }
  return source(query)
}
