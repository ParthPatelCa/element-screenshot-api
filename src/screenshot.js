const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

/**
 * Take a screenshot of a specific element or full page on a webpage
 * @param {string} url - The URL to navigate to
 * @param {string|array} selector - CSS selector(s) for the element(s) to screenshot
 * @param {object} options - Screenshot options
 * @returns {object} Result with filename, path, and size (or array for multiple selectors)
 */
async function takeScreenshot(url, selector, options = {}) {
  let browser;
  
  try {
    // Default options
    const defaultOptions = {
      format: 'png',
      quality: 90,
      fullPage: false,
      waitForSelector: true,
      timeout: 30000,
      viewport: {
        width: 1920,
        height: 1080
      },
      viewportWidth: null,
      viewportHeight: null,
      browserOptions: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    };

    const mergedOptions = { ...defaultOptions, ...options };
    mergedOptions.viewport = { ...defaultOptions.viewport, ...options.viewport };
    mergedOptions.browserOptions = { ...defaultOptions.browserOptions, ...options.browserOptions };

    // Handle custom viewport dimensions
    if (mergedOptions.viewportWidth && mergedOptions.viewportHeight) {
      // Validate viewport dimensions
      const width = parseInt(mergedOptions.viewportWidth);
      const height = parseInt(mergedOptions.viewportHeight);
      
      if (width < 100 || width > 3840 || height < 100 || height > 2160) {
        throw new Error('Viewport dimensions must be between 100-3840 (width) and 100-2160 (height)');
      }
      
      mergedOptions.viewport.width = width;
      mergedOptions.viewport.height = height;
    }

    // Launch browser
    browser = await puppeteer.launch(mergedOptions.browserOptions);
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport(mergedOptions.viewport);

    // Navigate to URL
    console.log(`📖 Navigating to: ${url}`);
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: mergedOptions.timeout 
    });

    // Wait for additional delay if specified
    if (mergedOptions.delay && mergedOptions.delay > 0) {
      console.log(`⏳ Waiting for ${mergedOptions.delay}ms delay`);
      await page.waitForTimeout(mergedOptions.delay);
    }

    // Check if we should capture full page
    if (mergedOptions.fullPage) {
      return await captureFullPage(page, url, mergedOptions);
    }

    // Check if selector is an array (multiple selectors)
    if (Array.isArray(selector)) {
      return await captureMultipleSelectors(page, url, selector, mergedOptions);
    }

    // Single selector capture
    return await captureSingleSelector(page, url, selector, mergedOptions);

  } catch (error) {
    console.error('Screenshot failed:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Capture full page screenshot
 * @param {object} page - Puppeteer page object
 * @param {string} url - URL being captured
 * @param {object} options - Screenshot options
 * @returns {object} Screenshot result
 */
async function captureFullPage(page, url, options) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const urlHash = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
  const filename = `fullpage-${urlHash}-${timestamp}.${options.format}`;
  
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  const filepath = path.join(screenshotsDir, filename);

  console.log(`📸 Taking full page screenshot`);
  const screenshotOptions = {
    path: filepath,
    type: options.format,
    fullPage: true
  };

  if (options.format === 'jpeg') {
    screenshotOptions.quality = options.quality;
  }

  await page.screenshot(screenshotOptions);

  const stats = await fs.stat(filepath);
  const fileSizeKB = Math.round(stats.size / 1024);

  console.log(`✅ Full page screenshot saved: ${filename} (${fileSizeKB}KB)`);

  return {
    filename,
    path: filepath,
    size: `${fileSizeKB}KB`,
    bytes: stats.size,
    type: 'fullPage'
  };
}

/**
 * Capture multiple selectors in one request
 * @param {object} page - Puppeteer page object
 * @param {string} url - URL being captured
 * @param {array} selectors - Array of CSS selectors
 * @param {object} options - Screenshot options
 * @returns {array} Array of screenshot results
 */
async function captureMultipleSelectors(page, url, selectors, options) {
  const results = [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  console.log(`📸 Capturing ${selectors.length} selectors`);
  
  for (let i = 0; i < selectors.length; i++) {
    const selector = selectors[i];
    
    try {
      // Wait for selector if requested
      if (options.waitForSelector) {
        console.log(`🔍 Waiting for selector ${i + 1}/${selectors.length}: ${selector}`);
        await page.waitForSelector(selector, { 
          timeout: options.timeout 
        });
      }

      // Find the element
      const element = await page.$(selector);
      if (!element) {
        results.push({
          selector,
          success: false,
          error: `Element not found: ${selector}`
        });
        continue;
      }

      // Generate filename for this selector
      const urlHash = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
      const selectorHash = crypto.createHash('md5').update(selector).digest('hex').substring(0, 8);
      const filename = `multi-${urlHash}-${selectorHash}-${i + 1}-${timestamp}.${options.format}`;
      
      const screenshotsDir = path.join(__dirname, '..', 'screenshots');
      const filepath = path.join(screenshotsDir, filename);

      // Take screenshot of the element
      const screenshotOptions = {
        path: filepath,
        type: options.format
      };

      if (options.format === 'jpeg') {
        screenshotOptions.quality = options.quality;
      }

      await element.screenshot(screenshotOptions);

      // Get file size
      const stats = await fs.stat(filepath);
      const fileSizeKB = Math.round(stats.size / 1024);

      console.log(`✅ Screenshot ${i + 1}/${selectors.length} saved: ${filename} (${fileSizeKB}KB)`);

      results.push({
        selector,
        success: true,
        filename,
        path: filepath,
        size: `${fileSizeKB}KB`,
        bytes: stats.size
      });

    } catch (error) {
      console.error(`❌ Screenshot ${i + 1}/${selectors.length} failed for ${selector}:`, error.message);
      results.push({
        selector,
        success: false,
        error: error.message
      });
    }
  }

  return {
    type: 'multipleSelectors',
    totalSelectors: selectors.length,
    successCount: results.filter(r => r.success).length,
    failureCount: results.filter(r => !r.success).length,
    results
  };
}

/**
 * Capture single selector screenshot
 * @param {object} page - Puppeteer page object
 * @param {string} url - URL being captured
 * @param {string} selector - CSS selector
 * @param {object} options - Screenshot options
 * @returns {object} Screenshot result
 */
async function captureSingleSelector(page, url, selector, options) {
  // Wait for selector if requested
  if (options.waitForSelector) {
    console.log(`🔍 Waiting for selector: ${selector}`);
    await page.waitForSelector(selector, { 
      timeout: options.timeout 
    });
  }

  // Find the element
  const element = await page.$(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  // Generate filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const urlHash = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
  const selectorHash = crypto.createHash('md5').update(selector).digest('hex').substring(0, 8);
  const filename = `screenshot-${urlHash}-${selectorHash}-${timestamp}.${options.format}`;
  
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  const filepath = path.join(screenshotsDir, filename);

  // Take screenshot of the element
  console.log(`📸 Taking screenshot of element: ${selector}`);
  const screenshotOptions = {
    path: filepath,
    type: options.format
  };

  if (options.format === 'jpeg') {
    screenshotOptions.quality = options.quality;
  }

  await element.screenshot(screenshotOptions);

  // Get file size
  const stats = await fs.stat(filepath);
  const fileSizeKB = Math.round(stats.size / 1024);

  console.log(`✅ Screenshot saved: ${filename} (${fileSizeKB}KB)`);

  return {
    filename,
    path: filepath,
    size: `${fileSizeKB}KB`,
    bytes: stats.size,
    type: 'singleSelector'
  };
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate CSS selector format (basic validation)
 * @param {string|array} selector - CSS selector(s) to validate
 * @returns {boolean} True if valid
 */
function isValidSelector(selector) {
  if (!selector) return false;
  
  // Handle array of selectors
  if (Array.isArray(selector)) {
    if (selector.length === 0) return false;
    return selector.every(s => isValidSelector(s));
  }
  
  if (typeof selector !== 'string') return false;
  
  // Basic CSS selector validation
  const selectorRegex = /^[a-zA-Z0-9#.\-_\[\]=":',\s()>+~*]+$/;
  return selectorRegex.test(selector);
}

module.exports = {
  takeScreenshot,
  isValidUrl,
  isValidSelector
};
