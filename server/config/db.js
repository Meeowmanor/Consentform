import mongoose from 'mongoose'

const globalCache = globalThis

if (!globalCache._mongooseCache) {
  globalCache._mongooseCache = { conn: null, promise: null }
}

export async function connectDB(uri) {
  const cache = globalCache._mongooseCache

  if (cache.conn) return cache.conn

  if (!cache.promise) {
    mongoose.set('strictQuery', true)
    cache.promise = mongoose
      .connect(uri, {
        dbName: 'Meeow_Manor',
        bufferCommands: false,
      })
      .then((mongooseInstance) => {
        console.log('MongoDB connected: Meeow_Manor')
        return mongooseInstance
      })
  }

  cache.conn = await cache.promise
  return cache.conn
}
