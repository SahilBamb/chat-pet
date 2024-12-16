import pg from 'pg';
const { Pool } = pg;
import { Badge } from '../classes.js';

const pool = new Pool({
  user: process.env.DB_USER || 'admin',
  host: process.env.DB_HOST || 'chatpet-db',
  database: process.env.DB_NAME || 'chatpet',
  password: process.env.DB_PASSWORD || 'password',
  port: 5432,
});

export const db = {
  pool,

  async setup() {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      console.log('Dropping existing tables...');
      await client.query(`
        DROP TABLE IF EXISTS inventory CASCADE;
        DROP TABLE IF EXISTS messages CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
      `);

      console.log('Creating tables...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          score INTEGER DEFAULT 0,
          current_pet_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          user_id UUID REFERENCES users(id),
          text TEXT,
          score INTEGER DEFAULT 0,
          type VARCHAR(50) NOT NULL,
          image_id JSONB,
          shopkeeper_data JSONB,
          breeder_data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS inventory (
          id SERIAL PRIMARY KEY,
          user_id UUID REFERENCES users(id),
          item_type VARCHAR(50) NOT NULL,
          item_name VARCHAR(255) NOT NULL,
          item_data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
        CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory(user_id);
      `);

      await client.query('COMMIT');
      console.log('Database setup complete');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // User operations
  async createUser(userId, username = 'Anonymous') {
    const query = 'INSERT INTO users (id, username) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING RETURNING *';
    const result = await pool.query(query, [userId, username]);
    return result.rows[0];
  },

  // Message operations
  async saveMessage(message) {
    const query = `
      INSERT INTO messages 
      (user_id, text, type, score, image_id, shopkeeper_data, breeder_data) 
      VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb) 
      RETURNING *
    `;
    const values = [
      message.userId,
      message.text,
      message.type,
      message.score || 0,
      message.imageId ? JSON.stringify(message.imageId) : null,
      message.shopkeeper ? JSON.stringify(message.shopkeeper) : null,
      message.breeder ? JSON.stringify(message.breeder) : null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async getMessages() {
    const query = `
      SELECT m.*, u.username 
      FROM messages m 
      JOIN users u ON m.user_id = u.id 
      ORDER BY m.created_at ASC
    `;
    const result = await pool.query(query);
    return result.rows.map(row => ({
      ...row,
      userId: row.user_id,
      imageId: row.image_id,
      shopkeeper: row.shopkeeper_data,
      breeder: row.breeder_data
    }));
  },

  async updateMessageScore(messageId) {
    const query = 'UPDATE messages SET score = score + 1 WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [messageId]);
    return result.rows[0];
  },

  // Inventory operations
  async addInventoryItem(userId, item) {
    const query = `
      INSERT INTO inventory 
      (user_id, item_type, item_name, item_data) 
      VALUES ($1, $2, $3, $4::jsonb) 
      RETURNING *
    `;
    
    // Ensure item data is properly structured
    const itemData = {
      type: item.type,
      name: item.name,
      image: item.image,
      count: item.count || 1
    };

    const values = [
      userId, 
      itemData.type, 
      itemData.name, 
      JSON.stringify(itemData)
    ];

    try {
      const result = await pool.query(query, values);
      return {
        ...result.rows[0],
        ...itemData  // Include the parsed item data in the response
      };
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
  },

  async getUserInventory(userId) {
    const query = 'SELECT * FROM inventory WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    
    return result.rows.map(row => {
      try {
        const itemData = typeof row.item_data === 'string' 
          ? JSON.parse(row.item_data) 
          : row.item_data;

        // Create a new Badge instance with the data
        return new Badge({
          id: row.id,
          userId: row.user_id,
          type: itemData.type,
          name: itemData.name,
          image: itemData.image,
          count: itemData.count || 1,
          created_at: row.created_at
        });
      } catch (error) {
        console.error('Error parsing item data:', error);
        return row;
      }
    });
  },

  async updateMessage(messageId, updates) {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    const values = [messageId, ...Object.values(updates)];
    
    const query = `
      UPDATE messages 
      SET ${setClause}
      WHERE id = $1 
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async updateUserPet(userId, petName) {
    const query = `
      UPDATE users 
      SET current_pet_id = $2::varchar 
      WHERE id = $1 
      RETURNING *
    `;
    try {
      const result = await pool.query(query, [userId, petName]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user pet:', error);
      throw error;
    }
  }
}; 