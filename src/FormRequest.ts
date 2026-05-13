import { Request } from 'express'
import { validate } from './validate'
import type { Rules, Messages, ValidateOptions, ValidationResult } from './types'

export abstract class FormRequest {
  abstract rules(): Rules

  messages(): Messages | undefined {
    return undefined
  }

  attributes(): Record<string, string> | undefined {
    return undefined
  }

  authorize(): boolean {
    return true
  }

  static async validate(req: Request, options: ValidateOptions = {}): Promise<Record<string, any>> {
    // Instantiate the class and call validateRequest
    const instance = new (this as any)()
    return instance.validateRequest(req, options)
  }

  async validateRequest(req: Request, options: ValidateOptions = {}): Promise<Record<string, any>> {
    const rules = this.rules()
    const messages = this.messages()
    const attributes = this.attributes()

    const source = options.source || 'body'
    const data = req[source as keyof Request] as Record<string, any>

    const result = await validate(data, rules, {
      ...options,
      messages: { ...options.messages, ...messages },
      attributes: { ...options.attributes, ...attributes },
    })

    if (!result.valid) {
      // This will be handled by middleware if autoResponse is enabled
      throw new Error('Validation failed')
    }

    return result.data
  }
}
