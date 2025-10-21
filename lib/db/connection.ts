import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;
const MONGODB_DB = process.env.MONGODB_DB as string | undefined;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not set');
}

declare global {
// eslint-disable-next-line no-var
var mongooseConn:
| { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
| undefined;
}

if (!global.mongooseConn) {
global.mongooseConn = { conn: null, promise: null };
}

export async function connectToDatabase() {
const cached = global.mongooseConn!;
if (cached.conn) return cached.conn;

if (!cached.promise) {
  const opts: mongoose.ConnectOptions = {
    bufferCommands: false,
    // Optional: serverSelectionTimeoutMS: 5000,
  };
  // If a db name is provided separately, honor it to avoid defaulting to 'test'
  if (MONGODB_DB) {
    (opts as any).dbName = MONGODB_DB;
  }
  cached.promise = mongoose.connect(MONGODB_URI, opts);
}

cached.conn = await cached.promise;
return cached.conn;
}
