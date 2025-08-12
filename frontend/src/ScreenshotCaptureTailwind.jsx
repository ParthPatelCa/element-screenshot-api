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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');

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
    if (!url.trim() || !selector.trim()) {
      setError('Please provide both URL and CSS selector');
      return;
    }

    setLoading(true);
    setError('');
    setImage(null);

    try {
      const response = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          selector: selector.trim(),
          device,
          delay: Number(delay),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setImage(data.image);
        setError('');
      } else {
        setError(data.message || 'Failed to capture screenshot');
        setImage(null);
      }
    } catch (err) {
      setError('Network error: Could not connect to the API');
      setImage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${image}`;
    link.download = `screenshot-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    setDelay(0);
    setError('');
    setImage(null);
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

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleCapture} 
                  disabled={loading || !url.trim() || !selector.trim()}
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
                      <span>Capture Screenshot</span>
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

              {/* Image Result */}
              {image && !loading && (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 flex items-center justify-center mb-4">
                    <img
                      src={`data:image/png;base64,${image}`}
                      alt="Screenshot Preview"
                      className="max-w-full max-h-96 border border-gray-200 rounded-lg shadow-sm fade-in"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <button 
                      onClick={handleDownload} 
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <span>📥</span>
                      <span>Download Screenshot</span>
                    </button>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">
                        Device: {DEVICE_VIEWPORTS[device].label}
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
                    </div>
                  </div>
                </div>
              )}

              {/* Placeholder */}
              {!image && !error && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="text-6xl mb-4">📸</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Capture</h3>
                  <p className="text-gray-600 mb-6 max-w-sm">
                    Enter a website URL and CSS selector above, then click "Capture Screenshot" to get started.
                  </p>
                  
                  <div className="bg-blue-50 p-4 rounded-lg max-w-sm">
                    <h4 className="font-medium text-indigo-900 mb-2">💡 Pro Tips:</h4>
                    <ul className="text-sm text-indigo-800 space-y-1 text-left">
                      <li>• Use specific selectors like #id or .class</li>
                      <li>• Add delay for dynamic content</li>
                      <li>• Try different device types</li>
                    </ul>
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
