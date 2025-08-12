/**
 * API Key Authentication Middleware
 * Validates bearer token from Authorization header
 */

/**
 * Check API key middleware
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
function checkApiKey(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing Authorization header'
      });
    }

    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid Authorization header format. Use: Bearer <token>'
      });
    }

    const userKey = parts[1];
    const validApiKey = process.env.API_KEY;

    if (!validApiKey) {
      console.error('API_KEY not configured in environment variables');
      return res.status(500).json({
        error: 'Server Configuration Error',
        message: 'API authentication not properly configured'
      });
    }

    if (userKey !== validApiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key'
      });
    }

    // API key is valid, proceed to next middleware
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication Error',
      message: 'Error validating API key'
    });
  }
}

/**
 * Optional API key middleware (allows requests without auth for testing)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
function optionalApiKey(req, res, next) {
  const authHeader = req.headers.authorization;
  
  // If no auth header, proceed without validation
  if (!authHeader) {
    return next();
  }

  // If auth header exists, validate it
  return checkApiKey(req, res, next);
}

/**
 * Generate a new API key (utility function)
 * @param {number} length - Length of the API key
 * @returns {string} Generated API key
 */
function generateApiKey(length = 32) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

/**
 * Rate limiting by API key (basic implementation)
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 */
function createRateLimiter(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  const requests = new Map();

  return function rateLimitMiddleware(req, res, next) {
    const apiKey = req.headers.authorization?.split(' ')[1];
    const now = Date.now();
    
    if (!apiKey) {
      return next(); // Skip rate limiting if no API key
    }

    if (!requests.has(apiKey)) {
      requests.set(apiKey, []);
    }

    const userRequests = requests.get(apiKey);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
    requests.set(apiKey, validRequests);

    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Rate Limit Exceeded',
        message: `Too many requests. Limit: ${maxRequests} per ${windowMs / 1000} seconds`,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Add current request
    validRequests.push(now);
    next();
  };
}

module.exports = {
  checkApiKey,
  optionalApiKey,
  generateApiKey,
  createRateLimiter
};
