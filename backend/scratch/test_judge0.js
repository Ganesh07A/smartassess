const axios = require('axios');

async function testConnection() {
  try {
    console.log('Testing connection to https://ce.judge0.com/languages...');
    const response = await axios.get('https://ce.judge0.com/languages');
    console.log('Success! Status:', response.status);
    console.log('Sample language:', response.data[0]);
  } catch (error) {
    console.error('Connection failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

testConnection();
