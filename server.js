require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const WATSONX_URL = process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com';
const WATSONX_API_KEY = process.env.WATSONX_API_KEY;
const WATSONX_PROJECT_ID = process.env.WATSONX_PROJECT_ID;
const WATSONX_MODEL_ID = process.env.WATSONX_MODEL_ID || 'ibm/granite-4-h-small';

// Cache IAM token to avoid re-fetching on every request
let iamToken = null;
let iamTokenExpiry = 0;

async function getIAMToken() {
  const now = Date.now();
  if (iamToken && now < iamTokenExpiry) {
    return iamToken;
  }
  const response = await axios.post(
    'https://iam.cloud.ibm.com/identity/token',
    new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: WATSONX_API_KEY,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  iamToken = response.data.access_token;
  // Expire 5 minutes before actual expiry for safety
  iamTokenExpiry = now + (response.data.expires_in - 300) * 1000;
  return iamToken;
}

// System prompt for the travel agent
const SYSTEM_PROMPT = `You are an expert AI travel agent. Your job is to help users plan their perfect trip.
You provide:
- Destination recommendations based on interests, budget, and travel style
- Day-by-day itinerary suggestions
- Best time to visit advice
- Accommodation options (budget, mid-range, luxury)
- Must-see attractions, local cuisine, and hidden gems
- Travel tips: visa requirements, currency, local customs, safety
- Transportation advice (flights, trains, local transit)
- Estimated budget breakdowns

Always be friendly, enthusiastic, and thorough. Ask clarifying questions when needed to give personalised recommendations.`;

// POST /api/chat — sends messages to watsonx.ai Granite model
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  if (!WATSONX_API_KEY) {
    return res.status(500).json({ error: 'WATSONX_API_KEY is not configured' });
  }

  try {
    const token = await getIAMToken();

    const payload = {
      model_id: WATSONX_MODEL_ID,
      project_id: WATSONX_PROJECT_ID,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      parameters: {
        max_new_tokens: 1024,
        temperature: 0.7,
        top_p: 0.9,
      },
    };

    const response = await axios.post(
      `${WATSONX_URL}/ml/v1/text/chat?version=2023-05-29`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const reply = response.data.choices?.[0]?.message?.content ?? 'No response received.';
    res.json({ reply });
  } catch (err) {
    const errMsg = err.response?.data?.errors?.[0]?.message || err.message;
    console.error('watsonx.ai error:', errMsg);
    res.status(500).json({ error: errMsg });
  }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✈️  Travel Agent running at http://localhost:${PORT}`);
});
