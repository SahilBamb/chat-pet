const api = {
  sendMessage: async (url, message) => {
    const response = await fetch(`${url}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    return response.json();
  },

}; 