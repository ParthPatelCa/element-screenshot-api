# DOM Screenshot Selector Picker - Browser Extension

A Chrome/Firefox browser extension that allows you to visually select DOM elements and capture screenshots using the DOM Screenshot API.

## Features

- 🎯 **Visual Element Selection**: Click to select any element on a webpage
- 📋 **CSS Selector Generation**: Automatically generates optimal CSS selectors
- 📸 **Direct Screenshot Capture**: Integrates with the DOM Screenshot API
- 📁 **Instant Download**: Downloads screenshots directly to your computer
- 🔄 **Cross-site Support**: Works on any website

## Installation

### Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the `browser-extension` folder
4. The extension icon should appear in your browser toolbar

### Firefox Extension

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from the `browser-extension` folder

## Usage

### 1. Visual Element Selection

1. **Open the Extension**: Click the extension icon in your browser toolbar
2. **Start Picking**: Click the "🎯 Start Picking Elements" button
3. **Select Element**: 
   - Hover over any element to see it highlighted
   - Click on the element you want to select
   - The CSS selector will be automatically generated

### 2. Taking Screenshots

1. **Enter API URL**: Set your DOM Screenshot API endpoint (default: `http://localhost:3000/api/screenshot`)
2. **Capture Screenshot**: Click "📸 Capture Screenshot"
3. **Download**: The screenshot will be automatically downloaded

### 3. Copy Selector

- After selecting an element, click "📋 Copy Selector" to copy the CSS selector to your clipboard
- Use this selector in your own API calls or automation scripts

## Features in Detail

### Smart Selector Generation

The extension generates CSS selectors using this priority:
1. **ID selectors**: `#unique-id` (if element has a unique ID)
2. **Class selectors**: `.class1.class2` (if combination is unique)
3. **Path-based selectors**: `div > section.main > article:nth-child(2)`

### Visual Feedback

- **Hover Highlighting**: Blue outline appears when hovering over elements
- **Selection Confirmation**: Green toast notification shows the selected selector
- **Progress Indicators**: Loading states for all operations

### Error Handling

- **Network Errors**: Clear error messages for API connection issues
- **Invalid Selectors**: Automatic fallback to more specific selectors
- **Timeout Handling**: Graceful handling of slow API responses

## API Integration

### Default Endpoint
```
POST http://localhost:3000/api/screenshot
```

### Request Format
```json
{
  "url": "https://example.com",
  "selector": ".header-nav",
  "device": "desktop"
}
```

### Response Format
```json
{
  "success": true,
  "image": "base64-encoded-image-data",
  "device": "desktop",
  "viewport": { "width": 1920, "height": 1080 },
  "size": "45KB",
  "timestamp": "2025-08-12T..."
}
```

## Configuration

### API Endpoint
- Change the API URL in the extension popup
- Supports both HTTP and HTTPS endpoints
- Automatically saves your preferred endpoint

### Device Types
Currently supports:
- **Desktop**: 1920x1080 viewport
- **Tablet**: 768x1024 viewport  
- **Mobile**: 375x667 viewport

## Development

### File Structure
```
browser-extension/
├── manifest.json         # Extension configuration
├── popup.html           # Extension popup UI
├── popup.js            # Popup functionality
├── content.js          # Page interaction script
├── content.css         # Content script styles
├── background.js       # Background service worker
├── icons/             # Extension icons
└── README.md          # This file
```

### Key Components

1. **Content Script** (`content.js`):
   - Handles element selection and highlighting
   - Generates CSS selectors
   - Manages user interactions

2. **Popup** (`popup.html/js`):
   - Extension interface
   - API integration
   - Settings management

3. **Background Script** (`background.js`):
   - Message passing between components
   - Clipboard operations

### Building from Source

1. Clone the repository
2. Navigate to the `browser-extension` directory
3. Load as unpacked extension in Chrome/Firefox
4. No build process required - pure JavaScript

## Permissions

The extension requires these permissions:

- **activeTab**: Access the current webpage for element selection
- **scripting**: Inject content scripts for element highlighting
- **clipboardWrite**: Copy selectors to clipboard
- **host_permissions**: Access any website for element selection

## Security

- **No Data Collection**: Extension doesn't collect or store personal data
- **Local Processing**: All selector generation happens locally
- **API Choice**: You control which screenshot API to use
- **Minimal Permissions**: Only requests necessary permissions

## Troubleshooting

### Extension Not Working
1. Ensure the DOM Screenshot API is running
2. Check that the API URL is correct
3. Refresh the webpage and try again
4. Check browser console for error messages

### Element Selection Issues
1. Try clicking "Stop Picking" and "Start Picking" again
2. Refresh the page if the extension seems unresponsive
3. Some complex websites may interfere with element selection

### Screenshot Failures
1. Verify the API endpoint is accessible
2. Check that the selected element exists on the page
3. Ensure CORS is properly configured on your API

## Contributing

1. Fork the repository
2. Make your changes in the `browser-extension` directory
3. Test with both Chrome and Firefox
4. Submit a pull request

## License

This extension is part of the DOM Screenshot API project and follows the same license.

## Related

- [DOM Screenshot API](../README.md) - The backend API
- [Frontend Application](../frontend/README.md) - Web interface
- [API Documentation](../API.md) - Complete API reference
