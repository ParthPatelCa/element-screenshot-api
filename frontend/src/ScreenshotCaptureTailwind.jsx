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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-purple-700">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              📸 DOM Element Screenshot Tool
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                apiStatus === 'healthy' ? 'bg-green-500' : 
                apiStatus === 'unhealthy' ? 'bg-red-500' : 'bg-gray-400'
              }`}></div>
              API Status: {apiStatus}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="relative">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Capture Configuration
              </h2>
              <div className="absolute bottom-0 left-0 w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </div>

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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 outline-none"
                />
              </div>

              {/* Selector Input */}
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 outline-none"
                />
              </div>

              {/* Device and Delay Row */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="device" className="block text-sm font-medium text-gray-700 mb-2">
                    Device Type
                  </label>
                  <select 
                    id="device"
                    value={device} 
                    onChange={(e) => setDevice(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 outline-none bg-white"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 outline-none"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleCapture} 
                  disabled={loading || !url.trim() || !selector.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <ClipLoader color="white" size={16} loading={loading} />
                      Capturing...
                    </>
                  ) : (
                    <>📸 Capture Screenshot</>
                  )}
                </button>
                <button 
                  onClick={clearForm} 
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
                >
                  Clear
                </button>
              </div>

              {/* Examples */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick Examples</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXAMPLE_SITES.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => loadExample(example)}
                      className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:from-gray-100 hover:to-gray-200 transition-all duration-200 hover:-translate-y-0.5"
                    >
                      {example.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="relative">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Result</h2>
              <div className="absolute bottom-0 left-0 w-12 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 font-medium">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                <ClipLoader color="#667eea" size={60} loading={loading} />
                <p className="mt-4 text-lg font-semibold text-gray-700">Capturing screenshot...</p>
                <p className="mt-2 text-sm text-gray-500 text-center max-w-sm">
                  This may take a few seconds depending on the website and element complexity.
                </p>
              </div>
            )}

            {/* Image Result */}
            {image && !loading && (
              <div className="text-center space-y-6">
                <div className="relative group">
                  <img
                    src={`data:image/png;base64,${image}`}
                    alt="Screenshot Preview"
                    className="max-w-full h-auto border-2 border-gray-200 rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300 animate-fade-in"
                  />
                </div>
                
                <div className="space-y-4">
                  <button 
                    onClick={handleDownload} 
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    📥 Download Screenshot
                  </button>
                  
                  <div className="flex flex-wrap justify-center gap-2 text-xs">
                    <span className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-1 rounded-md border border-gray-200 font-medium">
                      Device: {DEVICE_VIEWPORTS[device].label}
                    </span>
                    <span className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-1 rounded-md border border-gray-200 font-medium">
                      Format: PNG
                    </span>
                    <span className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-1 rounded-md border border-gray-200 font-medium">
                      Size: {Math.round((image.length * 3) / 4 / 1024)} KB
                    </span>
                    {delay > 0 && (
                      <span className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-1 rounded-md border border-gray-200 font-medium">
                        Delay: {delay}ms
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Placeholder */}
            {!image && !error && !loading && (
              <div className="text-center py-12 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
                <div className="text-6xl mb-4 animate-bounce-slow">📸</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Ready to Capture</h3>
                <p className="text-gray-600 mb-6">
                  Configure your screenshot settings and click "Capture Screenshot" to begin.
                </p>
                
                <div className="bg-white/70 p-6 rounded-lg max-w-md mx-auto text-left">
                  <p className="font-semibold text-blue-600 mb-3">💡 Tips:</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Use specific CSS selectors for better targeting</li>
                    <li>• Add delay if elements need time to load</li>
                    <li>• Choose the right device type for your use case</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-white/80 bg-black/10">
        <p className="text-sm">
          Built with React + Vite + Tailwind CSS | Backend: Node.js + Puppeteer
          <br />
          <a 
            href="https://github.com/ParthPatelCa/element-screenshot-api" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white/90 hover:text-white font-medium underline"
          >
            View on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
};

export default ScreenshotCaptureTailwind;
