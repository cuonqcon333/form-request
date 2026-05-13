import express from 'express'
import { validation } from '../dist/middleware.js'

const app = express()
app.use(express.json())
app.use(validation())

app.post('/register', async (req, res) => {
  // Validates with nested field notation
  await req.validate({
    'user.email': 'required|email',
    'user.name': 'required',
    password: 'required|min:6'
  })

  // Returns validated data with reconstructed nested objects
  const data = req.validated()
  // data = { user: { email: '...', name: '...' }, password: '...' }

  // Return validated data to verify nested reconstruction
  res.json({ success: true, validated: data })
})

app.listen(3003, () => {
  console.log('Server running on port 3003')
})
