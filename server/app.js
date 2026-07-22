import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db.js'
import consentFormsRouter from './routes/consentForms.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Meeow_Manor'

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*'

function buildCorsOrigin() {
  if (!CLIENT_ORIGIN || CLIENT_ORIGIN === '*') return true
  return CLIENT_ORIGIN.split(',').map((item) => item.trim()).filter(Boolean)
}

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: buildCorsOrigin(),
    }),
  )
  app.use(express.json({ limit: '2mb' }))

  app.use(async (_req, _res, next) => {
    try {
      await connectDB(MONGODB_URI)
      next()
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, database: 'Meeow_Manor' })
  })

  app.use('/api/consent-forms', consentFormsRouter)

  app.use((err, _req, res, _next) => {
    console.error(err)
    res.status(500).json({ message: 'Unexpected server error.' })
  })

  return app
}
