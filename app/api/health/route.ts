import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW()');
      return NextResponse.json({ 
        status: 'ok', 
        time: result.rows[0].now,
        env: {
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          db: process.env.DB_NAME,
          ssl: process.env.DB_HOST && !process.env.DB_HOST.includes('localhost') ? 'enabled' : 'disabled'
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database health check failed:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : String(error),
        env: {
          host: process.env.DB_HOST,
          user: process.env.DB_USER
        }
      },
      { status: 500 }
    );
  }
}
