import mongoose from "mongoose";
import dns from "dns";

// Ensure DNS SRV lookup resilience across Windows / local ISP environments
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch {
  // Ignore in runtimes where setServers is restricted
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export interface DbStatus {
  isConfigured: boolean;
  isConnected: boolean;
  dbName: string | null;
  mode: "atlas" | "dev-sandbox" | "unconfigured";
  error?: string;
}

/**
 * Returns connection health without exposing credentials
 */
export function getDatabaseStatus(): DbStatus {
  const uri = process.env.MONGODB_URI;
  const isConfigured = Boolean(uri && uri.trim().length > 0);
  const isConnected = mongoose.connection.readyState === 1;
  const dbName = mongoose.connection.name || process.env.MONGODB_DB_NAME || "codelynx";
  
  let mode: DbStatus["mode"] = "unconfigured";
  if (isConnected) {
    mode = "atlas";
  } else if (!isConfigured) {
    mode = process.env.NODE_ENV === "production" ? "unconfigured" : "dev-sandbox";
  }

  return {
    isConfigured,
    isConnected,
    dbName: isConnected ? dbName : null,
    mode,
  };
}

/**
 * Connects to MongoDB Atlas with connection pooling and caching.
 * Never logs credentials.
 */
export async function connectToDatabase(): Promise<typeof mongoose | null> {
  const rawUri = process.env.MONGODB_URI;

  if (!rawUri || rawUri.trim() === "") {
    if (process.env.NODE_ENV === "production") {
      console.error("[Database] CRITICAL: MONGODB_URI is missing in production environment.");
    }
    return null;
  }

  // Clean URI if backslash-escaped characters were pasted
  const uri = rawUri.replace(/\\:/g, ":").replace(/\\@/g, "@");

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      dbName: process.env.MONGODB_DB_NAME || "codelynx",
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((m) => {
        // Redact any credentials from stdout
        const dbName = m.connection.name || "codelynx";
        console.log(`[Database] Successfully connected to MongoDB Atlas (database: ${dbName})`);
        return m;
      })
      .catch((err) => {
        // Safe logging without credentials
        const safeError = err.message ? err.message.replace(/mongodb\+srv:\/\/[^@]+@/g, "mongodb+srv://***:***@") : "Unknown connection error";
        console.error(`[Database] Connection failure: ${safeError}`);
        cached.promise = null;
        cached.conn = null;
        throw new Error(safeError);
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch {
    cached.promise = null;
    cached.conn = null;
    return null;
  }

  return cached.conn;
}

/**
 * Strict database resolver: throws if MongoDB Atlas is required but unavailable
 */
export async function requireDatabase(): Promise<typeof mongoose> {
  const db = await connectToDatabase();
  if (!db || mongoose.connection.readyState !== 1) {
    throw new Error("Database unavailable. Live MongoDB Atlas connection is required for this operation.");
  }
  return db;
}
