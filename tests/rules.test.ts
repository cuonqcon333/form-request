import { describe, it, expect } from 'vitest'
import { required, nullable, string, number, integer, boolean, array, object, email, min, max, same, confirmed } from '../src/rules'

describe('Rules', () => {
  describe('required', () => {
    it('should pass when value is present', () => {
      expect(required('test')).toBe(true)
      expect(required(123)).toBe(true)
    })

    it('should fail when value is empty', () => {
      expect(required('')).toBe(false)
      expect(required(null)).toBe(false)
      expect(required(undefined)).toBe(false)
    })
  })

  describe('nullable', () => {
    it('should pass when value is null or undefined', () => {
      expect(nullable(null)).toBe(true)
      expect(nullable(undefined)).toBe(true)
    })

    it('should fail when value is present', () => {
      expect(nullable('test')).toBe(false)
      expect(nullable(123)).toBe(false)
    })
  })

  describe('string', () => {
    it('should pass for strings', () => {
      expect(string('test')).toBe(true)
    })

    it('should fail for non-strings', () => {
      expect(string(123)).toBe(false)
      expect(string(null)).toBe(false)
    })
  })

  describe('number', () => {
    it('should pass for numbers', () => {
      expect(number(123)).toBe(true)
      expect(number(1.5)).toBe(true)
    })

    it('should fail for non-numbers', () => {
      expect(number('123')).toBe(false)
      expect(number(NaN)).toBe(false)
    })
  })

  describe('integer', () => {
    it('should pass for integers', () => {
      expect(integer(123)).toBe(true)
    })

    it('should fail for non-integers', () => {
      expect(integer(1.5)).toBe(false)
      expect(integer('123')).toBe(false)
    })
  })

  describe('boolean', () => {
    it('should pass for booleans', () => {
      expect(boolean(true)).toBe(true)
      expect(boolean(false)).toBe(true)
    })

    it('should fail for non-booleans', () => {
      expect(boolean('true')).toBe(false)
      expect(boolean(1)).toBe(false)
    })
  })

  describe('array', () => {
    it('should pass for arrays', () => {
      expect(array([1, 2, 3])).toBe(true)
    })

    it('should fail for non-arrays', () => {
      expect(array('test')).toBe(false)
      expect(array({})).toBe(false)
    })
  })

  describe('object', () => {
    it('should pass for objects', () => {
      expect(object({})).toBe(true)
      expect(object({ key: 'value' })).toBe(true)
    })

    it('should fail for non-objects', () => {
      expect(object([])).toBe(false)
      expect(object(null)).toBe(false)
    })
  })

  describe('email', () => {
    it('should pass for valid emails', () => {
      expect(email('test@test.com')).toBe(true)
      expect(email('user.name@domain.co.uk')).toBe(true)
    })

    it('should fail for invalid emails', () => {
      expect(email('invalid')).toBe(false)
      expect(email('test@')).toBe(false)
      expect(email('@test.com')).toBe(false)
    })
  })

  describe('min', () => {
    it('should check string length', () => {
      expect(min('hello', ['3'])).toBe(true)
      expect(min('hi', ['3'])).toBe(false)
    })

    it('should check number value', () => {
      expect(min(10, ['5'])).toBe(true)
      expect(min(3, ['5'])).toBe(false)
    })

    it('should check array length', () => {
      expect(min([1, 2, 3], ['2'])).toBe(true)
      expect(min([1], ['2'])).toBe(false)
    })
  })

  describe('max', () => {
    it('should check string length', () => {
      expect(max('hi', ['5'])).toBe(true)
      expect(max('hello world', ['5'])).toBe(false)
    })

    it('should check number value', () => {
      expect(max(3, ['5'])).toBe(true)
      expect(max(10, ['5'])).toBe(false)
    })

    it('should check array length', () => {
      expect(max([1], ['2'])).toBe(true)
      expect(max([1, 2, 3], ['2'])).toBe(false)
    })
  })

  describe('same', () => {
    it('should pass when values match', () => {
      expect(same('password123', ['password'], { password: 'password123' })).toBe(true)
    })

    it('should fail when values do not match', () => {
      expect(same('password123', ['password'], { password: 'different' })).toBe(false)
    })
  })

  describe('confirmed', () => {
    it('should pass when confirmation matches', () => {
      expect(confirmed('password123', ['password'], { password_confirmation: 'password123' })).toBe(true)
    })

    it('should fail when confirmation does not match', () => {
      expect(confirmed('password123', ['password'], { password_confirmation: 'different' })).toBe(false)
    })
  })
})
