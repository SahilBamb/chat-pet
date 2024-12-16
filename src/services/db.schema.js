import { db } from './db';

async function checkSchema() {
  try {
    const result = await db.pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'messages';
    `);
    console.log('Current message table schema:', result.rows);
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    process.exit(0);
  }
}

checkSchema(); 