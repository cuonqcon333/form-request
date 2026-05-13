import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import { validation } from '../src/middleware'
import { FormRequest } from '../src/FormRequest'

class TestFormRequest extends FormRequest {
  rules() {
    return {
      email: 'required|email',
      password: 'required|min:6'
    }
  }

  messages() {
    return {
      'email.required': 'Email is required'
    }
  }
}

describe('Middleware', () => {
  it('should attach validate and validated methods to request', async () => {
    const app = express()
    app.use(express.json())
    app.use(validation())

    app.post('/test', async (req, res) => {
      expect(typeof req.validate).toBe('function')
      expect(typeof req.validated).toBe('function')
      res.json({ success: true })
    })

    const response = await request(app)
      .post('/test')
      .send({ email: 'test@test.com', password: '123456' })

    expect(response.status).toBe(200)
  })

  it('should validate inline rules and return data', async () => {
    const app = express()
    app.use(express.json())
    app.use(validation())

    let validatedData: any

    app.post('/test', async (req, res) => {
      validatedData = await req.validate({
        email: 'required|email',
        password: 'required|min:6'
      })
      res.json({ success: true })
    })

    const response = await request(app)
      .post('/test')
      .send({ email: 'test@test.com', password: '123456' })

    expect(response.status).toBe(200)
    expect(validatedData).toEqual({ email: 'test@test.com', password: '123456' })
  })

  it('should validate FormRequest class', async () => {
    const app = express()
    app.use(express.json())
    app.use(validation())

    let validatedData: any

    app.post('/test', async (req, res) => {
      validatedData = await req.validate(TestFormRequest)
      res.json({ success: true })
    })

    const response = await request(app)
      .post('/test')
      .send({ email: 'test@test.com', password: '123456' })

    expect(response.status).toBe(200)
    expect(validatedData).toEqual({ email: 'test@test.com', password: '123456' })
  })

  it('should return validated data via req.validated()', async () => {
    const app = express()
    app.use(express.json())
    app.use(validation())

    let validatedData: any

    app.post('/test', async (req, res) => {
      await req.validate({
        email: 'required|email',
        password: 'required|min:6'
      })
      validatedData = req.validated()
      res.json({ success: true })
    })

    const response = await request(app)
      .post('/test')
      .send({ email: 'test@test.com', password: '123456' })

    expect(response.status).toBe(200)
    expect(validatedData).toEqual({ email: 'test@test.com', password: '123456' })
  })

  it('should send 422 on validation failure', async () => {
    const app = express()
    app.use(express.json())
    app.use(validation())

    app.post('/test', async (req, res) => {
      await req.validate({
        email: 'required|email',
        password: 'required|min:6'
      })
      res.json({ success: true })
    })

    const response = await request(app)
      .post('/test')
      .send({ email: 'invalid', password: '123' })

    expect(response.status).toBe(422)
    expect(response.body).toHaveProperty('errors')
  })

  it('should strip extra fields from validated data', async () => {
    const app = express()
    app.use(express.json())
    app.use(validation())

    let validatedData: any

    app.post('/test', async (req, res) => {
      await req.validate({
        email: 'required|email',
        password: 'required'
      })
      validatedData = req.validated()
      res.json({ success: true })
    })

    const response = await request(app)
      .post('/test')
      .send({ email: 'test@test.com', password: '123456', isAdmin: true })

    expect(response.status).toBe(200)
    expect(validatedData).toEqual({ email: 'test@test.com', password: '123456' })
    expect(validatedData.isAdmin).toBeUndefined()
  })

  it('should support custom attribute names', async () => {
    const app = express()
    app.use(express.json())
    app.use(validation())

    app.post('/test', async (req, res) => {
      await req.validate(
        { email: 'required' },
        { attributes: { email: 'email address' } }
      )
      res.json({ success: true })
    })

    const response = await request(app)
      .post('/test')
      .send({})

    expect(response.status).toBe(422)
  })

  it('should handle concurrent requests without data leaking', async () => {
    const app = express()
    app.use(express.json())
    app.use(validation())

    app.post('/test', async (req, res) => {
      const validatedData = await req.validate({
        email: 'required|email',
        password: 'required|min:6'
      })
      res.json({ success: true, validated: validatedData })
    })

    // Send 5 concurrent requests with different data
    const requests = Array.from({ length: 5 }, (_, i) =>
      request(app)
        .post('/test')
        .send({ email: `user${i}@test.com`, password: `password${i}` })
    )

    const responses = await Promise.all(requests)

    expect(responses).toHaveLength(5)

    // Verify each response has correct data (no data leaking)
    const validatedEmails = responses.map(r => r.body.validated.email)
    const validatedPasswords = responses.map(r => r.body.validated.password)

    // All emails should be unique (no leaking)
    expect(new Set(validatedEmails).size).toBe(5)
    // All passwords should be unique (no leaking)
    expect(new Set(validatedPasswords).size).toBe(5)

    // Each response should have correct data
    responses.forEach((response) => {
      const emailNum = response.body.validated.email.replace('user', '').replace('@test.com', '')
      const passwordNum = response.body.validated.password.replace('password', '')
      expect(response.body.validated.email).toBe(`user${emailNum}@test.com`)
      expect(response.body.validated.password).toBe(`password${passwordNum}`)
    })
  })
})
