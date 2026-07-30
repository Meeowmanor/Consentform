import 'dotenv/config'
import { createApp } from './app.js'
import { connectDB } from './config/db.js'

const app = createApp()
const PORT = process.env.PORT || 5000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/'

async function start() {
  await connectDB(MONGODB_URI)
  app.listen(PORT, () => {
    console.log(`Consent Form API running on http://localhost:${PORT}`)
  })
}

start().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
