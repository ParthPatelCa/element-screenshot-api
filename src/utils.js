const fs = require('fs').promises;
const path = require('path');

/**
 * Clean up old screenshot files
 * @param {number} maxAgeHours - Maximum age in hours before cleanup
 * @returns {Promise<number>} Number of files deleted
 */
async function cleanupOldScreenshots(maxAgeHours = 24) {
  try {
    const screenshotsDir = path.join(__dirname, '..', 'screenshots');
    const files = await fs.readdir(screenshotsDir);
    
    let deletedCount = 0;
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
    const now = Date.now();

    for (const file of files) {
      if (file.startsWith('screenshot-') && (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'))) {
        const filePath = path.join(screenshotsDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
          console.log(`🗑️ Deleted old screenshot: ${file}`);
        }
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Cleanup failed:', error);
    return 0;
  }
}

/**
 * Format file size in human readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
function formatFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate a unique filename with timestamp
 * @param {string} prefix - Filename prefix
 * @param {string} extension - File extension
 * @returns {string} Unique filename
 */
function generateUniqueFilename(prefix = 'screenshot', extension = 'png') {
  const timestamp = new Date().toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .split('.')[0];
  
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}.${extension}`;
}

/**
 * Validate screenshot options
 * @param {object} options - Options to validate
 * @returns {object} Validation result
 */
function validateScreenshotOptions(options = {}) {
  const errors = [];
  const warnings = [];

  // Validate format
  if (options.format && !['png', 'jpeg', 'jpg'].includes(options.format)) {
    errors.push('Format must be one of: png, jpeg, jpg');
  }

  // Validate quality
  if (options.quality && (options.quality < 1 || options.quality > 100)) {
    errors.push('Quality must be between 1 and 100');
  }

  // Validate timeout
  if (options.timeout && (options.timeout < 1000 || options.timeout > 120000)) {
    warnings.push('Timeout should be between 1000ms and 120000ms for optimal performance');
  }

  // Validate viewport
  if (options.viewport) {
    if (options.viewport.width && (options.viewport.width < 320 || options.viewport.width > 3840)) {
      warnings.push('Viewport width should be between 320 and 3840 pixels');
    }
    if (options.viewport.height && (options.viewport.height < 240 || options.viewport.height > 2160)) {
      warnings.push('Viewport height should be between 240 and 2160 pixels');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get directory statistics
 * @param {string} dirPath - Directory path
 * @returns {Promise<object>} Directory stats
 */
async function getDirectoryStats(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    let totalSize = 0;
    let fileCount = 0;

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile()) {
        totalSize += stats.size;
        fileCount++;
      }
    }

    return {
      fileCount,
      totalSize: formatFileSize(totalSize),
      totalSizeBytes: totalSize
    };
  } catch (error) {
    return {
      fileCount: 0,
      totalSize: '0 Bytes',
      totalSizeBytes: 0,
      error: error.message
    };
  }
}

module.exports = {
  cleanupOldScreenshots,
  formatFileSize,
  generateUniqueFilename,
  validateScreenshotOptions,
  getDirectoryStats
};
