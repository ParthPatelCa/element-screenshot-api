import React, { useState, useEffect } from 'react';
import './ScreenshotCapture.css';

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

const ScreenshotCapture = () => {
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
    <div className="screenshot-app">
      <header className="app-header">
        <h1>📸 DOM Element Screenshot Tool</h1>
        <div className="api-status">
          <span className={`status-indicator ${apiStatus}`}></span>
          API Status: {apiStatus}
        </div>
      </header>

      <div className="app-content">
        <div className="form-section">
          <h2>Capture Configuration</h2>
          
          <div className="form-group">
            <label htmlFor="url">Website URL</label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="selector">CSS Selector</label>
            <input
              id="selector"
              type="text"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              placeholder="#elementId, .className, or any CSS selector"
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="device">Device Type</label>
              <select 
                id="device"
                value={device} 
                onChange={(e) => setDevice(e.target.value)}
                className="form-select"
              >
                {Object.entries(DEVICE_VIEWPORTS).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="delay">Delay (ms)</label>
              <input
                id="delay"
                type="number"
                value={delay}
                onChange={(e) => setDelay(Math.max(0, e.target.value))}
                min="0"
                max="10000"
                step="100"
                className="form-input"
              />
            </div>
          </div>

          <div className="button-group">
            <button 
              onClick={handleCapture} 
              disabled={loading || !url.trim() || !selector.trim()}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Capturing...
                </>
              ) : (
                <>📸 Capture Screenshot</>
              )}
            </button>
            <button onClick={clearForm} className="btn btn-secondary">
              Clear
            </button>
          </div>

          <div className="examples-section">
            <h3>Quick Examples</h3>
            <div className="examples-grid">
              {EXAMPLE_SITES.map((example, index) => (
                <button
                  key={index}
                  onClick={() => loadExample(example)}
                  className="example-btn"
                >
                  {example.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="result-section">
          <h2>Result</h2>
          
          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}

          {image && (
            <div className="result-container">
              <div className="image-preview">
                <img
                  src={`data:image/png;base64,${image}`}
                  alt="Screenshot Preview"
                  className="screenshot-image"
                />
              </div>
              
              <div className="result-actions">
                <button onClick={handleDownload} className="btn btn-success">
                  💾 Download Screenshot
                </button>
                <div className="result-info">
                  <span>Device: {DEVICE_VIEWPORTS[device].label}</span>
                  <span>Format: PNG</span>
                  {delay > 0 && <span>Delay: {delay}ms</span>}
                </div>
              </div>
            </div>
          )}

          {!image && !error && !loading && (
            <div className="placeholder">
              Configure your screenshot settings and click "Capture Screenshot" to begin.
            </div>
          )}
        </div>
      </div>

      <footer className="app-footer">
        <p>
          Built with React + Vite | Backend: Node.js + Puppeteer
          <br />
          <a href="https://github.com/ParthPatelCa/element-screenshot-api" target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
};

export default ScreenshotCapture;
