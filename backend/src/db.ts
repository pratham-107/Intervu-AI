import { Pool, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString: connectionString || 'postgresql://postgres:postgres@localhost:5432/intervuai',
  ssl: process.env.NODE_ENV === 'production' || connectionString?.includes('supabase.co')
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('[Database] Unexpected error on idle client', err);
});

export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  return pool.query<T>(text, params);
};

export const testConnection = async (): Promise<boolean> => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('[Database] Connected successfully at:', res.rows[0].now);
    return true;
  } catch (error: any) {
    console.warn('[Database] Warning: PostgreSQL not reachable yet. Ensure DATABASE_URL is set in .env:', error.message);
    return false;
  }
};
