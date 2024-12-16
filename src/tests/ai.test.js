import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5137';

async function testAI() {
  try {
    console.log('\nStarting AI functionality tests...');

    // Test 1: Basic AI Response 
    // Notes - responses better than ChatGPT 4o but much worse than Claude
    // Pro - message generation is free :D
    console.log('\n1. Testing basic AI response...');
    const response = await fetch(`${BASE_URL}/debug/ai-test`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('\nTest Messages:', result.testMessages);
    console.log('\nAI Response:', result.aiResponse);
    
    if (!result.aiResponse) {
      throw new Error('AI did not provide a response');
    }
    
    if (!result.success) {
      throw new Error('AI test indicated failure');
    }

    console.log('\n✅ AI test passed successfully!');
    console.log('Response length:', result.aiResponse.length);
    console.log('Sample of response:', result.aiResponse.substring(0, 100));

  } catch (error) {
    console.error('\n❌ AI test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

testAI(); 