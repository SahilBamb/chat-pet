import fetch from 'node-fetch';
import WebSocket from 'ws';

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

async function waitForServer(retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) return true;
    } catch (error) {
      console.log(`Waiting for server... (${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Server not available after retries');
}

async function testApp() {
  try {
    console.log('Starting application tests...\n');

    // Wait for server to be ready
    console.log('Checking server availability...');
    await waitForServer();
    console.log('✓ Server is ready\n');

    // 1. Test user message creation
    console.log('1. Testing user message creation...');
    try {
      const messageResponse = await fetch(`${BASE_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'usermessage',
          text: 'Test message',
          userId: TEST_USER_ID,
          imageId: {
            image: {
              avatar: '/assets/pet/nervfish.jpg'
            }
          }
        })
      });
      if (!messageResponse.ok) throw new Error(`HTTP error! status: ${messageResponse.status}`);
      const message = await messageResponse.json();
      console.log('✓ Created message:', message, '\n');

      // 2. Test message retrieval
      console.log('2. Testing message retrieval...');
      const messagesResponse = await fetch(`${BASE_URL}/messages`);
      if (!messagesResponse.ok) throw new Error(`HTTP error! status: ${messagesResponse.status}`);
      const messages = await messagesResponse.json();
      console.log('✓ Retrieved messages:', messages, '\n');

      // 3. Test voting
      console.log('3. Testing vote functionality...');
      const voteResponse = await fetch(`${BASE_URL}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: message.id
        })
      });
      if (!voteResponse.ok) throw new Error(`HTTP error! status: ${voteResponse.status}`);
      const votedMessage = await voteResponse.json();
      console.log('✓ Updated message score:', votedMessage, '\n');

      // 4. Test inventory
      console.log('4. Testing inventory management...');
      const inventoryResponse = await fetch(`${BASE_URL}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: TEST_USER_ID,
          item: {
            type: 'badge',
            name: 'kinesisGirl',
            image: '/assets/kinesisGirl.jpg'
          }
        })
      });
      if (!inventoryResponse.ok) throw new Error(`HTTP error! status: ${inventoryResponse.status}`);
      const inventoryItem = await inventoryResponse.json();
      console.log('✓ Added inventory item:', inventoryItem);

      const userInventoryResponse = await fetch(`${BASE_URL}/inventory/${TEST_USER_ID}`);
      if (!userInventoryResponse.ok) throw new Error(`HTTP error! status: ${userInventoryResponse.status}`);
      const inventory = await userInventoryResponse.json();
      console.log('✓ Retrieved inventory:', inventory, '\n');

      // 5. Test WebSocket connection
      console.log('5. Testing WebSocket connection...');
      const ws = new WebSocket(`ws://localhost:3000`);
      
      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          console.log('✓ WebSocket connection established\n');
          ws.close();
          resolve();
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          reject(error);
        };

        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
      });

      console.log('All tests completed successfully! 🎉');

    } catch (error) {
      throw new Error(`Test failed: ${error.message}`);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testApp(); 