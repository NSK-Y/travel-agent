# AI Travel Agent

An AI-powered travel planning assistant built with **Node.js/Express** and **IBM Granite 4** via **watsonx.ai**.

## Features

- 🗺️ Destination recommendations based on interests, budget, and travel style
- 📅 Day-by-day itinerary generation
- 🏨 Accommodation and transport advice
- 💡 Travel tips: visas, local customs, best time to visit
- 💰 Budget breakdowns
- 💬 Persistent conversation context across the session
- ⚡ Quick-start suggestion chips for common travel queries

## Prerequisites

- Node.js 18+
- An IBM Cloud account with a watsonx.ai project

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**

   Create a `.env` file in the project root (copy from `.env.example`):
   ```
   WATSONX_API_KEY=your_ibm_cloud_api_key
   WATSONX_PROJECT_ID=4928ce76-515f-4650-8c4a-1dfe80236903
   WATSONX_URL=https://us-south.ml.cloud.ibm.com
   WATSONX_MODEL_ID=ibm/granite-4-h-small
   PORT=3000
   ```

   > **Important:** Never commit `.env` to source control. It is already in `.gitignore`.

3. **Start the server**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## Project Structure

```
travel-agent/
├── public/
│   └── index.html      # Frontend UI (single-page chat interface)
├── server.js           # Express server + watsonx.ai integration
├── package.json
├── .env.example        # Environment variable template
└── README.md
```

## API

### `POST /api/chat`

Send a conversation to the Granite model.

**Request body:**
```json
{
  "messages": [
    { "role": "user", "content": "Plan a 7-day trip to Japan" }
  ]
}
```

**Response:**
```json
{
  "reply": "Great choice! Here's a 7-day Japan itinerary..."
}
```

## How it works

1. The frontend maintains a local conversation `history` array.
2. On each message, the full history is sent to `POST /api/chat`.
3. The server fetches an IAM token from IBM Cloud (cached for performance), then calls the watsonx.ai `/ml/v1/text/chat` endpoint with the Granite model.
4. The assistant reply is appended to history and rendered in the chat UI.
