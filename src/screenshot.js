const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

/**
 * Take a screenshot of a specific element on a webpage
 * @param {string} url - The URL to navigate to
 * @param {string} selector - CSS selector for the element to screenshot
 * @param {object} options - Screenshot options
 * @returns {object} Result with filename, path, and size
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

    // Wait for selector if requested
    if (mergedOptions.waitForSelector) {
      console.log(`🔍 Waiting for selector: ${selector}`);
      await page.waitForSelector(selector, { 
        timeout: mergedOptions.timeout 
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
    const filename = `screenshot-${urlHash}-${selectorHash}-${timestamp}.${mergedOptions.format}`;
    
    const screenshotsDir = path.join(__dirname, '..', 'screenshots');
    const filepath = path.join(screenshotsDir, filename);

    // Take screenshot of the element
    console.log(`📸 Taking screenshot of element: ${selector}`);
    const screenshotOptions = {
      path: filepath,
      type: mergedOptions.format
    };

    if (mergedOptions.format === 'jpeg') {
      screenshotOptions.quality = mergedOptions.quality;
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
      bytes: stats.size
    };

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
 * @param {string} selector - CSS selector to validate
 * @returns {boolean} True if valid
 */
function isValidSelector(selector) {
  if (!selector || typeof selector !== 'string') return false;
  
  // Basic CSS selector validation
  const selectorRegex = /^[a-zA-Z0-9#.\-_\[\]=":',\s()>+~*]+$/;
  return selectorRegex.test(selector);
}

module.exports = {
  takeScreenshot,
  isValidUrl,
  isValidSelector
};
