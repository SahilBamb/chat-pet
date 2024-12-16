import { useState, useCallback } from 'react';

function useMessages(url, userId) {
  const [messages, setMessages] = useState([]);
  
  const addMessage = useCallback((message) => {
  
  }, [url]);

  const incrementScore = useCallback((index) => {
  }, [url]);

  return { messages, addMessage, incrementScore };
} 