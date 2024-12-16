import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = 'AIzaSyDgx3NBP3alXev3-3W0GEjijUm9hA5BgYk';
const genAI = new GoogleGenerativeAI(apiKey);

async function testGemini() {
  try {
    // Use gemini-pro instead of gemini-2.0-flash-exp
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `You are a friendly AI in a chat room game where you get points for sending and voting on messages. 
    Recent messages from users:
    User1: Hello everyone!
    User2: I just got a new pet dragon!
    User3: This game is fun 
    
    Please provide a very brief, friendly response that engages with what the users are discussing. 
    Your message should be the same length as the messages and match the tone as well.`;

    console.log('Sending prompt to Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('\nPrompt:', prompt);
    console.log('\nResponse:', text);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

testGemini(); 