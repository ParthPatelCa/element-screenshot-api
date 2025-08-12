import React from 'react'
import ReactDOM from 'react-dom/client'
import ScreenshotCapture from './ScreenshotCapture.jsx'
// import ScreenshotCaptureTailwind from './ScreenshotCaptureTailwind.jsx'
import './ScreenshotCapture.css'

// Toggle between regular CSS version and Tailwind version
// const App = ScreenshotCaptureTailwind; // Use this for Tailwind version
const App = ScreenshotCapture; // Use this for custom CSS version

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
