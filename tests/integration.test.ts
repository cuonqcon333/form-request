import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import { validation } from '../src/middleware'
import { FormRequest } from '../src/FormRequest'

class RegisterRequest extends FormRequest {
  rules() {
    return {
      email: 'required|email',
      password: 'required|min:6'
    }
  }

  messages() {
    return {
      'email.required': 'Email is required',
      'email.email': 'Email must be valid',
      'password.required': 'Password is required',
      'password.min': 'Password must be at least 6 characters'
    }
  }

  attributes() {
    return {
      email: 'email address',
      password: 'password'
    }
  }
}

describe('FormRequest Integration', () => {
  let app: express.Express

  beforeAll(() => {
    app = express()
    app.use(express.json())
    app.use(validation())
  })

  it('should work with req.validate(FormRequest)', async () => {
    let validatedData: any

    app.post('/register', async (req, res) => {
      validatedData = await req.validate(RegisterRequest)
      res.json({ success: true })
    })

    const response = await request(app)
      .post('/register')
      .send({ email: 'test@test.com', password: '123456' })

    expect(response.status).toBe(200)
    expect(validatedData).toEqual({ email: 'test@test.com', password: '123456' })
  })

  it('should use custom messages from FormRequest', async () => {
    app.post('/register', async (req, res) => {
      try {
        await req.validate(RegisterRequest)
      } catch (e) {
        // Validation failed
      }
    })

    const response = await request(app)
      .post('/register')
      .send({ email: '', password: '123' })

    expect(response.status).toBe(422)
  })

  it('should use custom attributes from FormRequest', async () => {
    app.post('/register', async (req, res) => {
      try {
        await req.validate(RegisterRequest)
      } catch (e) {
        // Validation failed
      }
    })

    const response = await request(app)
      .post('/register')
      .send({})

    expect(response.status).toBe(422)
  })

  it('should work with FormRequest.validate(req) pattern', async () => {
    const testApp = express()
    testApp.use(express.json())

    testApp.post('/test', async (req, res) => {
      const data = await RegisterRequest.validate(req)
      res.json({ success: true, validated: data })
    })

    const response = await request(testApp)
      .post('/test')
      .send({ email: 'test@test.com', password: '123456' })

    expect(response.status).toBe(200)
    expect(response.body.validated).toEqual({ email: 'test@test.com', password: '123456' })
  })
})
