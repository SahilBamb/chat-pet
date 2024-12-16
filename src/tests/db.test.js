import { db } from '../services/db';
import { v4 as uuidv4 } from 'uuid';

async function testConnection() {
  try {
    const testUserId = uuidv4();
    console.log('Testing with UUID:', testUserId);

    const user = await db.createUser(testUserId, 'TestUser');
    console.log('Created user:', user);

    const message = await db.saveMessage({
      userId: testUserId,
      text: 'Test message',
      type: 'usermessage',
      score: 0,
      imageId: {
        image: {
          avatar: '/assets/pet/nervfish.jpg'
        }
      }
    });
    console.log('Created message:', message);

    const messages = await db.getMessages();
    console.log('Retrieved messages:', messages);

    const inventoryItem = await db.addInventoryItem(testUserId, {
      type: 'badge',
      name: 'kinesisGirl',
      image: '/assets/kinesisGirl.jpg'
    });
    console.log('Added inventory item:', inventoryItem);

    const inventory = await db.getUserInventory(testUserId);
    console.log('Retrieved inventory:', inventory);

    console.log('Database connection test successful!');
  } catch (error) {
    console.error('Database test failed:', error);
    console.error('Error details:', error.message);
  } finally {
    process.exit(0);
  }
}

testConnection(); 