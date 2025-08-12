import React, { useState, useEffect } from 'react';
import { ClipLoader } from 'react-spinners';

const DEVICE_VIEWPORTS = {
  mobile: { width: 375, height: 667, label: 'Mobile (375x667)' },
  tablet: { width: 768, height: 1024, label: 'Tablet (768x1024)' },
  desktop: { width: 1920, height: 1080, label: 'Desktop (1920x1080)' },
};

const EXAMPLE_SITES = [
  { name: 'GitHub Header', url: 'https://github.com', selector: '.Header' },
  { name: 'Google Logo', url: 'https://google.com', selector: 'img[alt="Google"]' },
  { name: 'Bootstrap Navbar', url: 'https://getbootstrap.com', selector: '.navbar' },
  { name: 'MDN Logo', url: 'https://developer.mozilla.org', selector: '.logo' },
];

const ScreenshotCaptureTailwind = () => {
  const [url, setUrl] = useState('https://github.com');
  const [selector, setSelector] = useState('.Header');
  const [device, setDevice] = useState('desktop');
  const [delay, setDelay] = useState(0);
  const [image, setImage] = useState(null);
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const [fullPage, setFullPage] = useState(false);
  const [customViewport, setCustomViewport] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1920);
  const [viewportHeight, setViewportHeight] = useState(1080);
  const [multipleSelectors, setMultipleSelectors] = useState(false);
  const [selectorList, setSelectorList] = useState('');

  // Check API health on component mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const response = await fetch('/api/../health');
      if (response.ok) {
        setApiStatus('healthy');
      } else {
        setApiStatus('unhealthy');
      }
    } catch {
      setApiStatus('offline');
    }
  };

  const handleCapture = async () => {
    if (!url.trim()) {
      setError('Please provide a URL');
      return;
    }

    if (!fullPage && !selector.trim() && !selectorList.trim()) {
      setError('Please provide CSS selector(s) or enable full page mode');
      return;
    }

    setLoading(true);
    setError('');
    setImage(null);
    setImages([]);

    try {
      // Prepare selector data
      let selectorData = selector.trim();
      if (multipleSelectors && selectorList.trim()) {
        selectorData = selectorList.split('\n').map(s => s.trim()).filter(s => s);
      }

      // Prepare request body
      const requestBody = {
        url: url.trim(),
        device,
        delay: Number(delay),
        fullPage
      };

      // Add selector if not full page
      if (!fullPage) {
        requestBody.selector = selectorData;
      }

      // Add custom viewport if enabled
      if (customViewport) {
        requestBody.viewportWidth = parseInt(viewportWidth);
        requestBody.viewportHeight = parseInt(viewportHeight);
      }

      const response = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.type === 'multipleSelectors') {
          setImages(data.images || []);
        } else {
          setImage(data.image);
        }
        setError('');
      } else {
        setError(data.message || 'Failed to capture screenshot');
        setImage(null);
        setImages([]);
      }
    } catch (err) {
      setError('Network error: Could not connect to the API');
      setImage(null);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (imageData, filename = null) => {
    if (!imageData) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${imageData}`;
    link.download = filename || `screenshot-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    if (images.length === 0) return;
    
    images.forEach((img, index) => {
      if (img.success && img.image) {
        const filename = `screenshot-${index + 1}-${Date.now()}.png`;
        setTimeout(() => handleDownload(img.image, filename), index * 100);
      }
    });
  };

  const loadExample = (example) => {
    setUrl(example.url);
    setSelector(example.selector);
    setError('');
    setImage(null);
  };

  const clearForm = () => {
    setUrl('');
    setSelector('');
    setSelectorList('');
    setDelay(0);
    setError('');
    setImage(null);
    setImages([]);
    setFullPage(false);
    setCustomViewport(false);
    setMultipleSelectors(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                📸 DOM Screenshot Tool
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Capture any element from any website with precision
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                apiStatus === 'healthy' ? 'bg-green-500' : 
                apiStatus === 'unhealthy' ? 'bg-red-500' : 'bg-gray-400'
              }`}></div>
              <span className="text-gray-600">
                API {apiStatus === 'healthy' ? 'Connected' : apiStatus === 'unhealthy' ? 'Error' : 'Checking...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Configuration Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Configuration
            </h2>
            
            <div className="space-y-6">
              {/* URL Input */}
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                />
              </div>

              {/* CSS Selector Input */}
              <div>
                <label htmlFor="selector" className="block text-sm font-medium text-gray-700 mb-2">
                  CSS Selector
                </label>
                <input
                  id="selector"
                  type="text"
                  value={selector}
                  onChange={(e) => setSelector(e.target.value)}
                  placeholder="#elementId, .className, or any CSS selector"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                />
              </div>

              {/* Device and Delay Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="device" className="block text-sm font-medium text-gray-700 mb-2">
                    Device Type
                  </label>
                  <select 
                    id="device"
                    value={device} 
                    onChange={(e) => setDevice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                  >
                    {Object.entries(DEVICE_VIEWPORTS).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="delay" className="block text-sm font-medium text-gray-700 mb-2">
                    Delay (ms)
                  </label>
                  <input
                    id="delay"
                    type="number"
                    value={delay}
                    onChange={(e) => setDelay(Math.max(0, e.target.value))}
                    min="0"
                    max="10000"
                    step="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Advanced Options */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">📋 Advanced Options</h3>
                
                {/* Full Page Option */}
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={fullPage}
                      onChange={(e) => setFullPage(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">📄 Capture full page (ignores selector)</span>
                  </label>

                  {/* Multiple Selectors Option */}
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={multipleSelectors}
                      onChange={(e) => setMultipleSelectors(e.target.checked)}
                      disabled={fullPage}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-700">🧩 Multiple selectors (one per line)</span>
                  </label>

                  {/* Custom Viewport Option */}
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={customViewport}
                      onChange={(e) => setCustomViewport(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">📐 Custom viewport dimensions</span>
                  </label>
                </div>

                {/* Multiple Selectors Input */}
                {multipleSelectors && !fullPage && (
                  <div className="mt-4">
                    <label htmlFor="selectorList" className="block text-sm font-medium text-gray-700 mb-2">
                      CSS Selectors (one per line)
                    </label>
                    <textarea
                      id="selectorList"
                      value={selectorList}
                      onChange={(e) => setSelectorList(e.target.value)}
                      placeholder=".header&#10;#main-content&#10;.footer&#10;.sidebar"
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-mono text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">Enter each CSS selector on a new line</p>
                  </div>
                )}

                {/* Custom Viewport Inputs */}
                {customViewport && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="viewportWidth" className="block text-sm font-medium text-gray-700 mb-2">
                        Width (px)
                      </label>
                      <input
                        id="viewportWidth"
                        type="number"
                        value={viewportWidth}
                        onChange={(e) => setViewportWidth(Math.max(100, e.target.value))}
                        min="100"
                        max="3840"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label htmlFor="viewportHeight" className="block text-sm font-medium text-gray-700 mb-2">
                        Height (px)
                      </label>
                      <input
                        id="viewportHeight"
                        type="number"
                        value={viewportHeight}
                        onChange={(e) => setViewportHeight(Math.max(100, e.target.value))}
                        min="100"
                        max="2160"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleCapture} 
                  disabled={loading || !url.trim() || (!fullPage && !selector.trim() && !selectorList.trim())}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <ClipLoader color="white" size={16} loading={loading} />
                      <span>Capturing...</span>
                    </>
                  ) : (
                    <>
                      <span>📸</span>
                      <span>
                        {fullPage ? 'Capture Full Page' : 
                         multipleSelectors ? 'Capture Multiple' : 
                         'Capture Screenshot'}
                      </span>
                    </>
                  )}
                </button>
                <button 
                  onClick={clearForm} 
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 transition-all duration-200"
                >
                  Clear
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  <strong>Error:</strong> {error}
                </div>
              )}

              {/* Quick Examples */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Examples</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXAMPLE_SITES.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => loadExample(example)}
                      className="p-2 text-xs bg-gray-50 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-100 transition-all duration-200 text-left"
                    >
                      <div className="font-medium">{example.name}</div>
                      <div className="text-gray-500 truncate">{example.selector}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Result Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Result
            </h2>
            
            <div className="min-h-[400px] flex flex-col">
              {/* Loading State */}
              {loading && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <ClipLoader color="#2563EB" size={50} loading={loading} />
                  <p className="mt-4 text-gray-600 font-medium">Capturing screenshot...</p>
                  <p className="mt-2 text-sm text-gray-500 text-center">
                    This may take a few seconds depending on the website complexity
                  </p>
                </div>
              )}

              {/* Single Image Result */}
              {image && !loading && images.length === 0 && (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 flex items-center justify-center mb-4">
                    <img
                      src={`data:image/png;base64,${image}`}
                      alt="Screenshot Preview"
                      className="max-w-full max-h-96 border border-gray-200 rounded-lg shadow-sm animate-fade-in"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <button 
                      onClick={() => handleDownload(image)} 
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <span>📥</span>
                      <span>Download Screenshot</span>
                    </button>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">
                        {customViewport ? `${viewportWidth}x${viewportHeight}` : DEVICE_VIEWPORTS[device].label}
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">
                        Format: PNG
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">
                        Size: {Math.round((image.length * 3) / 4 / 1024)} KB
                      </span>
                      {delay > 0 && (
                        <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">
                          Delay: {delay}ms
                        </span>
                      )}
                      {fullPage && (
                        <span className="bg-blue-100 px-2 py-1 rounded text-blue-700">
                          Full Page
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Multiple Images Result */}
              {images.length > 0 && !loading && (
                <div className="flex-1 flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      Screenshots ({images.filter(img => img.success).length}/{images.length})
                    </h3>
                    <button 
                      onClick={handleDownloadAll}
                      disabled={images.filter(img => img.success).length === 0}
                      className="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1"
                    >
                      <span>📥</span>
                      <span>Download All</span>
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-4 max-h-96">
                    {images.map((img, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-700 font-mono">
                            {img.selector}
                          </h4>
                          {img.success ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              ✅ Success
                            </span>
                          ) : (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                              ❌ Failed
                            </span>
                          )}
                        </div>
                        
                        {img.success && img.image ? (
                          <div className="space-y-3">
                            <img
                              src={`data:image/png;base64,${img.image}`}
                              alt={`Screenshot for ${img.selector}`}
                              className="w-full max-h-48 object-contain border border-gray-100 rounded animate-fade-in"
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                Size: {img.size}
                              </span>
                              <button 
                                onClick={() => handleDownload(img.image, `screenshot-${index + 1}-${Date.now()}.png`)}
                                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-all duration-200"
                              >
                                📥 Download
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {img.error || 'Unknown error'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Placeholder */}
              {!image && !loading && images.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="text-6xl mb-4">📸</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Capture</h3>
                  <p className="text-gray-600 mb-6 max-w-sm">
                    Configure your screenshot settings and click capture to get started.
                  </p>
                  
                  <div className="bg-blue-50 p-4 rounded-lg max-w-sm">
                    <h4 className="font-medium text-indigo-900 mb-2">✨ New Features:</h4>
                    <ul className="text-sm text-indigo-800 space-y-1 text-left">
                      <li>• 📄 Full page screenshots</li>
                      <li>• 🧩 Multiple selectors at once</li>
                      <li>• 📐 Custom viewport dimensions</li>
                      <li>• 🎯 Visual selector picker (browser extension)</li>
                    </ul>
                  </div>
                </div>
              )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>
              Built with React + Vite + Tailwind CSS | Backend: Node.js + Puppeteer
            </p>
            <p className="mt-1">
              <a 
                href="https://github.com/ParthPatelCa/element-screenshot-api" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View on GitHub →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreenshotCaptureTailwind;
