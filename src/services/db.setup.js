import { db } from './db.js';

async function setup() {
  try {
    await db.setup();
    console.log('Database setup complete');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setup(); 