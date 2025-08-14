import React, { useState, useEffect } from 'react';
import Header from './Header';
import ConfigurationPanel from './ConfigurationPanel';
import ResultPanel from './ResultPanel';
import Footer from './Footer';

const ScreenshotCaptureProfessional = () => {
  // State management
  const [url, setUrl] = useState('https://github.com');
  const [selector, setSelector] = useState('.Header');
  const [device, setDevice] = useState('desktop');
  const [delay, setDelay] = useState(0);
  const [image, setImage] = useState(null);
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  
  // Advanced options
  const [fullPage, setFullPage] = useState(false);
  const [customViewport, setCustomViewport] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1920);
  const [viewportHeight, setViewportHeight] = useState(1080);
  const [multipleSelectors, setMultipleSelectors] = useState(false);
  const [selectorList, setSelectorList] = useState('');

  // Check API health on component mount
  useEffect(() => {
    checkApiHealth();
    const interval = setInterval(checkApiHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
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
        throw new Error(data.message || 'Failed to capture screenshot');
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

  const handleClear = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header apiStatus={apiStatus} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <ConfigurationPanel
            url={url}
            setUrl={setUrl}
            selector={selector}
            setSelector={setSelector}
            device={device}
            setDevice={setDevice}
            delay={delay}
            setDelay={setDelay}
            fullPage={fullPage}
            setFullPage={setFullPage}
            customViewport={customViewport}
            setCustomViewport={setCustomViewport}
            viewportWidth={viewportWidth}
            setViewportWidth={setViewportWidth}
            viewportHeight={viewportHeight}
            setViewportHeight={setViewportHeight}
            multipleSelectors={multipleSelectors}
            setMultipleSelectors={setMultipleSelectors}
            selectorList={selectorList}
            setSelectorList={setSelectorList}
            loading={loading}
            error={error}
            onCapture={handleCapture}
            onClear={handleClear}
          />
          
          <ResultPanel
            loading={loading}
            image={image}
            images={images}
            device={device}
            customViewport={customViewport}
            viewportWidth={viewportWidth}
            viewportHeight={viewportHeight}
            delay={delay}
            fullPage={fullPage}
            onDownload={handleDownload}
            onDownloadAll={handleDownloadAll}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ScreenshotCaptureProfessional;