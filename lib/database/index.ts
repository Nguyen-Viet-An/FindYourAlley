import mongoose from 'mongoose';

let cached = (global as any).mongoose || { conn: null, promise: null };
(global as any).mongoose = cached;

export const connectToDatabase = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) throw new Error('MONGODB_URI is missing');

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: 'FindYourAlley',
      bufferCommands: false,
      connectTimeoutMS: 5000,
      maxPoolSize: 10,
    }).then((conn) => {
      cached.conn = conn;
      return conn;
    }).catch((err) => {
      // Reset so next call retries instead of reusing a failed promise
      cached.promise = null;
      cached.conn = null;
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};