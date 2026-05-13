import { describe, it, expect } from 'vitest'
import { validate } from '../src/validate'
import { extend } from '../src/rules'

describe('Validator', () => {
  it('should validate basic rules', async () => {
    const result = await validate(
      { email: 'test@test.com', password: '123456' },
      {
        email: 'required|email',
        password: 'required|min:6'
      }
    )

    expect(result.valid).toBe(true)
    expect(result.data).toEqual({ email: 'test@test.com', password: '123456' })
  })

  it('should fail validation for invalid email', async () => {
    const result = await validate(
      { email: 'invalid', password: '123456' },
      {
        email: 'required|email',
        password: 'required|min:6'
      }
    )

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].field).toBe('email')
  })

  it('should handle nested field validation', async () => {
    const result = await validate(
      { user: { email: 'test@test.com', name: 'John' } },
      {
        'user.email': 'required|email',
        'user.name': 'required'
      }
    )

    expect(result.valid).toBe(true)
    expect(result.data).toEqual({
      user: { email: 'test@test.com', name: 'John' }
    })
  })

  it('should reconstruct nested objects', async () => {
    const result = await validate(
      { 'user.email': 'test@test.com', 'user.name': 'John' },
      {
        'user.email': 'required|email',
        'user.name': 'required'
      }
    )

    expect(result.valid).toBe(true)
    expect(result.data).toEqual({
      user: { email: 'test@test.com', name: 'John' }
    })
  })

  it('should strip extra fields', async () => {
    const result = await validate(
      { email: 'test@test.com', password: '123456', isAdmin: true },
      {
        email: 'required|email',
        password: 'required'
      }
    )

    expect(result.valid).toBe(true)
    expect(result.data).toEqual({ email: 'test@test.com', password: '123456' })
    expect(result.data.isAdmin).toBeUndefined()
  })

  it('should handle nullable fields', async () => {
    const result = await validate(
      { email: 'test@test.com', phone: null },
      {
        email: 'required|email',
        phone: 'nullable|string'
      }
    )

    expect(result.valid).toBe(true)
  })

  it('should throw error on unknown rule', async () => {
    await expect(
      validate(
        { email: 'test@test.com' },
        { email: 'required|unknown_rule' }
      )
    ).rejects.toThrow('Unknown validation rule: unknown_rule')
  })

  it('should use custom messages', async () => {
    const result = await validate(
      { email: '' },
      { email: 'required|email' },
      { messages: { 'email.required': 'Custom error message' } }
    )

    expect(result.valid).toBe(false)
    expect(result.errors[0].message).toBe('Custom error message')
  })

  it('should support custom attribute names', async () => {
    const result = await validate(
      { email: '' },
      { email: 'required' },
      { attributes: { email: 'email address' } }
    )

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('email address')
  })

  it('should support async custom rules', async () => {
    extend('exists', async (value: any) => {
      // Simulate async database check
      await new Promise((resolve) => setTimeout(resolve, 10))
      return value === 'exists@example.com'
    })

    const result = await validate(
      { email: 'exists@example.com' },
      { email: 'exists' }
    )

    expect(result.valid).toBe(true)
    expect(result.data).toEqual({ email: 'exists@example.com' })
  })

  it('should fail async custom rules', async () => {
    extend('exists', async (value: any) => {
      // Simulate async database check
      await new Promise((resolve) => setTimeout(resolve, 10))
      return value === 'exists@example.com'
    })

    const result = await validate(
      { email: 'notexists@example.com' },
      { email: 'exists' }
    )

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].field).toBe('email')
  })

  it('should handle nullable + email', async () => {
    const result = await validate(
      { email: null },
      { email: 'nullable|email' }
    )

    expect(result.valid).toBe(true)
  })

  it('should handle min for string length', async () => {
    const result = await validate(
      { name: 'ab' },
      { name: 'min:3' }
    )

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
  })

  it('should handle min for number value', async () => {
    const result = await validate(
      { age: 5 },
      { age: 'min:10' }
    )

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
  })

  it('should handle empty body', async () => {
    const result = await validate(
      {},
      { email: 'required' }
    )

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
  })

  it('should handle malformed rules', async () => {
    // Rule with invalid parameter format
    const result = await validate(
      { age: 5 },
      { age: 'min:not_a_number' }
    )

    // Should handle gracefully - rule implementation should handle this
    expect(result.valid).toBeDefined()
  })

  it('should handle multiple errors for same field', async () => {
    const result = await validate(
      { email: 'invalid' },
      { email: 'required|email|min:10' }
    )

    expect(result.valid).toBe(false)
    // Should stop at first error per field
    expect(result.errors).toHaveLength(1)
  })
})
