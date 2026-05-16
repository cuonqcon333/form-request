import { parseRuleString } from './rule-parser'
import { get, has } from './rules'
import type { Rules, ValidateOptions, ValidationResult, ValidationError, RuleHandler } from './types'

const defaultMessages: Record<string, string> = {
  required: 'The :field field is required.',
  nullable: 'The :field field must be nullable.',
  string: 'The :field must be a string.',
  number: 'The :field must be a number.',
  integer: 'The :field must be an integer.',
  boolean: 'The :field must be a boolean.',
  array: 'The :field must be an array.',
  object: 'The :field must be an object.',
  email: 'The :field must be a valid email address.',
  min: 'The :field must be at least :min.',
  max: 'The :field may not be greater than :max.',
  same: 'The :field must match :other.',
  confirmed: 'The :field confirmation does not match.',
}

export async function validate(
  data: Record<string, any>,
  rules: Rules,
  options: ValidateOptions = {}
): Promise<ValidationResult> {
  const errors: ValidationError[] = []
  const validatedData: Record<string, any> = {}
  const customMessages = options.messages || {}
  const customAttributes = options.attributes || {}

  // Expand wildcard rules
  const expandedRules = expandWildcardRules(rules, data)

  for (const field in expandedRules) {
    const ruleString = expandedRules[field]
    const parsedRules = parseRuleString(ruleString)
    const fieldValue = getNestedValue(data, field)

    // Check if field is nullable
    const nullableRule = parsedRules.find((r) => r.name === 'nullable')
    if (nullableRule && (fieldValue === null || fieldValue === undefined)) {
      // Nullable and null/undefined - skip validation
      continue
    }

    // Check if field is required
    const requiredRule = parsedRules.find((r) => r.name === 'required')
    const isRequired = !!requiredRule

    // If not required and field is empty, skip validation
    if (!isRequired && isEmpty(fieldValue)) {
      continue
    }

    // Validate each rule
    for (const parsedRule of parsedRules) {
      // Skip nullable (already handled)
      if (parsedRule.name === 'nullable') continue

      const ruleHandler = get(parsedRule.name)

      if (!ruleHandler) {
        throw new Error(`Unknown validation rule: ${parsedRule.name}`)
      }

      const isValid = await ruleHandler(fieldValue, parsedRule.params, data)

      if (!isValid) {
        const errorMessage = formatMessage(field, parsedRule, customMessages, customAttributes, parsedRule.params)
        errors.push({ field, message: errorMessage })
        break // Stop on first error for this field
      }
    }

    // Add to validated data if no errors
    if (!errors.some((e) => e.field === field)) {
      setNestedValue(validatedData, field, fieldValue)
    }
  }

  const valid = errors.length === 0
  const reconstructedData = reconstructNestedObjects(validatedData)

  return {
    valid,
    errors,
    data: reconstructedData,
  }
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  // Check if obj exists
  if (!obj || typeof obj !== 'object') {
    return undefined
  }

  // First, try to get the value directly (for flat input like { 'user.email': '...' })
  if (path in obj) {
    return obj[path]
  }

  // If not found, try nested access (for nested input like { user: { email: '...' } })
  if (!path.includes('.')) {
    return obj[path]
  }

  const parts = path.split('.')
  let current = obj

  for (const part of parts) {
    if (part === '*' && Array.isArray(current)) {
      // Handle array wildcard
      return current.map((item) => item)
    }
    if (current === null || current === undefined) {
      return undefined
    }
    current = current[part]
  }

  return current
}

function setNestedValue(obj: Record<string, any>, path: string, value: any): void {
  if (!path.includes('.')) {
    obj[path] = value
    return
  }

  const parts = path.split('.')
  let current = obj

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (!(part in current)) {
      current[part] = {}
    }
    current = current[part]
  }

  current[parts[parts.length - 1]] = value
}

function isEmpty(value: any): boolean {
  return value === undefined || value === null || value === ''
}

function reconstructNestedObjects(data: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}

  for (const key in data) {
    if (key.includes('.')) {
      setNestedValue(result, key, data[key])
    } else {
      result[key] = data[key]
    }
  }

  return result
}

function formatMessage(
  field: string,
  rule: { name: string; params: string[] },
  customMessages: Record<string, string>,
  customAttributes: Record<string, string>,
  params: string[]
): string {
  const customKey = `${field}.${rule.name}`
  if (customMessages[customKey]) {
    return interpolateMessage(customMessages[customKey], field, rule.params, customAttributes)
  }

  const defaultTemplate = defaultMessages[rule.name] || 'The :field field is invalid.'
  return interpolateMessage(defaultTemplate, field, rule.params, customAttributes)
}

function interpolateMessage(
  message: string,
  field: string,
  params: string[],
  customAttributes: Record<string, string>
): string {
  const fieldName = customAttributes[field] || field
  let result = message.replace(/:field/g, fieldName)

  // Replace rule-specific parameters
  if (params.length > 0) {
    result = result.replace(/:min/g, params[0])
    result = result.replace(/:max/g, params[0])
    result = result.replace(/:other/g, params[0])
  }

  return result
}

function expandWildcardRules(rules: Rules, data: Record<string, any>): Rules {
  const expanded: Rules = {}

  for (const field in rules) {
    if (field.includes('*')) {
      // Expand wildcard field
      const expandedFields = expandWildcardField(field, data)
      for (const expandedField of expandedFields) {
        expanded[expandedField] = rules[field]
      }
    } else {
      expanded[field] = rules[field]
    }
  }

  return expanded
}

function expandWildcardField(field: string, data: Record<string, any>): string[] {
  const parts = field.split('.')
  const expanded: string[] = []

  function expand(currentPath: string[], remainingParts: string[], currentData: any) {
    if (remainingParts.length === 0) {
      expanded.push(currentPath.join('.'))
      return
    }

    const part = remainingParts[0]
    const rest = remainingParts.slice(1)

    if (part === '*') {
      // Wildcard - iterate array
      if (Array.isArray(currentData)) {
        for (let i = 0; i < currentData.length; i++) {
          expand([...currentPath, String(i)], rest, currentData[i])
        }
      }
    } else {
      // Regular part
      const nextData = currentData?.[part]
      expand([...currentPath, part], rest, nextData)
    }
  }

  expand([], parts, data)
  return expanded
}
