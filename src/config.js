/**
 * Configuration loader and validator
 * Manages environment variables and application settings
 */

const path = require('path');

/**
 * Load and validate configuration from environment variables
 * @returns {object} Configuration object
 */
function loadConfig() {
  // Default configuration
  const config = {
    // Server settings
    port: parseInt(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // API settings
    apiKey: process.env.API_KEY,
    enableAuth: process.env.ENABLE_AUTH !== 'false', // Default to true
    
    // Screenshot settings
    screenshotsDir: process.env.SCREENSHOTS_DIR || path.join(__dirname, '..', 'screenshots'),
    defaultFormat: process.env.DEFAULT_FORMAT || 'png',
    defaultQuality: parseInt(process.env.DEFAULT_QUALITY) || 90,
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    
    // Browser settings
    browserTimeout: parseInt(process.env.BROWSER_TIMEOUT) || 30000,
    defaultViewport: {
      width: parseInt(process.env.DEFAULT_VIEWPORT_WIDTH) || 1920,
      height: parseInt(process.env.DEFAULT_VIEWPORT_HEIGHT) || 1080
    },
    
    // Rate limiting
    rateLimitEnabled: process.env.RATE_LIMIT_ENABLED === 'true',
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    
    // Cleanup settings
    autoCleanup: process.env.AUTO_CLEANUP === 'true',
    cleanupMaxAge: parseInt(process.env.CLEANUP_MAX_AGE) || 24, // hours
    
    // Storage settings (future)
    storageType: process.env.STORAGE_TYPE || 'local', // local, s3, gcs
    s3: {
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    },
    
    // Webhook settings (future)
    webhookUrl: process.env.WEBHOOK_URL,
    
    // Security settings
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'],
    maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb'
  };

  return config;
}

/**
 * Validate required configuration
 * @param {object} config - Configuration object to validate
 * @returns {object} Validation result
 */
function validateConfig(config) {
  const errors = [];
  const warnings = [];

  // Required for production
  if (config.nodeEnv === 'production') {
    if (!config.apiKey && config.enableAuth) {
      errors.push('API_KEY is required in production when authentication is enabled');
    }
  }

  // Port validation
  if (config.port < 1 || config.port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }

  // Format validation
  if (!['png', 'jpeg', 'jpg'].includes(config.defaultFormat)) {
    errors.push('DEFAULT_FORMAT must be one of: png, jpeg, jpg');
  }

  // Quality validation
  if (config.defaultQuality < 1 || config.defaultQuality > 100) {
    errors.push('DEFAULT_QUALITY must be between 1 and 100');
  }

  // Timeout validation
  if (config.browserTimeout < 1000) {
    warnings.push('BROWSER_TIMEOUT is very low, consider increasing for better reliability');
  }

  // Viewport validation
  if (config.defaultViewport.width < 320 || config.defaultViewport.width > 3840) {
    warnings.push('DEFAULT_VIEWPORT_WIDTH should be between 320 and 3840 pixels');
  }

  if (config.defaultViewport.height < 240 || config.defaultViewport.height > 2160) {
    warnings.push('DEFAULT_VIEWPORT_HEIGHT should be between 240 and 2160 pixels');
  }

  // Development warnings
  if (config.nodeEnv === 'development') {
    if (!config.apiKey && config.enableAuth) {
      warnings.push('No API_KEY set in development mode. Consider setting one for testing authentication.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get configuration with validation
 * @returns {object} Validated configuration
 */
function getConfig() {
  const config = loadConfig();
  const validation = validateConfig(config);

  if (!validation.isValid) {
    console.error('Configuration validation failed:');
    validation.errors.forEach(error => console.error(`  ❌ ${error}`));
    process.exit(1);
  }

  if (validation.warnings.length > 0) {
    console.warn('Configuration warnings:');
    validation.warnings.forEach(warning => console.warn(`  ⚠️  ${warning}`));
  }

  return config;
}

/**
 * Get browser launch options based on configuration
 * @param {object} config - Configuration object
 * @returns {object} Puppeteer launch options
 */
function getBrowserOptions(config) {
  const baseOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  };

  // Add single-process for low memory environments
  if (process.env.SINGLE_PROCESS === 'true') {
    baseOptions.args.push('--single-process');
  }

  // Development mode options
  if (config.nodeEnv === 'development') {
    // Can add debug options here if needed
  }

  return baseOptions;
}

/**
 * Print configuration summary
 * @param {object} config - Configuration object
 */
function printConfigSummary(config) {
  console.log('\n📋 Configuration Summary:');
  console.log(`   Port: ${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Authentication: ${config.enableAuth ? 'Enabled' : 'Disabled'}`);
  console.log(`   Rate Limiting: ${config.rateLimitEnabled ? 'Enabled' : 'Disabled'}`);
  console.log(`   Screenshots Directory: ${config.screenshotsDir}`);
  console.log(`   Default Format: ${config.defaultFormat}`);
  console.log(`   Auto Cleanup: ${config.autoCleanup ? 'Enabled' : 'Disabled'}`);
  
  if (config.nodeEnv === 'development') {
    console.log(`   API Key: ${config.apiKey ? '***configured***' : 'not set'}`);
  }
  
  console.log('');
}

module.exports = {
  getConfig,
  loadConfig,
  validateConfig,
  getBrowserOptions,
  printConfigSummary
};
