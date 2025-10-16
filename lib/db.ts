import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_RGkMFvA1IBO9@ep-little-rain-ag18ph4g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
});

export const createMessagesTable = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        "sessionId" TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } finally {
    client.release();
  }
};

export default pool;