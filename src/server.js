const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const { takeScreenshot } = require('./screenshot');
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
    const { url, selector, options = {} } = req.body;

    // Validation
    if (!url || !selector) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Both url and selector are required',
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

    // Merge with default options
    const mergedOptions = {
      format: config.defaultFormat,
      quality: config.defaultQuality,
      timeout: config.browserTimeout,
      viewport: { ...config.defaultViewport },
      ...options
    };

    // Take screenshot
    console.log(`📸 Screenshot request: ${url} -> ${selector}`);
    const result = await takeScreenshot(url, selector, mergedOptions);

    res.json({
      success: true,
      filename: result.filename,
      size: result.size,
      format: mergedOptions.format,
      viewport: mergedOptions.viewport,
      timestamp: new Date().toISOString(),
      // Don't expose full file path in API response for security
      message: 'Screenshot captured successfully'
    });

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
    }

    res.status(statusCode).json({
      error: errorType,
      message: error.message,
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
