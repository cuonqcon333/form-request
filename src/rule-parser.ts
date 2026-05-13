export interface ParsedRule {
  name: string
  params: string[]
}

export function parseRuleString(ruleString: string): ParsedRule[] {
  if (!ruleString || typeof ruleString !== 'string') {
    return []
  }

  const rules: ParsedRule[] = []
  const ruleParts = ruleString.split('|').filter((r) => r.trim())

  for (const rulePart of ruleParts) {
    const parsed = parseSingleRule(rulePart)
    if (parsed) {
      rules.push(parsed)
    }
  }

  return rules
}

function parseSingleRule(rulePart: string): ParsedRule | null {
  const trimmed = rulePart.trim()
  if (!trimmed) return null

  const colonIndex = trimmed.indexOf(':')

  if (colonIndex === -1) {
    return { name: trimmed, params: [] }
  }

  const name = trimmed.substring(0, colonIndex).trim()
  const paramsString = trimmed.substring(colonIndex + 1).trim()

  if (!paramsString) {
    return { name, params: [] }
  }

  const params = paramsString.split(',').map((p) => p.trim())

  return { name, params }
}
