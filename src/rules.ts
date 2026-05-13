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

export function extend(name: string, handler: RuleHandler) {
  rules[name] = handler
}

export function get(name: string): RuleHandler | undefined {
  return rules[name]
}

export function has(name: string): boolean {
  return name in rules
}
