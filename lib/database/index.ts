import mongoose from 'mongoose';

let cached = (global as any).mongoose || { conn: null, promise: null };

export const connectToDatabase = async () => {
  const MONGODB_URI = process.env.MONGODB_URI; // <- move inside the function

  if (!MONGODB_URI) throw new Error('MONGODB_URI is missing');

  if (cached.conn) return cached.conn;

  cached.promise = cached.promise || mongoose.connect(MONGODB_URI, {
    dbName: 'FindYourAlley',
    bufferCommands: false,
    connectTimeoutMS: 5000,
  });

  cached.conn = await cached.promise;
  return cached.conn;
};