import 'dotenv/config'
import { createApp } from './app.js'
import { connectDB } from './config/db.js'

const app = createApp()
const PORT = process.env.PORT || 5000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Meeow_Manor'

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
