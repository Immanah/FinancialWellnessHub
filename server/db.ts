import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const defaultDbUrl = 'postgresql://postgres:postgres@localhost:5432/bloombank';
const dbUrl = process.env.DATABASE_URL || defaultDbUrl;

export const pool = new Pool({ connectionString: dbUrl });
export const db = drizzle(pool, { schema });
