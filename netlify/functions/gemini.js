// This file goes in: netlify/functions/gemini.js

// This is the server-side code that will securely call the Gemini API.
// It uses the 'node-fetch' library, which is a standard for making web requests in this environment.
const fetch = require("node-fetch");

exports.handler = async function (event, context) {
  // Only allow POST requests.
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // Get the user's message and the resume context from the incoming request.
    const { userMessage, resumeContext } = JSON.parse(event.body);

    // Get the secret API key from the Netlify environment variables.
    // This is much more secure than putting the key in the front-end code.
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API key not found.");
    }

    // Construct the final prompt with instructions for the AI.
    const prompt = `You are a helpful and professional AI assistant for James Perenchio. Your knowledge is strictly limited to the information in the "CONTEXT" section below. Answer the user's question conversationally, as if you already know this information. Do not mention the word "context" or "information provided". Refer to him as "James". For team projects where his specific role isn't detailed, describe the project's success and the technologies used, framing his contribution as an integral part of the collaborative team effort. If the question is completely unrelated to his professional life, politely state that you can only answer questions about James's profile. CONTEXT: ${resumeContext}. QUESTION: ${userMessage}`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    };

    // Make the secure call to the Gemini API from the server.
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // If the API call fails, send back an error.
      const errorBody = await response.text();
      console.error("Gemini API Error:", errorBody);
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: `Gemini API error: ${response.statusText}`,
        }),
      };
    }

    const result = await response.json();

    // Send the successful response back to the website.
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Serverless function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
