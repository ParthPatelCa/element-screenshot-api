# 📄 DOM Element Screenshot API

## 📌 Overview

This project is an API-first web service that captures screenshots of specific DOM elements from a webpage, using a URL + CSS selector. Unlike traditional screenshot APIs, this service allows developers and QA teams to extract precise portions of the page (e.g., a chart, card, or section).

## 🚀 Features

- 🎯 Capture screenshot of any DOM element (by CSS selector)
- 📱 Emulate different device viewports (mobile, tablet, desktop)
- ⏳ Optional delay before capture (wait for JS to load or animations)
- 🔐 API key authentication
- 🗂️ Store screenshots in local filesystem or cloud storage (e.g., S3)
- � Export as PNG (optionally JPG, PDF in future)
- 🧪 Future: Visual diff of same element over time
- 🔧 Optional: Slack/Webhook/Email integration

## 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | (Optional) HTML/JS single-page UI using React or plain JS |
| Backend | Node.js + Express |
| Screenshot | Puppeteer |
| Auth | API key middleware |
| Storage | Local file system (initially), later S3/GCS |
| Dev Tools | Nodemon, dotenv |
| Hosting | Render, Railway, or Vercel (API only) |

## 📁 Folder Structure

```
element-screenshot-api/
│
├── src/
│   ├── server.js          # Express API entry point
│   ├── screenshot.js      # Puppeteer logic (DOM capture)
│   ├── auth.js            # API key middleware
│   ├── config.js          # Config loader (env variables)
│   ├── utils.js           # Helper functions (e.g., filename gen)
│
├── screenshots/           # Output directory for PNGs
├── .env                   # API keys and secrets
├── .gitignore
└── package.json
```

## ⚙️ API Specification

### POST /screenshot

Capture a screenshot of a specific element on a webpage.

**Request Body (JSON):**
```json
{
  "url": "https://example.com",
  "selector": "#pricing-card",
  "viewport": {
    "width": 1280,
    "height": 720
  },
  "delay": 3000
}
```

**Headers:**
```
Authorization: Bearer <YOUR_API_KEY>
Content-Type: application/json
```

**Response:**
```json
{
  "status": "success",
  "image_url": "https://yourdomain.com/screenshots/abc123.png"
}
```

## Quick Start

## Quick Start

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file:
```env
PORT=3000
NODE_ENV=development
API_KEY=supersecurekey
```

### Run the Server

```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3000`

## 🛠️ Backend Development Guide

### 1. Setup

```bash
npm init -y
npm install express puppeteer dotenv cors
npm install --save-dev nodemon
```

### 2. Create Express Server (server.js)

- Route: POST /screenshot
- Middleware: API key validation (auth.js)
- Body: URL, CSS selector, optional delay, viewport
- Output: Save PNG locally, return URL or path

### 3. Puppeteer Script (screenshot.js)

- Launch Chromium
- Navigate to URL
- Wait for selector
- Get bounding box of element
- Capture screenshot only of that element
- Save to /screenshots/filename.png

### 4. Auth Middleware (auth.js)

- Load API keys from .env
- Validate request header
- Respond with 401 if invalid

## 🎨 Frontend (Optional)

### Goal
Provide a minimal UI to test the API interactively.

### Stack Options
- **Option 1:** Plain HTML + JS + Bootstrap
- **Option 2:** React SPA (Create React App or Vite)

### Features
- Form inputs: URL, CSS selector, delay, viewport
- Call the /screenshot API and show the result
- Copy image URL or download screenshot
- API key field

## 🔐 Authentication

Use a simple bearer token system:

**.env**
```env
API_KEY=supersecurekey
PORT=3000
```

**auth.js**
```javascript
module.exports = function checkApiKey(req, res, next) {
  const userKey = req.headers.authorization?.split(" ")[1];
  if (userKey === process.env.API_KEY) return next();
  return res.status(401).json({ error: "Unauthorized" });
};
```

## 📦 Deployment Plan

| Step | Description |
|------|-------------|
| 1️⃣ | Deploy to Render/Railway for backend API |
| 2️⃣ | Store screenshots on local disk (early), S3 later |
| 3️⃣ | Add rate limiting and logging |
| 4️⃣ | Optional: Dockerize for container use |

## 🧪 Example Use Cases

- QA teams capturing screenshots of UI components
- Agencies generating PDFs for client sections
- Devs automating regression tests
- Marketers pulling visual snippets from live sites

## ✅ Roadmap (Stretch Features)

- PDF export
- Full page + DOM element diff tool
- Email/slack report delivery
- Multi-screenshot batch API
- Upload to S3 or Dropbox

## API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### `GET /`
Get API information and available endpoints.

#### `GET /health`
Health check endpoint.

#### `POST /screenshot`
Capture a screenshot of a specific element.

**Request Body:**
```json
{
  "url": "https://example.com",
  "selector": ".my-element",
  "options": {
    "format": "png",
    "quality": 90,
    "viewport": {
      "width": 1920,
      "height": 1080
    },
    "timeout": 30000,
    "waitForSelector": true
  }
}
```

**Required Fields:**
- `url`: The webpage URL to visit
- `selector`: CSS selector for the target element

**Optional Fields:**
- `options.format`: Image format ("png" or "jpeg", default: "png")
- `options.quality`: JPEG quality 1-100 (default: 90)
- `options.viewport`: Browser viewport size
- `options.timeout`: Page load timeout in milliseconds (default: 30000)
- `options.waitForSelector`: Wait for element to appear (default: true)

**Response:**
```json
{
  "success": true,
  "filename": "screenshot-abc123-def456-2025-08-12T10-30-00.png",
  "path": "/path/to/screenshot.png",
  "size": "245KB",
  "timestamp": "2025-08-12T10:30:00.000Z"
}
```

## Usage Examples

### Basic Screenshot
```bash
curl -X POST http://localhost:3000/screenshot \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer supersecurekey" \
  -d '{
    "url": "https://github.com",
    "selector": ".Header"
  }'
```

### Custom Options
```bash
curl -X POST http://localhost:3000/screenshot \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer supersecurekey" \
  -d '{
    "url": "https://example.com",
    "selector": "#main-content",
    "options": {
      "format": "jpeg",
      "quality": 80,
      "viewport": {
        "width": 1366,
        "height": 768
      }
    }
  }'
```

### JavaScript/Node.js
```javascript
const response = await fetch('http://localhost:3000/screenshot', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer supersecurekey'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    selector: '.hero-section',
    options: {
      format: 'png',
      viewport: { width: 1200, height: 800 }
    }
  })
});

const result = await response.json();
console.log('Screenshot saved:', result.filename);
```

## File Structure

```
element-screenshot-api/
├── src/
│   ├── server.js          # Express server and routes
│   ├── screenshot.js      # Puppeteer screenshot logic
│   ├── auth.js            # API key middleware
│   ├── config.js          # Configuration loader
│   └── utils.js           # Helper utilities
├── screenshots/           # Generated screenshots (auto-created)
├── .env                   # Environment variables
├── .gitignore            # Git ignore rules
├── package.json          # Dependencies and scripts
├── nodemon.json          # Development server config
└── README.md             # This file
```

## Error Handling

The API provides comprehensive error handling:

- **400 Bad Request**: Missing required fields (url, selector)
- **401 Unauthorized**: Invalid or missing API key
- **500 Internal Server Error**: Screenshot capture failed
- Detailed error messages in development mode
- Proper HTTP status codes for all responses

## Development

### Available Scripts
- `npm start`: Run production server
- `npm run dev`: Run development server with auto-reload

### Browser Configuration
The API is configured to run in headless mode with optimized settings for server environments:
- No sandbox mode for Docker compatibility
- Optimized memory usage
- GPU acceleration disabled for stability

## License

ISC
