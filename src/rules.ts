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

export function extend(name: string, handler: RuleHandler) {
  rules[name] = handler
}

export function get(name: string): RuleHandler | undefined {
  return rules[name]
}

export function has(name: string): boolean {
  return name in rules
}
