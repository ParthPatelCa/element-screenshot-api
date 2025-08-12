# DOM Element Screenshot Frontend

A simple React frontend for the DOM Element Screenshot API.

## Features
- Enter URL and CSS selector
- Choose device type (mobile, tablet, desktop)
- Optional delay before capture
- Capture and preview screenshot
- Download screenshot
- Error handling and loading state

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

The app will be available at http://localhost:5173 (default Vite port).

## API Integration
- The frontend expects the backend API to be running at http://localhost:3000
- The `/api/screenshot` endpoint should accept POST requests as described in the backend README.
