// Browser extension background service worker
console.log('DOM Screenshot Selector Picker - Background script loaded');

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This is handled by the popup, so this listener may not be needed
  // but we keep it for potential future functionality
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  if (request.action === 'elementSelected') {
    // Element was selected, we could store this or notify popup
    console.log('Element selected:', request.selector);
    
    // Optionally notify all tabs or popup
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'selectionConfirmed',
          selector: request.selector
        });
      }
    });
  }
  
  if (request.action === 'copyToClipboard') {
    // Handle clipboard operations
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: (text) => {
          navigator.clipboard.writeText(text).then(() => {
            console.log('Copied to clipboard:', text);
          }).catch(err => {
            console.error('Failed to copy to clipboard:', err);
          });
        },
        args: [request.text]
      });
    });
  }
  
  return true; // Keep message channel open for async response
});
