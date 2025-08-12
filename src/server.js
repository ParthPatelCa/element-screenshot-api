const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const { takeScreenshot, isValidSelector } = require('./screenshot');
const { checkApiKey, optionalApiKey, createRateLimiter } = require('./auth');
const { getConfig, printConfigSummary } = require('./config');

// Load and validate configuration
const config = getConfig();

const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigins,
  credentials: true
}));
app.use(express.json({ limit: config.maxRequestSize }));
app.use(express.urlencoded({ extended: true, limit: config.maxRequestSize }));

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/screenshots', express.static(config.screenshotsDir));

// Rate limiting (if enabled)
if (config.rateLimitEnabled) {
  const rateLimiter = createRateLimiter(config.rateLimitMax, config.rateLimitWindow);
  app.use('/screenshot', rateLimiter);
}

// Ensure screenshots directory exists
async function ensureScreenshotsDir() {
  try {
    await fs.access(config.screenshotsDir);
  } catch {
    await fs.mkdir(config.screenshotsDir, { recursive: true });
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'DOM Element Screenshot API',
    version: '1.0.0',
    features: [
      'Capture screenshots of specific DOM elements',
      'Customizable viewport and options',
      'PNG and JPEG format support',
      'API key authentication',
      'Rate limiting'
    ],
    endpoints: {
      'POST /screenshot': 'Take a screenshot of a specific element',
      'GET /health': 'Health check endpoint',
      'GET /stats': 'Get API statistics'
    },
    documentation: 'https://github.com/ParthPatelCa/element-screenshot-api'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    authentication: config.enableAuth ? 'enabled' : 'disabled'
  });
});

// Stats endpoint (no auth required)
app.get('/stats', async (req, res) => {
  try {
    const { getDirectoryStats } = require('./utils');
    const stats = await getDirectoryStats(config.screenshotsDir);
    
    res.json({
      screenshots: {
        count: stats.fileCount,
        totalSize: stats.totalSize
      },
      config: {
        maxFileSize: `${config.maxFileSize / (1024 * 1024)}MB`,
        defaultFormat: config.defaultFormat,
        autoCleanup: config.autoCleanup
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get stats',
      message: error.message
    });
  }
});

// Screenshot endpoint with authentication
const authMiddleware = config.enableAuth ? checkApiKey : optionalApiKey;
app.post('/screenshot', authMiddleware, async (req, res) => {
  try {
    const { 
      url, 
      selector, 
      options = {},
      fullPage = false,
      viewportWidth,
      viewportHeight
    } = req.body;

    // Validation
    if (!url) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'URL is required',
        required: ['url'],
        received: Object.keys(req.body)
      });
    }

    // If not full page, selector is required
    if (!fullPage && !selector) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Selector is required when fullPage is false',
        required: ['url', 'selector'],
        received: Object.keys(req.body)
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        error: 'Invalid URL format',
        message: 'Please provide a valid URL starting with http:// or https://'
      });
    }

    // Validate selector(s) if provided
    if (selector && !isValidSelector(selector)) {
      return res.status(400).json({
        error: 'Invalid selector format',
        message: 'Please provide a valid CSS selector or array of selectors'
      });
    }

    // Merge with default options
    const mergedOptions = {
      format: config.defaultFormat,
      quality: config.defaultQuality,
      timeout: config.browserTimeout,
      viewport: { ...config.defaultViewport },
      fullPage,
      viewportWidth,
      viewportHeight,
      ...options
    };

    // Take screenshot
    const screenshotType = fullPage ? 'full page' : Array.isArray(selector) ? `${selector.length} selectors` : 'single selector';
    console.log(`📸 Screenshot request: ${url} -> ${screenshotType}`);
    
    const result = await takeScreenshot(url, selector, mergedOptions);

    // Handle different result types
    if (result.type === 'multipleSelectors') {
      res.json({
        success: true,
        type: 'multipleSelectors',
        totalSelectors: result.totalSelectors,
        successCount: result.successCount,
        failureCount: result.failureCount,
        results: result.results.map(r => ({
          selector: r.selector,
          success: r.success,
          filename: r.success ? r.filename : undefined,
          size: r.success ? r.size : undefined,
          error: !r.success ? r.error : undefined
        })),
        format: mergedOptions.format,
        viewport: mergedOptions.viewport,
        timestamp: new Date().toISOString(),
        message: `Captured ${result.successCount}/${result.totalSelectors} screenshots successfully`
      });
    } else {
      res.json({
        success: true,
        type: result.type || 'singleSelector',
        filename: result.filename,
        size: result.size,
        format: mergedOptions.format,
        viewport: mergedOptions.viewport,
        timestamp: new Date().toISOString(),
        message: 'Screenshot captured successfully'
      });
    }

  } catch (error) {
    console.error('Screenshot error:', error);
    
    // Determine error type and status code
    let statusCode = 500;
    let errorType = 'Screenshot Failed';
    
    if (error.message.includes('Element not found')) {
      statusCode = 404;
      errorType = 'Element Not Found';
    } else if (error.message.includes('timeout')) {
      statusCode = 408;
      errorType = 'Request Timeout';
    } else if (error.message.includes('net::ERR_')) {
      statusCode = 400;
      errorType = 'Network Error';
    } else if (error.message.includes('Viewport dimensions')) {
      statusCode = 400;
      errorType = 'Invalid Viewport';
    }

    res.status(statusCode).json({
      error: errorType,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Device viewport configurations
const DEVICE_VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
};

// Frontend API endpoint - returns base64 image
app.post('/api/screenshot', async (req, res) => {
  try {
    const { 
      url, 
      selector, 
      device = 'desktop', 
      delay = 0,
      fullPage = false,
      viewportWidth,
      viewportHeight
    } = req.body;

    // Validation
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    // If not full page, selector is required
    if (!fullPage && !selector) {
      return res.status(400).json({
        success: false,
        message: 'Selector is required when fullPage is false'
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid URL starting with http:// or https://'
      });
    }

    // Get viewport for device or use custom dimensions
    let viewport;
    if (viewportWidth && viewportHeight) {
      viewport = { 
        width: parseInt(viewportWidth), 
        height: parseInt(viewportHeight) 
      };
    } else {
      viewport = DEVICE_VIEWPORTS[device] || DEVICE_VIEWPORTS.desktop;
    }

    // Prepare options
    const options = {
      format: 'png',
      viewport,
      delay: Math.max(0, delay),
      timeout: 30000,
      waitForSelector: true,
      fullPage,
      viewportWidth: viewportWidth ? parseInt(viewportWidth) : null,
      viewportHeight: viewportHeight ? parseInt(viewportHeight) : null
    };

    // Take screenshot and get base64
    const screenshotType = fullPage ? 'full page' : Array.isArray(selector) ? `${selector.length} selectors` : 'single selector';
    console.log(`📱 Frontend screenshot request: ${url} -> ${screenshotType} (${device})`);
    
    const result = await takeScreenshot(url, selector, options);

    // Handle different result types
    if (result.type === 'multipleSelectors') {
      // For multiple selectors, return array of base64 images
      const images = [];
      
      for (const item of result.results) {
        if (item.success) {
          try {
            const imageBuffer = await fs.readFile(item.path);
            const base64Image = imageBuffer.toString('base64');
            
            images.push({
              selector: item.selector,
              success: true,
              image: base64Image,
              size: item.size
            });
            
            // Clean up the file
            await fs.unlink(item.path);
          } catch (error) {
            console.warn('Failed to process image for selector:', item.selector, error.message);
            images.push({
              selector: item.selector,
              success: false,
              error: 'Failed to process image'
            });
          }
        } else {
          images.push({
            selector: item.selector,
            success: false,
            error: item.error
          });
        }
      }
      
      res.json({
        success: true,
        type: 'multipleSelectors',
        totalSelectors: result.totalSelectors,
        successCount: result.successCount,
        failureCount: result.failureCount,
        images,
        device,
        viewport,
        timestamp: new Date().toISOString()
      });
      
    } else {
      // Single screenshot result
      const imageBuffer = await fs.readFile(result.path);
      const base64Image = imageBuffer.toString('base64');

      // Clean up the file after sending
      try {
        await fs.unlink(result.path);
      } catch (error) {
        console.warn('Failed to clean up temporary file:', error.message);
      }

      res.json({
        success: true,
        type: result.type || 'singleSelector',
        image: base64Image,
        device,
        viewport,
        size: result.size,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Frontend screenshot error:', error);
    
    let message = 'Failed to capture screenshot';
    if (error.message.includes('Element not found')) {
      message = 'Element not found with the provided selector';
    } else if (error.message.includes('timeout')) {
      message = 'Request timed out - the page took too long to load';
    } else if (error.message.includes('net::ERR_')) {
      message = 'Network error - could not reach the specified URL';
    } else if (error.message.includes('Viewport dimensions')) {
      message = 'Invalid viewport dimensions provided';
    }

    res.status(500).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint Not Found',
    message: `${req.method} ${req.path} is not a valid endpoint`,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /stats',
      'POST /screenshot'
    ],
    timestamp: new Date().toISOString()
  });
});

// Cleanup function
async function performCleanup() {
  if (config.autoCleanup) {
    try {
      const { cleanupOldScreenshots } = require('./utils');
      const deletedCount = await cleanupOldScreenshots(config.cleanupMaxAge);
      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} old screenshot(s)`);
      }
    } catch (error) {
      console.error('Cleanup failed:', error.message);
    }
  }
}

// Start server
async function startServer() {
  try {
    await ensureScreenshotsDir();
    
    // Print configuration summary
    printConfigSummary(config);
    
    // Perform initial cleanup
    await performCleanup();
    
    // Set up periodic cleanup (every hour)
    if (config.autoCleanup) {
      setInterval(performCleanup, 60 * 60 * 1000);
    }
    
    app.listen(config.port, () => {
      console.log(`🚀 Element Screenshot API running on port ${config.port}`);
      console.log(`📁 Screenshots directory: ${config.screenshotsDir}`);
      console.log(`🌐 API available at: http://localhost:${config.port}`);
      console.log(`🔐 Authentication: ${config.enableAuth ? 'Required' : 'Optional'}`);
      
      if (config.nodeEnv === 'development') {
        console.log(`\n📖 Try it out:`);
        console.log(`curl -X POST http://localhost:${config.port}/screenshot \\`);
        console.log(`  -H "Content-Type: application/json" \\`);
        if (config.enableAuth && config.apiKey) {
          console.log(`  -H "Authorization: Bearer ${config.apiKey}" \\`);
        }
        console.log(`  -d '{"url":"https://example.com","selector":"h1"}'`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  process.exit(0);
});

startServer();
