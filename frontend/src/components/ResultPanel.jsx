import React from 'react';
import { ClipLoader } from 'react-spinners';

const ResultPanel = ({
  loading,
  image,
  images,
  device,
  customViewport,
  viewportWidth,
  viewportHeight,
  delay,
  fullPage,
  onDownload,
  onDownloadAll
}) => {
  const DEVICE_VIEWPORTS = {
    mobile: { width: 375, height: 667, label: 'Mobile (375×667)' },
    tablet: { width: 768, height: 1024, label: 'Tablet (768×1024)' },
    desktop: { width: 1920, height: 1080, label: 'Desktop (1920×1080)' },
  };

  const getViewportLabel = () => {
    if (customViewport) {
      return `${viewportWidth}×${viewportHeight}`;
    }
    return DEVICE_VIEWPORTS[device]?.label || 'Desktop (1920×1080)';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Result</h2>
      </div>
      
      <div className="min-h-[400px] flex flex-col">
        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="relative">
              <ClipLoader color="#3B82F6" size={50} loading={loading} />
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
            </div>
            <h3 className="mt-6 text-lg font-medium text-slate-900">Capturing Screenshot</h3>
            <p className="mt-2 text-sm text-slate-600 text-center max-w-sm">
              This may take a few seconds depending on the website complexity and network conditions.
            </p>
            <div className="mt-4 flex items-center space-x-2 text-xs text-slate-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}

        {/* Single Image Result */}
        {image && !loading && images.length === 0 && (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center mb-6">
              <div className="relative group">
                <img
                  src={`data:image/png;base64,${image}`}
                  alt="Screenshot Preview"
                  className="max-w-full max-h-96 border border-slate-200 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-xl transition-all duration-300"></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={() => onDownload(image)} 
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download Screenshot</span>
              </button>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 px-3 py-2 rounded-lg text-center">
                  <div className="font-medium text-slate-900">{getViewportLabel()}</div>
                  <div className="text-slate-500">Viewport</div>
                </div>
                <div className="bg-slate-50 px-3 py-2 rounded-lg text-center">
                  <div className="font-medium text-slate-900">PNG</div>
                  <div className="text-slate-500">Format</div>
                </div>
                <div className="bg-slate-50 px-3 py-2 rounded-lg text-center">
                  <div className="font-medium text-slate-900">{Math.round((image.length * 3) / 4 / 1024)} KB</div>
                  <div className="text-slate-500">Size</div>
                </div>
                {delay > 0 && (
                  <div className="bg-slate-50 px-3 py-2 rounded-lg text-center">
                    <div className="font-medium text-slate-900">{delay}ms</div>
                    <div className="text-slate-500">Delay</div>
                  </div>
                )}
                {fullPage && (
                  <div className="bg-blue-50 px-3 py-2 rounded-lg text-center">
                    <div className="font-medium text-blue-900">Full Page</div>
                    <div className="text-blue-600">Mode</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Multiple Images Result */}
        {images.length > 0 && !loading && (
          <div className="flex-1 flex flex-col space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-slate-900">
                  Multiple Screenshots
                </h3>
                <p className="text-sm text-slate-600">
                  {images.filter(img => img.success).length} of {images.length} successful
                </p>
              </div>
              <button 
                onClick={onDownloadAll}
                disabled={images.filter(img => img.success).length === 0}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download All</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 max-h-96">
              {images.map((img, index) => (
                <div key={index} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-700 font-mono bg-slate-100 px-2 py-1 rounded">
                      {img.selector}
                    </h4>
                    {img.success ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Failed
                      </span>
                    )}
                  </div>
                  
                  {img.success && img.image ? (
                    <div className="space-y-3">
                      <img
                        src={`data:image/png;base64,${img.image}`}
                        alt={`Screenshot for ${img.selector}`}
                        className="w-full max-h-48 object-contain border border-slate-100 rounded-lg"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          {img.size}
                        </span>
                        <button 
                          onClick={() => onDownload(img.image, `screenshot-${index + 1}-${Date.now()}.png`)}
                          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3" />
                          </svg>
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{img.error || 'Unknown error occurred'}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Placeholder */}
        {!image && !loading && images.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Ready to Capture</h3>
            <p className="text-slate-600 mb-8 max-w-md">
              Configure your screenshot settings and click capture to get started with professional-quality screenshots.
            </p>
            
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 p-6 rounded-xl max-w-md">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Professional Features
              </h4>
              <ul className="text-sm text-blue-800 space-y-2 text-left">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Full page screenshots
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Multiple elements at once
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Custom viewport dimensions
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Browser extension available
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultPanel;