const MARKER_TYPES = [
  'ROLE',
  'PURPOSE',
  'CONTEXT',
  'CONDITION',
  'CONSTRAINT',
  'STYLE',
  'MOOD',
  'SUBJECT',
  'SUFFIX',
]

const MARKER_REGEX = new RegExp(
  `\\[\\[(${MARKER_TYPES.join('|')})\\]\\]([\\s\\S]*?)\\[\\[\\/\\1\\]\\]`,
  'g',
)

export const MARKER_STYLES = {
  ROLE: 'bg-violet-100 dark:bg-violet-900',
  PURPOSE: 'bg-blue-100 dark:bg-blue-900',
  CONTEXT: 'bg-amber-100 dark:bg-amber-900',
  CONDITION: 'bg-green-100 dark:bg-green-900',
  CONSTRAINT: 'bg-red-100 dark:bg-red-900',
  STYLE: 'bg-violet-100 dark:bg-violet-900',
  MOOD: 'bg-amber-100 dark:bg-amber-900',
  SUBJECT: 'bg-blue-100 dark:bg-blue-900',
  SUFFIX: 'bg-gray-100 dark:bg-gray-700',
}

export function parseMarkedText(text) {
  if (!text) return []

  const segments = []
  let lastIndex = 0
  let match

  MARKER_REGEX.lastIndex = 0
  while ((match = MARKER_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'plain', content: text.slice(lastIndex, match.index) })
    }
    segments.push({ type: match[1], content: match[2] })
    lastIndex = MARKER_REGEX.lastIndex
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'plain', content: text.slice(lastIndex) })
  }

  return segments
}

export function stripMarkers(text) {
  if (!text) return ''
  return text.replace(MARKER_REGEX, '$2')
}
