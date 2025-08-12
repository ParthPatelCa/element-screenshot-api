class ScreenshotAPI {
    constructor() {
        this.apiBase = window.location.origin;
        this.stats = {
            total: 0,
            successful: 0,
            responseTimes: [],
            totalSize: 0
        };
        this.history = JSON.parse(localStorage.getItem('screenshotHistory') || '[]');
        this.currentImageUrl = '';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkApiStatus();
        this.updateStats();
        this.loadHistory();
        this.updateExamples();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('screenshotForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.captureScreenshot();
        });

        // Format change handler
        document.getElementById('format').addEventListener('change', (e) => {
            const qualityGroup = document.getElementById('qualityGroup');
            qualityGroup.style.display = e.target.value === 'jpeg' ? 'block' : 'none';
        });

        // Quality slider
        document.getElementById('quality').addEventListener('input', (e) => {
            document.getElementById('qualityValue').textContent = e.target.value;
        });

        // Real-time API status check every 30 seconds
        setInterval(() => this.checkApiStatus(), 30000);
    }

    async checkApiStatus() {
        try {
            const response = await fetch(`${this.apiBase}/health`);
            const data = await response.json();
            
            if (response.ok && data.status === 'healthy') {
                this.updateApiStatus('online', 'API Online');
            } else {
                this.updateApiStatus('warning', 'API Issues');
            }
        } catch (error) {
            this.updateApiStatus('offline', 'API Offline');
        }
    }

    updateApiStatus(status, text) {
        const indicator = document.getElementById('apiStatusIndicator');
        const classes = {
            online: 'bg-success',
            warning: 'bg-warning', 
            offline: 'bg-danger'
        };
        
        indicator.innerHTML = `
            <span class="badge ${classes[status]}">
                <i class="fas fa-circle me-1"></i>${text}
            </span>
        `;
    }

    async captureScreenshot() {
        const form = document.getElementById('screenshotForm');
        const btn = document.getElementById('captureBtn');
        const spinner = document.getElementById('spinner');
        const statusBadge = document.getElementById('statusBadge');

        // Show loading state
        form.classList.add('loading');
        btn.disabled = true;
        spinner.classList.remove('d-none');
        statusBadge.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Capturing...';
        statusBadge.className = 'badge bg-warning status-badge';

        const startTime = Date.now();

        try {
            const requestData = this.buildRequestData();
            
            const response = await fetch(`${this.apiBase}/screenshot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${requestData.apiKey}`
                },
                body: JSON.stringify({
                    url: requestData.url,
                    selector: requestData.selector,
                    options: requestData.options
                })
            });

            const responseTime = Date.now() - startTime;
            const result = await response.json();

            if (response.ok && result.success) {
                this.handleSuccess(result, responseTime, requestData);
            } else {
                throw new Error(result.error || 'Unknown error occurred');
            }

        } catch (error) {
            this.handleError(error.message);
        } finally {
            // Reset loading state
            form.classList.remove('loading');
            btn.disabled = false;
            spinner.classList.add('d-none');
        }
    }

    buildRequestData() {
        return {
            apiKey: document.getElementById('apiKey').value,
            url: document.getElementById('url').value,
            selector: document.getElementById('selector').value,
            options: {
                format: document.getElementById('format').value,
                quality: document.getElementById('format').value === 'jpeg' 
                    ? parseInt(document.getElementById('quality').value) 
                    : undefined,
                viewport: {
                    width: parseInt(document.getElementById('width').value),
                    height: parseInt(document.getElementById('height').value)
                },
                timeout: parseInt(document.getElementById('timeout').value),
                delay: parseInt(document.getElementById('delay').value) || 0,
                waitForSelector: document.getElementById('waitForSelector').checked
            }
        };
    }

    handleSuccess(result, responseTime, requestData) {
        // Update stats
        this.stats.total++;
        this.stats.successful++;
        this.stats.responseTimes.push(responseTime);
        this.stats.totalSize += this.parseSizeToBytes(result.size);

        // Store in history
        const historyItem = {
            ...result,
            responseTime,
            requestData,
            timestamp: new Date().toISOString()
        };
        this.history.unshift(historyItem);
        this.history = this.history.slice(0, 50); // Keep only last 50
        localStorage.setItem('screenshotHistory', JSON.stringify(this.history));

        // Update UI
        this.displayResult(result, requestData);
        this.updateStats();
        this.loadHistory();
        this.showToast('success', 'Screenshot captured successfully!');

        // Update status
        const statusBadge = document.getElementById('statusBadge');
        statusBadge.innerHTML = '<i class="fas fa-check-circle me-1"></i>Success';
        statusBadge.className = 'badge bg-success status-badge';
    }

    handleError(message) {
        this.stats.total++;
        this.updateStats();
        
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorAlert').classList.remove('d-none');
        document.getElementById('results').classList.add('d-none');
        
        this.showToast('error', `Error: ${message}`);

        // Update status
        const statusBadge = document.getElementById('statusBadge');
        statusBadge.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i>Error';
        statusBadge.className = 'badge bg-danger status-badge';
    }

    displayResult(result, requestData) {
        this.currentImageUrl = `${this.apiBase}/screenshots/${result.filename}`;
        
        document.getElementById('imageContainer').innerHTML = `
            <img src="${this.currentImageUrl}" class="result-image" alt="Screenshot">
        `;
        
        document.getElementById('resultFilename').textContent = result.filename;
        document.getElementById('resultSize').textContent = result.size;
        document.getElementById('resultTimestamp').textContent = new Date(result.timestamp).toLocaleString();
        document.getElementById('resultUrl').textContent = requestData.url;
        document.getElementById('resultSelector').textContent = requestData.selector;
        document.getElementById('resultFormat').textContent = requestData.options.format.toUpperCase();
        
        document.getElementById('results').classList.remove('d-none');
        document.getElementById('errorAlert').classList.add('d-none');
    }

    updateStats() {
        document.getElementById('totalScreenshots').textContent = this.stats.total;
        document.getElementById('successfulCaptures').textContent = this.stats.successful;
        
        const avgTime = this.stats.responseTimes.length > 0 
            ? Math.round(this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length)
            : 0;
        document.getElementById('avgResponseTime').textContent = `${avgTime}ms`;
        
        document.getElementById('totalSize').textContent = this.formatFileSize(this.stats.totalSize);
    }

    loadHistory() {
        const container = document.getElementById('screenshotHistory');
        
        if (this.history.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted p-4">
                    <i class="fas fa-camera fa-3x mb-3 opacity-50"></i>
                    <p>No screenshots yet. Take your first screenshot above!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.history.map((item, index) => `
            <div class="history-item p-3 border-bottom" onclick="loadHistoryItem(${index})">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${item.filename}</h6>
                        <small class="text-muted">
                            <i class="fas fa-globe me-1"></i>${this.truncateUrl(item.requestData.url)}
                            <i class="fas fa-crosshairs ms-2 me-1"></i><code>${item.requestData.selector}</code>
                        </small>
                    </div>
                    <div class="text-end">
                        <div class="badge bg-primary">${item.size}</div>
                        <div class="small text-muted">${this.timeAgo(item.timestamp)}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateExamples() {
        // Update cURL example with current form values
        const updateExampleCode = () => {
            const url = document.getElementById('url').value;
            const selector = document.getElementById('selector').value;
            const format = document.getElementById('format').value;
            const width = document.getElementById('width').value;
            const height = document.getElementById('height').value;

            document.getElementById('curlExample').textContent = `curl -X POST ${this.apiBase}/screenshot \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer supersecurekey" \\
  -d '{
    "url": "${url}",
    "selector": "${selector}",
    "options": {
      "format": "${format}",
      "viewport": {"width": ${width}, "height": ${height}}
    }
  }'`;

            document.getElementById('jsExample').textContent = `const response = await fetch('${this.apiBase}/screenshot', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer supersecurekey'
  },
  body: JSON.stringify({
    url: '${url}',
    selector: '${selector}',
    options: {
      format: '${format}',
      viewport: {width: ${width}, height: ${height}}
    }
  })
});

const result = await response.json();
console.log('Screenshot:', result.filename);`;
        };

        // Update examples when form changes
        ['url', 'selector', 'format', 'width', 'height'].forEach(id => {
            document.getElementById(id).addEventListener('input', updateExampleCode);
            document.getElementById(id).addEventListener('change', updateExampleCode);
        });

        updateExampleCode();
    }

    showToast(type, message) {
        const toastId = type === 'success' ? 'successToast' : 'errorToast';
        const bodyId = type === 'success' ? 'successToastBody' : 'errorToastBody';
        
        document.getElementById(bodyId).textContent = message;
        
        const toast = new bootstrap.Toast(document.getElementById(toastId));
        toast.show();
    }

    parseSizeToBytes(sizeStr) {
        const match = sizeStr.match(/(\d+(?:\.\d+)?)\s*(KB|MB|GB|Bytes)/i);
        if (!match) return 0;
        
        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        
        const multipliers = {
            'bytes': 1,
            'kb': 1024,
            'mb': 1024 * 1024,
            'gb': 1024 * 1024 * 1024
        };
        
        return value * (multipliers[unit] || 1);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    truncateUrl(url) {
        return url.length > 40 ? url.substring(0, 40) + '...' : url;
    }

    timeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
}

// Global functions for UI interactions
function setExample(type) {
    const examples = {
        github: {
            url: 'https://github.com',
            selector: '.Header'
        },
        google: {
            url: 'https://www.google.com',
            selector: '#searchform'
        },
        bootstrap: {
            url: 'https://getbootstrap.com',
            selector: '.navbar'
        },
        youtube: {
            url: 'https://www.youtube.com',
            selector: '#masthead'
        }
    };
    
    const example = examples[type];
    if (example) {
        document.getElementById('url').value = example.url;
        document.getElementById('selector').value = example.selector;
    }
}

function clearResults() {
    document.getElementById('results').classList.add('d-none');
    document.getElementById('errorAlert').classList.add('d-none');
    
    const statusBadge = document.getElementById('statusBadge');
    statusBadge.innerHTML = '<i class="fas fa-circle me-1"></i>Ready';
    statusBadge.className = 'badge bg-primary status-badge';
}

function clearHistory() {
    if (confirm('Are you sure you want to clear the screenshot history?')) {
        localStorage.removeItem('screenshotHistory');
        window.screenshotAPI.history = [];
        window.screenshotAPI.stats = {
            total: 0,
            successful: 0,
            responseTimes: [],
            totalSize: 0
        };
        window.screenshotAPI.updateStats();
        window.screenshotAPI.loadHistory();
        window.screenshotAPI.showToast('success', 'History cleared successfully!');
    }
}

function downloadImage() {
    if (window.screenshotAPI.currentImageUrl) {
        const link = document.createElement('a');
        link.href = window.screenshotAPI.currentImageUrl;
        link.download = document.getElementById('resultFilename').textContent;
        link.click();
    }
}

function copyImageUrl() {
    if (window.screenshotAPI.currentImageUrl) {
        navigator.clipboard.writeText(window.screenshotAPI.currentImageUrl).then(() => {
            window.screenshotAPI.showToast('success', 'Image URL copied to clipboard!');
        });
    }
}

function shareImage() {
    if (navigator.share && window.screenshotAPI.currentImageUrl) {
        navigator.share({
            title: 'Screenshot',
            url: window.screenshotAPI.currentImageUrl
        });
    } else {
        copyImageUrl();
    }
}

function copyToClipboard(elementId) {
    const text = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(text).then(() => {
        window.screenshotAPI.showToast('success', 'Code copied to clipboard!');
    });
}

function loadHistoryItem(index) {
    const item = window.screenshotAPI.history[index];
    if (item) {
        window.screenshotAPI.displayResult(item, item.requestData);
        window.screenshotAPI.currentImageUrl = `${window.screenshotAPI.apiBase}/screenshots/${item.filename}`;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.screenshotAPI = new ScreenshotAPI();
});
