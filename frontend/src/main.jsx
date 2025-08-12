import React from 'react';
import { createRoot } from 'react-dom/client';
import ScreenshotCapture from './ScreenshotCapture';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ScreenshotCapture />
  </React.StrictMode>
);
