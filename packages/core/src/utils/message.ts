import type {
  MessagePart,
  ComposedMessage,
  MentionPart,
  CodeBlockPart,
  ImagePart,
  FilePart,
} from '../types'

export function buildComposedMessage(parts: MessagePart[]): ComposedMessage {
  const mentions: MentionPart[] = []
  const codeBlocks: CodeBlockPart[] = []
  const images: ImagePart[] = []
  const files: FilePart[] = []
  const textChunks: string[] = []

  for (const part of parts) {
    switch (part.type) {
      case 'text':
        textChunks.push(part.content)
        break
      case 'mention':
        mentions.push(part)
        textChunks.push(`@${part.label}`)
        break
      case 'code_block':
        codeBlocks.push(part)
        textChunks.push(`\`\`\`${part.language}\n${part.code}\n\`\`\``)
        break
      case 'image':
        images.push(part)
        break
      case 'file':
        files.push(part)
        break
    }
  }

  return {
    parts,
    text: textChunks.join('').trim(),
    mentions,
    codeBlocks,
    images,
    files,
  }
}
