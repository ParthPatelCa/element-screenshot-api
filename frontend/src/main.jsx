import React from 'react'
import ReactDOM from 'react-dom/client'
import ScreenshotCaptureProfessional from './ScreenshotCaptureProfessional.jsx'
import './index.css'

// Using the professional redesigned version
const App = ScreenshotCaptureProfessional;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
