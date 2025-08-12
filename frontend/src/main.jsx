import React from 'react'
import ReactDOM from 'react-dom/client'
// import ScreenshotCapture from './ScreenshotCapture.jsx'
import ScreenshotCaptureTailwind from './ScreenshotCaptureTailwind.jsx'
import './index.css'

// Using the redesigned Tailwind version
const App = ScreenshotCaptureTailwind;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
