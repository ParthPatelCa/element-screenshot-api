import React from 'react';

const ConfigurationPanel = ({
  url,
  setUrl,
  selector,
  setSelector,
  device,
  setDevice,
  delay,
  setDelay,
  fullPage,
  setFullPage,
  customViewport,
  setCustomViewport,
  viewportWidth,
  setViewportWidth,
  viewportHeight,
  setViewportHeight,
  multipleSelectors,
  setMultipleSelectors,
  selectorList,
  setSelectorList,
  loading,
  error,
  onCapture,
  onClear
}) => {
  const DEVICE_VIEWPORTS = {
    mobile: { width: 375, height: 667, label: 'Mobile (375×667)' },
    tablet: { width: 768, height: 1024, label: 'Tablet (768×1024)' },
    desktop: { width: 1920, height: 1080, label: 'Desktop (1920×1080)' },
  };

  const EXAMPLE_SITES = [
    { name: 'GitHub Header', url: 'https://github.com', selector: '.Header' },
    { name: 'Google Logo', url: 'https://google.com', selector: 'img[alt="Google"]' },
    { name: 'Bootstrap Navbar', url: 'https://getbootstrap.com', selector: '.navbar' },
    { name: 'MDN Logo', url: 'https://developer.mozilla.org', selector: '.logo' },
  ];

  const loadExample = (example) => {
    setUrl(example.url);
    setSelector(example.selector);
    setMultipleSelectors(false);
    setSelectorList('');
    setFullPage(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Configuration</h2>
      </div>

      <div className="space-y-6">
        {/* URL Input */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-slate-700 mb-2">
            Website URL
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>

        {/* Capture Mode Options */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-700">Capture Mode</h3>
          
          <div className="grid grid-cols-1 gap-3">
            <label className="flex items-center space-x-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="radio"
                name="captureMode"
                checked={!fullPage && !multipleSelectors}
                onChange={() => {
                  setFullPage(false);
                  setMultipleSelectors(false);
                }}
                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-slate-900">Single Element</div>
                <div className="text-xs text-slate-500">Capture a specific DOM element</div>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="radio"
                name="captureMode"
                checked={multipleSelectors}
                onChange={() => {
                  setMultipleSelectors(true);
                  setFullPage(false);
                }}
                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-slate-900">Multiple Elements</div>
                <div className="text-xs text-slate-500">Capture several elements at once</div>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="radio"
                name="captureMode"
                checked={fullPage}
                onChange={() => {
                  setFullPage(true);
                  setMultipleSelectors(false);
                }}
                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-slate-900">Full Page</div>
                <div className="text-xs text-slate-500">Capture the entire webpage</div>
              </div>
            </label>
          </div>
        </div>

        {/* Selector Input */}
        {!fullPage && (
          <div>
            <label htmlFor="selector" className="block text-sm font-medium text-slate-700 mb-2">
              {multipleSelectors ? 'CSS Selectors (one per line)' : 'CSS Selector'}
            </label>
            {multipleSelectors ? (
              <textarea
                id="selectorList"
                value={selectorList}
                onChange={(e) => setSelectorList(e.target.value)}
                placeholder=".header&#10;#main-content&#10;.footer"
                rows="4"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-mono text-sm"
              />
            ) : (
              <input
                id="selector"
                type="text"
                value={selector}
                onChange={(e) => setSelector(e.target.value)}
                placeholder="#elementId, .className, or any CSS selector"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            )}
          </div>
        )}

        {/* Device and Viewport Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="device" className="block text-sm font-medium text-slate-700 mb-2">
              Device Type
            </label>
            <select 
              id="device"
              value={device} 
              onChange={(e) => setDevice(e.target.value)}
              disabled={customViewport}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white disabled:bg-slate-50 disabled:text-slate-500"
            >
              {Object.entries(DEVICE_VIEWPORTS).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="delay" className="block text-sm font-medium text-slate-700 mb-2">
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
              className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Custom Viewport */}
        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={customViewport}
              onChange={(e) => setCustomViewport(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700">Custom viewport dimensions</span>
          </label>

          {customViewport && (
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="viewportWidth" className="block text-xs font-medium text-slate-600 mb-1">
                  Width (px)
                </label>
                <input
                  id="viewportWidth"
                  type="number"
                  value={viewportWidth}
                  onChange={(e) => setViewportWidth(Math.max(100, e.target.value))}
                  min="100"
                  max="3840"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="viewportHeight" className="block text-xs font-medium text-slate-600 mb-1">
                  Height (px)
                </label>
                <input
                  id="viewportHeight"
                  type="number"
                  value={viewportHeight}
                  onChange={(e) => setViewportHeight(Math.max(100, e.target.value))}
                  min="100"
                  max="2160"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={onCapture} 
            disabled={loading || !url.trim() || (!fullPage && !selector.trim() && !selectorList.trim())}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Capturing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>
                  {fullPage ? 'Capture Full Page' : 
                   multipleSelectors ? 'Capture Multiple' : 
                   'Capture Screenshot'}
                </span>
              </>
            )}
          </button>
          
          <button 
            onClick={onClear} 
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all duration-200"
          >
            Clear
          </button>
        </div>

        {/* Quick Examples */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">Quick Examples</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EXAMPLE_SITES.map((example, index) => (
              <button
                key={index}
                onClick={() => loadExample(example)}
                className="p-3 text-left bg-slate-50 border border-slate-200 rounded-lg text-sm hover:bg-slate-100 transition-all duration-200 group"
              >
                <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                  {example.name}
                </div>
                <div className="text-xs text-slate-500 font-mono mt-1 truncate">
                  {example.selector}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPanel;