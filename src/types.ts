export type RuleHandler = (value: any, params?: string[], data?: Record<string, any>) => boolean | Promise<boolean>
export type RuleString = string
export type Rules = Record<string, RuleString>
export type Messages = Record<string, string>

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  data: Record<string, any>
}

export interface ValidateOptions {
  messages?: Messages
  attributes?: Record<string, string>
  source?: 'body' | 'query' | 'params'
}
