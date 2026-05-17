import type { RuleHandler } from './types'

const rules: Record<string, RuleHandler> = {}

export const required: RuleHandler = (value) => {
  return value !== undefined && value !== null && value !== ''
}

export const nullable: RuleHandler = (value) => {
  return value === null || value === undefined
}

export const string: RuleHandler = (value) => {
  return typeof value === 'string'
}

export const number: RuleHandler = (value) => {
  return typeof value === 'number' && !isNaN(value)
}

export const integer: RuleHandler = (value) => {
  return Number.isInteger(value)
}

export const boolean: RuleHandler = (value) => {
  return typeof value === 'boolean'
}

export const array: RuleHandler = (value) => {
  return Array.isArray(value)
}

export const object: RuleHandler = (value) => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const email: RuleHandler = (value) => {
  if (typeof value !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}

export const min: RuleHandler = (value, params) => {
  const min = parseInt(params![0], 10)
  if (isNaN(min)) return false

  if (typeof value === 'string') {
    return value.length >= min
  }
  if (typeof value === 'number') {
    return value >= min
  }
  if (Array.isArray(value)) {
    return value.length >= min
  }
  return false
}

export const max: RuleHandler = (value, params) => {
  const max = parseInt(params![0], 10)
  if (isNaN(max)) return false

  if (typeof value === 'string') {
    return value.length <= max
  }
  if (typeof value === 'number') {
    return value <= max
  }
  if (Array.isArray(value)) {
    return value.length <= max
  }
  return false
}

export const same: RuleHandler = (value, params, data) => {
  const otherField = params![0]
  return value === (data?.[otherField])
}

export const confirmed: RuleHandler = (value, params, data) => {
  const field = params![0] || ''
  const confirmationField = `${field}_confirmation`
  return value === (data?.[confirmationField])
}

export const inRule: RuleHandler = (value, params) => {
  if (!params || params.length === 0) return false
  return params.includes(String(value))
}

export const required_if: RuleHandler = (value, params, data) => {
  if (!params || params.length < 2) return true
  
  const otherField = params[0]
  const expectedValue = params[1]
  
  // Get nested value from data
  const otherValue = getNestedValue(data || {}, otherField)
  
  // If other field matches expected value, current field is required
  if (String(otherValue) === expectedValue) {
    return value !== undefined && value !== null && value !== ''
  }
  
  // Otherwise, field is optional
  return true
}

export const sometimes: RuleHandler = () => {
  // Always pass - this rule is handled in validation logic
  return true
}

export const bail: RuleHandler = () => {
  // Always pass - bail behavior is handled in validation logic (break on first error)
  return true
}

export const url: RuleHandler = (value) => {
  if (typeof value !== 'string') return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export const date: RuleHandler = (value) => {
  if (typeof value !== 'string' && !(value instanceof Date)) return false
  const timestamp = Date.parse(value as string)
  return !isNaN(timestamp)
}

export const regex: RuleHandler = (value, params) => {
  if (!params || params.length === 0) return false
  if (typeof value !== 'string') return false
  try {
    const pattern = new RegExp(params[0])
    return pattern.test(value)
  } catch {
    return false
  }
}

export const digits: RuleHandler = (value, params) => {
  if (!params || params.length === 0) return false
  const length = parseInt(params[0], 10)
  if (isNaN(length)) return false
  const str = String(value)
  return /^\d+$/.test(str) && str.length === length
}

export const digits_between: RuleHandler = (value, params) => {
  if (!params || params.length < 2) return false
  const minLength = parseInt(params[0], 10)
  const maxLength = parseInt(params[1], 10)
  if (isNaN(minLength) || isNaN(maxLength)) return false
  const str = String(value)
  return /^\d+$/.test(str) && str.length >= minLength && str.length <= maxLength
}

export const alpha_num: RuleHandler = (value) => {
  if (typeof value !== 'string') return false
  return /^[a-zA-Z0-9]+$/.test(value)
}

export const required_unless: RuleHandler = (value, params, data) => {
  if (!params || params.length < 2) return true
  
  const otherField = params[0]
  const expectedValue = params[1]
  
  const otherValue = getNestedValue(data || {}, otherField)
  
  // If other field does NOT match expected value, current field is required
  if (String(otherValue) !== expectedValue) {
    return value !== undefined && value !== null && value !== ''
  }
  
  return true
}

export const required_with: RuleHandler = (value, params, data) => {
  if (!params || params.length === 0) return true
  
  // Check if any of the specified fields are present
  const hasAnyField = params.some(field => {
    const fieldValue = getNestedValue(data || {}, field)
    return fieldValue !== undefined && fieldValue !== null && fieldValue !== ''
  })
  
  // If any field is present, current field is required
  if (hasAnyField) {
    return value !== undefined && value !== null && value !== ''
  }
  
  return true
}

export const required_without: RuleHandler = (value, params, data) => {
  if (!params || params.length === 0) return true
  
  // Check if any of the specified fields are missing
  const hasAnyMissingField = params.some(field => {
    const fieldValue = getNestedValue(data || {}, field)
    return fieldValue === undefined || fieldValue === null || fieldValue === ''
  })
  
  // If any field is missing, current field is required
  if (hasAnyMissingField) {
    return value !== undefined && value !== null && value !== ''
  }
  
  return true
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  if (!obj || typeof obj !== 'object') {
    return undefined
  }
  
  if (path in obj) {
    return obj[path]
  }
  
  if (!path.includes('.')) {
    return obj[path]
  }
  
  const parts = path.split('.')
  let current = obj
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }
    current = current[part]
  }
  
  return current
}

// Register built-in rules
rules.required = required
rules.nullable = nullable
rules.string = string
rules.number = number
rules.integer = integer
rules.boolean = boolean
rules.array = array
rules.object = object
rules.email = email
rules.min = min
rules.max = max
rules.same = same
rules.confirmed = confirmed
rules.in = inRule
rules.required_if = required_if
rules.sometimes = sometimes
rules.bail = bail
rules.url = url
rules.date = date
rules.regex = regex
rules.digits = digits
rules.digits_between = digits_between
rules.alpha_num = alpha_num
rules.required_unless = required_unless
rules.required_with = required_with
rules.required_without = required_without

export function extend(name: string, handler: RuleHandler) {
  rules[name] = handler
}

export function get(name: string): RuleHandler | undefined {
  return rules[name]
}

export function has(name: string): boolean {
  return name in rules
}
