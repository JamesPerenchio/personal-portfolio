// This file goes in: netlify/functions/gemini.js

const fetch = require('node-fetch');

exports.handler = async function (event) {
  // Only allow POST requests.
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Get the secret API key from the Netlify environment variables.
  const apiKey = process.env.GEMINI_API_KEY;

  // Immediately check if the API key is missing and return a specific error.
  if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable not set.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server configuration error: API key is missing." }),
    };
  }
  
  try {
    const { userMessage, resumeContext } = JSON.parse(event.body);

    const prompt = `You are a helpful and professional AI assistant for James Perenchio. Your knowledge is strictly limited to the information in the "CONTEXT" section below. Answer the user's question conversationally, as if you already know this information. Do not mention the word "context" or "information provided". Refer to him as "James". For team projects where his specific role isn't detailed, describe the project's success and the technologies used, framing his contribution as an integral part of the collaborative team effort. If the question is completely unrelated to his professional life, politely state that you can only answer questions about James's profile. CONTEXT: ${resumeContext}. QUESTION: ${userMessage}`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
        console.error('Gemini API Error:', result);
        throw new Error(result.error ? result.error.message : "An error occurred with the Gemini API.");
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Serverless function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
