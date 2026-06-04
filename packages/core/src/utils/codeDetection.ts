const CODE_PATTERNS: Array<[RegExp, string]> = [
  [/^\s*(import|export)\s+(default\s+)?[\w{*]/, 'typescript'],
  [/^\s*(const|let|var)\s+\w+\s*=/, 'javascript'],
  [/^\s*function\s+\w+\s*\(/, 'javascript'],
  [/^\s*(async\s+)?function[\s(]/, 'javascript'],
  [/=>\s*[{(]/, 'javascript'],
  [/^\s*def\s+\w+\s*\(/, 'python'],
  [/^\s*class\s+\w+[\s:(]/, 'python'],
  [/^\s*#include\s*</, 'cpp'],
  [/^\s*package\s+\w+/, 'go'],
  [/^\s*fn\s+\w+\s*\(/, 'rust'],
  [/^\s*pub\s+(fn|struct|enum|impl)/, 'rust'],
  [/^\s*<\?php/, 'php'],
  [/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP)\s/i, 'sql'],
  [/^\s*\$\w+\s*=/, 'php'],
  [/<[a-zA-Z][^>]*>[\s\S]*<\/[a-zA-Z]>/, 'html'],
  [/^\s*\{[\s\S]*"[\w-]+":\s/, 'json'],
]

const CODE_SIGNALS = [
  /[{};]/,           // statement endings / blocks
  /=>/,              // arrow functions
  /\(\)\s*[{=]/,     // function calls or definitions
  /\.\w+\(.*\)/,     // method calls
  /\/\/.+/,          // single-line comments
  /\/\*[\s\S]*\*\//, // block comments
  /#.+/,             // python comments or preprocessor
]

export function looksLikeCode(text: string): boolean {
  if (text.length < 30) return false
  const lineCount = text.split('\n').length
  if (lineCount < 2) return false

  const signalMatches = CODE_SIGNALS.filter((r) => r.test(text)).length
  if (signalMatches >= 2) return true

  return CODE_PATTERNS.some(([pattern]) => pattern.test(text))
}

export function detectLanguage(code: string): string {
  for (const [pattern, lang] of CODE_PATTERNS) {
    if (pattern.test(code)) return lang
  }
  return 'plaintext'
}
