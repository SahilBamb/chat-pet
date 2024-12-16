import { db } from '../services/db';
import { v4 as uuidv4 } from 'uuid';

async function testDatabaseIntegration() {
  try {
    console.log('Starting database integration test...\n');

    // 1. Setup database
    console.log('1. Setting up database...');
    await db.setup();
    console.log('✓ Database setup complete\n');

    // 2. Create test user
    const testUserId = uuidv4();
    console.log('2. Creating test user...');
    const user = await db.createUser(testUserId, 'TestUser');
    console.log('✓ Created user:', user, '\n');

    // 3. Create system user
    console.log('3. Creating system user...');
    const systemUser = await db.createUser('00000000-0000-0000-0000-000000000000', 'System');
    console.log('✓ Created system user:', systemUser, '\n');

    // 4. Test user message
    console.log('4. Creating user message...');
    const userMessage = await db.saveMessage({
      userId: testUserId,
      text: 'Hello, world!',
      type: 'usermessage',
      score: 0,
      imageId: {
        image: {
          avatar: '/assets/pet/nervfish.jpg'
        }
      }
    });
    console.log('✓ Created user message:', userMessage, '\n');

    // 5. Test shopkeeper message
    console.log('5. Creating shopkeeper message...');
    const shopkeeperMessage = await db.saveMessage({
      userId: systemUser.id,
      type: 'shopkeepermessage',
      shopkeeper: {
        avatar: '/assets/shopkeeper/bubbleshopkeeper.png',
        storeInventory: ['jar', 'jar'],
        messageColor: 'brown'
      }
    });
    console.log('✓ Created shopkeeper message:', shopkeeperMessage, '\n');

    // 6. Test breeder message
    console.log('6. Creating breeder message...');
    const breederMessage = await db.saveMessage({
      userId: systemUser.id,
      type: 'breedermessage',
      breeder: {
        avatar: '/assets/breeder/traveler.png',
        petInventory: ['draco'],
        messageColor: 'teal'
      }
    });
    console.log('✓ Created breeder message:', breederMessage, '\n');

    // 7. Test message retrieval
    console.log('7. Retrieving all messages...');
    const messages = await db.getMessages();
    console.log('✓ Retrieved messages:', messages, '\n');

    // 8. Test voting
    console.log('8. Testing vote functionality...');
    const updatedMessage = await db.updateMessageScore(userMessage.id);
    console.log('✓ Updated message score:', updatedMessage, '\n');

    // 9. Test inventory
    console.log('9. Testing inventory functionality...');
    const inventoryItem = await db.addInventoryItem(testUserId, {
      type: 'badge',
      name: 'kinesisGirl',
      image: '/assets/kinesisGirl.jpg'
    });
    console.log('✓ Added inventory item:', inventoryItem);

    const inventory = await db.getUserInventory(testUserId);
    console.log('✓ Retrieved inventory:', inventory, '\n');

    // 10. Test message update (for shop purchases)
    console.log('10. Testing message update...');
    const updatedShopkeeper = {
      ...shopkeeperMessage.shopkeeper_data,
      storeInventory: ['jar']
    };
    const updatedShopMessage = await db.updateMessage(shopkeeperMessage.id, {
      shopkeeper_data: updatedShopkeeper
    });
    console.log('✓ Updated shopkeeper message:', updatedShopMessage, '\n');

    console.log('All tests completed successfully! 🎉');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

testDatabaseIntegration(); 