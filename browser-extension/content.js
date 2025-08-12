// Content script for DOM element selection
(function() {
  'use strict';
  
  let isPickingMode = false;
  let selectedElement = null;
  let highlightOverlay = null;
  let lastHoveredElement = null;
  
  // Create highlight overlay
  function createHighlightOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'dom-picker-highlight';
    overlay.style.cssText = `
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 0 !important;
      height: 0 !important;
      background: rgba(37, 99, 235, 0.2) !important;
      border: 2px solid #2563eb !important;
      pointer-events: none !important;
      z-index: 999999 !important;
      box-sizing: border-box !important;
      border-radius: 2px !important;
      transition: all 0.1s ease !important;
    `;
    document.body.appendChild(overlay);
    return overlay;
  }
  
  // Generate CSS selector for element
  function generateSelector(element) {
    if (!element || element === document.body) return 'body';
    
    // Try ID first
    if (element.id) {
      return '#' + element.id;
    }
    
    // Try unique class combination
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/).filter(c => c);
      if (classes.length > 0) {
        const classSelector = '.' + classes.join('.');
        if (document.querySelectorAll(classSelector).length === 1) {
          return classSelector;
        }
      }
    }
    
    // Build path with tag names and positions
    const path = [];
    let current = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      // Add ID if available
      if (current.id) {
        selector = '#' + current.id;
        path.unshift(selector);
        break;
      }
      
      // Add classes if available
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\s+/).filter(c => c);
        if (classes.length > 0) {
          selector += '.' + classes.join('.');
        }
      }
      
      // Add nth-child if necessary
      const siblings = Array.from(current.parentNode?.children || [])
        .filter(sibling => sibling.tagName === current.tagName);
      
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }
      
      path.unshift(selector);
      current = current.parentNode;
      
      // Limit path length
      if (path.length >= 5) break;
    }
    
    return path.join(' > ');
  }
  
  // Get element information
  function getElementInfo(element) {
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || null,
      className: element.className || null,
      textContent: element.textContent?.substring(0, 100) || null,
      attributes: Array.from(element.attributes).reduce((acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {})
    };
  }
  
  // Highlight element
  function highlightElement(element) {
    if (!highlightOverlay) return;
    
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    highlightOverlay.style.top = (rect.top + scrollTop) + 'px';
    highlightOverlay.style.left = (rect.left + scrollLeft) + 'px';
    highlightOverlay.style.width = rect.width + 'px';
    highlightOverlay.style.height = rect.height + 'px';
    highlightOverlay.style.display = 'block';
  }
  
  // Mouse event handlers
  function handleMouseOver(event) {
    if (!isPickingMode) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    lastHoveredElement = event.target;
    highlightElement(event.target);
  }
  
  function handleMouseOut(event) {
    if (!isPickingMode) return;
    
    event.preventDefault();
    event.stopPropagation();
  }
  
  function handleClick(event) {
    if (!isPickingMode) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    selectedElement = event.target;
    const selector = generateSelector(selectedElement);
    const elementInfo = getElementInfo(selectedElement);
    
    console.log('Element selected:', { selector, elementInfo });
    
    // Send message to popup/background
    chrome.runtime.sendMessage({
      action: 'elementSelected',
      selector: selector,
      elementInfo: elementInfo,
      url: window.location.href
    });
    
    // Stop picking mode
    stopPicking();
    
    // Show confirmation
    showSelectionConfirmation(selector);
  }
  
  function handleKeydown(event) {
    if (!isPickingMode) return;
    
    if (event.key === 'Escape') {
      event.preventDefault();
      stopPicking();
    }
  }
  
  // Show confirmation message
  function showSelectionConfirmation(selector) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      background: #059669 !important;
      color: white !important;
      padding: 12px 16px !important;
      border-radius: 8px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif !important;
      font-size: 14px !important;
      z-index: 1000000 !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
      max-width: 300px !important;
      word-break: break-all !important;
    `;
    toast.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">✅ Element Selected!</div>
      <div style="font-family: monospace; font-size: 12px; opacity: 0.9;">${selector}</div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }
  
  // Start picking mode
  function startPicking() {
    if (isPickingMode) return;
    
    console.log('Starting element picking mode');
    isPickingMode = true;
    
    // Create overlay
    highlightOverlay = createHighlightOverlay();
    
    // Add event listeners
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeydown, true);
    
    // Change cursor
    document.body.style.cursor = 'crosshair';
    
    // Show instructions
    showInstructions();
  }
  
  // Stop picking mode
  function stopPicking() {
    if (!isPickingMode) return;
    
    console.log('Stopping element picking mode');
    isPickingMode = false;
    
    // Remove overlay
    if (highlightOverlay) {
      highlightOverlay.remove();
      highlightOverlay = null;
    }
    
    // Remove event listeners
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeydown, true);
    
    // Reset cursor
    document.body.style.cursor = '';
    
    // Hide instructions
    hideInstructions();
  }
  
  // Show instructions
  function showInstructions() {
    const instructions = document.createElement('div');
    instructions.id = 'dom-picker-instructions';
    instructions.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      left: 20px !important;
      background: rgba(0, 0, 0, 0.9) !important;
      color: white !important;
      padding: 16px !important;
      border-radius: 8px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif !important;
      font-size: 14px !important;
      z-index: 1000000 !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
      max-width: 300px !important;
    `;
    instructions.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 8px;">🎯 Element Picker Active</div>
      <div style="font-size: 12px; line-height: 1.4; opacity: 0.9;">
        • Hover to highlight elements<br>
        • Click to select an element<br>
        • Press <kbd style="background: rgba(255,255,255,0.2); padding: 2px 4px; border-radius: 3px;">Esc</kbd> to cancel
      </div>
    `;
    
    document.body.appendChild(instructions);
  }
  
  // Hide instructions
  function hideInstructions() {
    const instructions = document.getElementById('dom-picker-instructions');
    if (instructions) {
      instructions.remove();
    }
  }
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);
    
    if (request.action === 'startPicking') {
      startPicking();
      sendResponse({ success: true });
    } else if (request.action === 'stopPicking') {
      stopPicking();
      sendResponse({ success: true });
    } else if (request.action === 'getSelectedElement') {
      if (selectedElement) {
        const selector = generateSelector(selectedElement);
        const elementInfo = getElementInfo(selectedElement);
        sendResponse({ 
          selector, 
          elementInfo, 
          url: window.location.href 
        });
      } else {
        sendResponse({ selector: null });
      }
    }
    
    return true;
  });
  
  console.log('DOM Screenshot Selector Picker - Content script loaded');
})();
