const axios = require('axios');

async function testError() {
  try {
    // Send a malformed register request or similar that triggers Zod
    // Actually, I can just hit the syncQuestions endpoint with garbage
    const res = await axios.put('http://localhost:5000/api/teacher/exams/invalid-id/questions', [
        { type: 'MCQ', text: 'hi' } // Too short text, should trigger Zod
    ], {
        headers: { Authorization: 'Bearer invalid-token' }
    });
    console.log(res.data);
  } catch (err) {
    if (err.response) {
      console.log('Status:', err.response.status);
      console.log('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
}

testError();
