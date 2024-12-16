import { db } from '../services/db.js';

async function inspectDatabase() {
  try {
    console.log('\n=== Database Inspection ===\n');

    console.log('Users:');
    const users = await db.pool.query('SELECT * FROM users');
    console.table(users.rows);

    console.log('\nMessages:');
    const messages = await db.pool.query(`
      SELECT m.*, u.username 
      FROM messages m 
      JOIN users u ON m.user_id = u.id 
      ORDER BY m.created_at DESC
    `);
    console.table(messages.rows);

    // Check inventory - bug is happening here (I think?)
    console.log('\nInventory:');
    console.log('\nInventory:');
    const inventory = await db.pool.query('SELECT * FROM inventory');
    console.table(inventory.rows);

  } catch (error) {
    console.error('Error inspecting database:', error);
  } finally {
    process.exit(0);
  }
}

inspectDatabase(); 