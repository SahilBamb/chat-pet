import { fileURLToPath } from 'url';
import { db } from '../services/db.js';

async function initializeDB(shouldClear = false) {
  try {
    if (shouldClear) {
      console.log('Clearing existing tables...');
      await db.pool.query('DROP TABLE IF EXISTS messages CASCADE');
      await db.pool.query('DROP TABLE IF EXISTS users CASCADE');
      await db.pool.query('DROP TABLE IF EXISTS inventory CASCADE');
    }

    console.log('Creating tables if they don\'t exist...');
    
    // Create users table
    await db.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255),
        current_pet VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create messages table
    await db.pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id),
        type VARCHAR(50),
        text TEXT,
        score INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        shopkeeper_data JSONB,
        breeder_data JSONB,
        image_id JSONB
      )
    `);

    // Create inventory table - if we want persistent inventory uncomment this
    // Currently stable 
    await db.pool.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id),
        item_type VARCHAR(50),
        item_name VARCHAR(255),
        item_image VARCHAR(255),
        count INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialization complete');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// If this script is run directly (not imported) 
// this code will check it // double check if this code will check it todo
if (import.meta.url === fileURLToPath(import.meta.url)) {
  const shouldClear = process.argv.includes('--clear');
  initializeDB(shouldClear)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { initializeDB }; 