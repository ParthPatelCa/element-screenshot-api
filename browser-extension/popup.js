// Popup script for DOM Screenshot Selector Picker
document.addEventListener('DOMContentLoaded', function() {
  const startPickingBtn = document.getElementById('startPicking');
  const stopPickingBtn = document.getElementById('stopPicking');
  const statusDiv = document.getElementById('status');
  const selectedInfoDiv = document.getElementById('selectedInfo');
  const selectorDisplay = document.getElementById('selectorDisplay');
  const elementInfo = document.getElementById('elementInfo');
  const copySelectorBtn = document.getElementById('copySelector');
  const takeScreenshotBtn = document.getElementById('takeScreenshot');
  const apiUrlInput = document.getElementById('apiUrl');
  
  let currentSelector = null;
  let currentUrl = null;
  let isPickingActive = false;
  
  // Update UI state
  function updateUI(picking = false, selected = false) {
    isPickingActive = picking;
    startPickingBtn.disabled = picking;
    stopPickingBtn.disabled = !picking;
    takeScreenshotBtn.disabled = !selected;
    
    if (picking) {
      statusDiv.textContent = '🎯 Click an element to select it';
      statusDiv.className = 'status active';
    } else if (selected) {
      statusDiv.textContent = '✅ Element selected - ready to capture';
      statusDiv.className = 'status active';
    } else {
      statusDiv.textContent = '🎯 Click "Start Picking" to begin';
      statusDiv.className = 'status inactive';
    }
  }
  
  // Show selected element info
  function showSelectedElement(selector, info, url) {
    currentSelector = selector;
    currentUrl = url;
    
    selectorDisplay.textContent = selector;
    
    let infoText = '';
    if (info.tagName) infoText += `Tag: ${info.tagName}\n`;
    if (info.id) infoText += `ID: ${info.id}\n`;
    if (info.className) infoText += `Class: ${info.className}\n`;
    if (info.textContent) infoText += `Text: ${info.textContent}\n`;
    
    elementInfo.textContent = infoText || 'No additional info available';
    selectedInfoDiv.style.display = 'block';
    
    updateUI(false, true);
  }
  
  // Get current tab
  function getCurrentTab(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      callback(tabs[0]);
    });
  }
  
  // Start picking elements
  startPickingBtn.addEventListener('click', function() {
    getCurrentTab((tab) => {
      chrome.tabs.sendMessage(tab.id, { action: 'startPicking' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error starting picker:', chrome.runtime.lastError);
          alert('Error starting picker. Please refresh the page and try again.');
          return;
        }
        
        if (response && response.success) {
          updateUI(true, false);
          selectedInfoDiv.style.display = 'none';
        }
      });
    });
  });
  
  // Stop picking elements
  stopPickingBtn.addEventListener('click', function() {
    getCurrentTab((tab) => {
      chrome.tabs.sendMessage(tab.id, { action: 'stopPicking' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error stopping picker:', chrome.runtime.lastError);
          return;
        }
        
        updateUI(false, !!currentSelector);
      });
    });
  });
  
  // Copy selector to clipboard
  copySelectorBtn.addEventListener('click', function() {
    if (!currentSelector) return;
    
    navigator.clipboard.writeText(currentSelector).then(() => {
      const originalText = copySelectorBtn.textContent;
      copySelectorBtn.textContent = '✅ Copied!';
      copySelectorBtn.style.background = '#059669';
      
      setTimeout(() => {
        copySelectorBtn.textContent = originalText;
        copySelectorBtn.style.background = '';
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
      
      // Fallback method
      const textArea = document.createElement('textarea');
      textArea.value = currentSelector;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      const originalText = copySelectorBtn.textContent;
      copySelectorBtn.textContent = '✅ Copied!';
      setTimeout(() => {
        copySelectorBtn.textContent = originalText;
      }, 2000);
    });
  });
  
  // Take screenshot
  takeScreenshotBtn.addEventListener('click', async function() {
    if (!currentSelector || !currentUrl) return;
    
    const apiUrl = apiUrlInput.value.trim();
    if (!apiUrl) {
      alert('Please enter an API endpoint URL');
      return;
    }
    
    takeScreenshotBtn.disabled = true;
    const originalText = takeScreenshotBtn.textContent;
    takeScreenshotBtn.innerHTML = '⏳ Capturing...';
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: currentUrl,
          selector: currentSelector,
          device: 'desktop'
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.image) {
        // Create and download the image
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${data.image}`;
        link.download = `screenshot-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        takeScreenshotBtn.innerHTML = '✅ Downloaded!';
        takeScreenshotBtn.style.background = '#059669';
        
        setTimeout(() => {
          takeScreenshotBtn.innerHTML = originalText;
          takeScreenshotBtn.style.background = '';
          takeScreenshotBtn.disabled = false;
        }, 3000);
      } else {
        throw new Error(data.message || 'Screenshot failed');
      }
    } catch (error) {
      console.error('Screenshot error:', error);
      alert(`Screenshot failed: ${error.message}`);
      
      takeScreenshotBtn.innerHTML = '❌ Failed';
      takeScreenshotBtn.style.background = '#dc2626';
      
      setTimeout(() => {
        takeScreenshotBtn.innerHTML = originalText;
        takeScreenshotBtn.style.background = '';
        takeScreenshotBtn.disabled = false;
      }, 3000);
    }
  });
  
  // Listen for element selection messages
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'elementSelected') {
      showSelectedElement(request.selector, request.elementInfo, request.url);
    }
    return true;
  });
  
  // Check if there's already a selected element when popup opens
  getCurrentTab((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: 'getSelectedElement' }, (response) => {
      if (chrome.runtime.lastError) {
        // Content script not loaded or page doesn't support it
        return;
      }
      
      if (response && response.selector) {
        showSelectedElement(response.selector, response.elementInfo, response.url);
      }
    });
  });
  
  // Initialize UI
  updateUI(false, false);
});
