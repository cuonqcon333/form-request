import { Request, Response, NextFunction } from 'express'
import { validate } from './validate'
import type { Rules, ValidateOptions, ValidationResult } from './types'

export interface ValidationMiddlewareOptions {
  autoResponse?: boolean
  formatError?: (errors: Record<string, string[]>) => any
}

declare module 'express-serve-static-core' {
  interface Request {
    validate(rules: Rules | any, options?: ValidateOptions): Promise<Record<string, any>>
    validated(): Record<string, any>
    _validationResult?: ValidationResult
  }
}

export function validation(options: ValidationMiddlewareOptions = {}) {
  const { autoResponse = true, formatError } = options

  return (req: Request, res: Response, next: NextFunction) => {
    req.validate = async (rulesOrClass: Rules | any, validateOptions: ValidateOptions = {}): Promise<Record<string, any>> => {
      let rules: Rules
      let options: ValidateOptions = validateOptions

      // Check if rulesOrClass is a FormRequest class
      if (typeof rulesOrClass === 'function' && (rulesOrClass.prototype.rules || rulesOrClass.rules)) {
        const formRequest = new rulesOrClass()
        rules = formRequest.rules()
        options.messages = formRequest.messages ? formRequest.messages() : undefined
        options.attributes = formRequest.attributes ? formRequest.attributes() : undefined
      } else {
        rules = rulesOrClass
      }

      // Determine validation source
      const source = options.source
      let data: Record<string, any>

      if (source) {
        data = req[source as keyof Request] as Record<string, any>
      } else {
        // Merge body and query params by default (Laravel-like behavior)
        data = {
          ...(req.query || {}),
          ...(req.body || {})
        }
      }

      // Validate
      const result = await validate(data, rules, options)
      req._validationResult = result

      // If validation failed and autoResponse is enabled, send 422 and stop
      if (!result.valid && autoResponse) {
        const formattedErrors = formatErrors(result.errors)
        const errorResponse = formatError ? formatError(formattedErrors) : {
          message: 'Validation failed',
          errors: formattedErrors
        }
        res.status(422).json(errorResponse)
        // Don't continue - response already sent
        return new Promise(() => {}) // Never resolves, effectively stopping
      }

      return result.data
    }

    req.validated = (): Record<string, any> => {
      if (!req._validationResult) {
        throw new Error('No validation has been performed. Call req.validate() first.')
      }
      return req._validationResult.data
    }

    next()
  }
}

function formatErrors(errors: { field: string; message: string }[]): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}

  for (const error of errors) {
    if (!formatted[error.field]) {
      formatted[error.field] = []
    }
    formatted[error.field].push(error.message)
  }

  return formatted
}

/**
 * Middleware factory for FormRequest class validation
 * Usage: router.post('/path', validateRequest(MessageRequest), controller)
 */
export function validateRequest(FormRequestClass: any, options: ValidationMiddlewareOptions = {}) {
  const { autoResponse = true, formatError } = options

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if validation middleware is installed
      if (!req.validate) {
        throw new Error('Validation middleware not installed. Use app.use(validation()) first.')
      }

      // Validate using FormRequest class
      await req.validate(FormRequestClass)
      next()
    } catch (error) {
      // If autoResponse is disabled, pass error to next middleware
      if (!autoResponse) {
        next(error)
      }
      // Otherwise error is already handled by req.validate
    }
  }
}
