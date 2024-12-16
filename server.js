import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws'; 
import fs from 'fs';
import { db } from './src/services/db.js';
import cors from 'cors';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const app = express();

// Add CORS middleware
app.use(cors({
  origin: 'http://localhost:5173', // Allow requests from Vite dev server
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));

let messages = [];

const configPath = path.join(__dirname, 'src', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const wss = new WebSocketServer({ noServer: true });

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-pro",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
};

async function getAIResponse(recentMessages) {
  try {
    // Format recent messages for context
    const context = recentMessages
      .filter(msg => msg.type === 'usermessage')
      .map(msg => msg.text)
      .join('\n');

    const prompt = `You are a friendly AI in a chat room game where you get points for sending and voting on messages.
    Recent messages from users:\n${context}\n
    Please provide a very brief, friendly response that engages with what the users are discussing. 
    Your message should be the same length as the messages and match the tone as well`;

    // Use generateContent instead of chatSession
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting AI response:', error);
    return null;
  }
}

function broadcastMessages() {
  const data = JSON.stringify({ type: 'update', data: messages });
  
  if (wss.clients && wss.clients.size > 0) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
}

function createNewShopkeeper(configPath) {
  return JSON.parse(JSON.stringify(configPath));
}

function createRandomBreeder(configPath) {
  const breederTypes = Object.keys(configPath.breeder);
  
  const selectedBreederType = breederTypes[Math.floor(Math.random() * breederTypes.length)];
  const selectedBreeder = configPath.breeder[selectedBreederType];
  
  const breeder = { ...selectedBreeder };
  
  const availablePets = [...selectedBreeder.petInventory];
  const newPetInventory = [];
  
  // Always add first pet
  const firstPet = availablePets[Math.floor(Math.random() * availablePets.length)];
  newPetInventory.push(firstPet);
  
  if (Math.random() < 0.5) {
    const secondPet = availablePets[Math.floor(Math.random() * availablePets.length)];
    newPetInventory.push(secondPet);
  }
  
  newPetInventory.sort(() => Math.random() - 0.5);
  
  return {
    ...breeder,
    petInventory: newPetInventory
  };
}

async function hasRecentMessages() {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentMessages = await db.getMessages();
    
    // Filter messages from last 10 minutes that are user messages
    const recentUserMessages = recentMessages.filter(msg => 
      msg.type === 'usermessage' && 
      new Date(msg.created_at) > tenMinutesAgo
    );

    return recentUserMessages.length >= 3;
  } catch (error) {
    console.error('Error checking recent messages:', error);
    return false;
  }
}

function getRandomAIAvatar(configPath) {
  const aiTypes = Object.keys(configPath.ai);
  
  const selectedAIType = aiTypes[Math.floor(Math.random() * aiTypes.length)];
  
  return configPath.ai[selectedAIType].avatar;
}

async function addMessage() {
  try {
    console.log('Adding system message...');
    const systemUserId = '00000000-0000-0000-0000-000000000000';
    
    await db.createUser(systemUserId, 'System');

    // Check if we have enough recent messages for AI response
    const hasEnoughRecentMessages = await hasRecentMessages();

    // Random choice between shopkeeper, breeder, or AI message
    const rand = Math.random();
    
    if (rand < 0.5) {
      await db.saveMessage({
        userId: systemUserId,
        type: 'shopkeepermessage',
        shopkeeper: createNewShopkeeper(config.shopkeeper.bubble)
      });
    } else if (rand < 0.9) {
      await db.saveMessage({
        userId: systemUserId,
        type: 'breedermessage',
        breeder: createRandomBreeder(config)
      });
    } else {
      // Only proceed with AI message if we have enough recent messages
      const recentMessages = await db.getMessages(0, 5);
      const aiResponse = await getAIResponse(recentMessages);
      if (aiResponse) {
        await db.saveMessage({
          userId: systemUserId,
          type: 'aimessage',
          text: aiResponse,
          imageId: {
            image: {
              avatar: getRandomAIAvatar(config)
            }
          }
        });
      }
    }

    const messages = await db.getMessages();
    console.log('Broadcasting updated messages:', messages.length);
    broadcast({ type: 'update', data: messages });
  } catch (error) {
    console.error('Error adding system message:', error);
  }
}

const MESSAGE_INTERVAL = process.env.MESSAGE_INTERVAL || 600000;  // Default to 10 minutes
setInterval(addMessage, MESSAGE_INTERVAL);

wss.on('connection', async (ws) => {
  console.log('New WebSocket connection');
  try {
    const messages = await db.getMessages();
    console.log('Sending initial messages:', messages.length);
    ws.send(JSON.stringify({ type: 'init', data: messages }));
  } catch (error) {
    console.error('Error sending initial messages:', error);
  }

  ws.on('message', (message) => {
    console.log('received:', message);
  });
});

console.log('WebSocket server is running');

const broadcast = (data) => {
  console.log('Broadcasting data:', data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

app.post('/buy', async (req, res) => {
  try {
    const { itemIndex, messageId, userId } = req.body;

    // n ote:  We need to make sure user exsits... or it will throw an error 
    await db.createUser(userId);

    const messages = await db.getMessages();
    const message = messages.find(m => m.id === messageId && m.type === 'shopkeepermessage');
    
    if (!message) {
      return res.status(404).json({ error: 'Shopkeeper message not found' });
    }

    const item = message.shopkeeper_data.storeInventory[itemIndex];
    if (!item) {
      return res.status(404).json({ error: 'Item not found in store inventory' });
    }

    const inventoryItem = await db.addInventoryItem(userId, {
      type: 'badge',  
      name: item,
      image: item,   
      count: 1
    });

    const updatedShopkeeper = {
      ...message.shopkeeper_data,
      storeInventory: message.shopkeeper_data.storeInventory.filter((_, i) => i !== itemIndex)
    };

    await db.updateMessage(messageId, { shopkeeper_data: updatedShopkeeper });

    const updatedMessages = await db.getMessages();
    broadcast({ type: 'update', data: updatedMessages });

    res.status(200).json({ item: inventoryItem });
  } catch (error) {
    console.error('Error processing purchase:', error);
    res.status(500).json({ error: 'Failed to process purchase' });
  }
});

app.post('/adopt', async (req, res) => {
  try {
    const { index, messageId, userId } = req.body;

    await db.createUser(userId);

    const messages = await db.getMessages();
    const message = messages.find(m => m.id === messageId && m.type === 'breedermessage');
    
    if (!message) {
      return res.status(404).json({ error: 'Breeder message not found' });
    }

    const petName = message.breeder_data.petInventory[index];
    if (!petName) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    await db.updateUserPet(userId, petName);

    const updatedBreeder = {
      ...message.breeder_data,
      petInventory: message.breeder_data.petInventory.filter((_, i) => i !== index)
    };

    await db.updateMessage(messageId, { breeder_data: updatedBreeder });

    const updatedMessages = await db.getMessages();
    broadcast({ type: 'update', data: updatedMessages });

    res.status(200).json({ petName });
  } catch (error) {
    console.error('Error processing adoption:', error);
    res.status(500).json({ error: 'Failed to process adoption' });
  }
});


app.post('/messages', async (req, res) => {
  try {
    await db.createUser(req.body.userId);

    const message = await db.saveMessage({
      userId: req.body.userId,
      text: req.body.text,
      type: req.body.type || 'usermessage',
      score: 0,
      imageId: req.body.imageId
    });

    const messages = await db.getMessages();
    broadcast({ type: 'update', data: messages });
    res.status(201).json(message);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

app.get('/messages', async (req, res) => {
  try {
    const messages = await db.getMessages();
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/vote', async (req, res) => {
  try {
    const updatedMessage = await db.updateMessageScore(req.body.messageId);
    const messages = await db.getMessages();
    broadcast({ type: 'update', data: messages });
    res.json(updatedMessage);
  } catch (error) {
    console.error('Error updating vote:', error);
    res.status(500).json({ error: 'Failed to update vote' });
  }
});

app.post('/inventory', async (req, res) => {
  try {
    const item = await db.addInventoryItem(req.body.userId, req.body.item);
    res.status(201).json(item);
  } catch (error) {
    console.error('Error adding inventory item:', error);
    res.status(500).json({ error: 'Failed to add inventory item' });
  }
});

app.get('/inventory/:userId', async (req, res) => {
  try {
    const inventory = await db.getUserInventory(req.params.userId);
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

app.get('/debug/messages', async (req, res) => {
  try {
    const messages = await db.getMessages();
    const debugInfo = messages.map(msg => ({
      id: msg.id,
      userId: msg.user_id,
      type: msg.type,
      text: msg.text?.substring(0, 20) // First 20 chars of message
    }));
    res.json(debugInfo);
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ error: 'Debug endpoint failed' });
  }
});

app.get('/debug/users', async (req, res) => {
  try {
    const users = await db.pool.query('SELECT * FROM users');
    const messages = await db.pool.query('SELECT * FROM messages');
    res.json({
      users: users.rows,
      messages: messages.rows
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ error: 'Debug failed' });
  }
});

app.get('/debug/ai-test', async (req, res) => {
  try {
 
    const testMessages = [
      { type: 'usermessage', text: 'Hello everyone!' },
      { type: 'usermessage', text: 'I just got a new pet dragon!' },
      { type: 'usermessage', text: 'It breathes rainbow flames!' }
    ];

    console.log('Testing AI response with messages:', testMessages);
    
    const aiResponse = await getAIResponse(testMessages);
    
    res.json({
      testMessages,
      aiResponse,
      success: !!aiResponse
    });
  } catch (error) {
    console.error('AI test endpoint error:', error);
    res.status(500).json({ 
      error: 'AI test failed',
      details: error.message,
      stack: error.stack
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});