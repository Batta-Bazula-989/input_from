// Security configuration
const SECURITY_CONFIG = {
    MAX_REQUESTS_PER_HOUR: 10,
    ALLOWED_CHARS_REGEX: /^[a-zA-Z0-9\s\-\.\_]+$/,
    MIN_REQUEST_INTERVAL: 60000, // 1 minute between requests (60 seconds)
    SESSION_TOKEN: null
};

// Generate session token for CSRF protection
function generateSessionToken() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Initialize session token
SECURITY_CONFIG.SESSION_TOKEN = generateSessionToken();

// Storage helper functions
function getStoredRequests() {
    try {
        return JSON.parse(localStorage.getItem('requests') || '[]');
    } catch (error) {
        console.error('Error reading stored requests:', error);
        return [];
    }
}

function setStoredRequests(requests) {
    try {
        localStorage.setItem('requests', JSON.stringify(requests));
    } catch (error) {
        console.error('Error storing requests:', error);
    }
}

// Rate limiting functionality
function checkRateLimit() {
    const now = Date.now();
    const requests = getStoredRequests();

    // Remove requests older than 1 hour
    const recentRequests = requests.filter(time => now - time < 3600000);

    if (recentRequests.length >= SECURITY_CONFIG.MAX_REQUESTS_PER_HOUR) {
        return false;
    }

    // Check minimum interval between requests
    if (recentRequests.length > 0) {
        const lastRequest = Math.max(...recentRequests);
        if (now - lastRequest < SECURITY_CONFIG.MIN_REQUEST_INTERVAL) {
            return false;
        }
    }

    // Add current request
    recentRequests.push(now);
    setStoredRequests(recentRequests);

    // Update counter display
    updateRateLimitDisplay();

    return true;
}

// Update rate limit counter display
function updateRateLimitDisplay() {
    const now = Date.now();
    const requests = getStoredRequests();
    const recentRequests = requests.filter(time => now - time < 3600000);

    // Clean up old requests in storage
    if (requests.length !== recentRequests.length) {
        setStoredRequests(recentRequests);
    }

    const remaining = SECURITY_CONFIG.MAX_REQUESTS_PER_HOUR - recentRequests.length;
    const counterElement = document.getElementById('rateLimitCounter');
    const remainingElement = document.getElementById('requestsRemaining');
    const cooldownElement = document.getElementById('cooldownTimer');

    remainingElement.textContent = remaining;

    // Calculate time until next hour reset
    const currentHour = new Date().getHours();
    const nextHour = new Date();
    nextHour.setHours(currentHour + 1, 0, 0, 0);
    const timeToReset = Math.ceil((nextHour - now) / 1000 / 60); // minutes

    // Update counter styling based on remaining requests
    counterElement.className = 'rate-limit-counter';
    if (remaining <= 2) {
        counterElement.className += ' danger';
    } else if (remaining <= 5) {
        counterElement.className += ' warning';
    }

    // Show reset timer
    const resetTimer = counterElement.querySelector('.reset-timer') || document.createElement('div');
    resetTimer.className = 'reset-timer';
    resetTimer.textContent = `Resets in: ${timeToReset} min`;
    if (!counterElement.querySelector('.reset-timer')) {
        counterElement.appendChild(resetTimer);
    }

    // Show cooldown timer if needed
    if (recentRequests.length > 0) {
        const lastRequest = Math.max(...recentRequests);
        const timeSinceLastRequest = now - lastRequest;
        const cooldownRemaining = SECURITY_CONFIG.MIN_REQUEST_INTERVAL - timeSinceLastRequest;

        if (cooldownRemaining > 0) {
            const seconds = Math.ceil(cooldownRemaining / 1000);
            cooldownElement.textContent = `Next request in: ${seconds}s`;

            // Start countdown timer
            const countdownInterval = setInterval(() => {
                const newNow = Date.now();
                const newCooldownRemaining = SECURITY_CONFIG.MIN_REQUEST_INTERVAL - (newNow - lastRequest);

                if (newCooldownRemaining <= 0) {
                    cooldownElement.textContent = '';
                    clearInterval(countdownInterval);
                } else {
                    const newSeconds = Math.ceil(newCooldownRemaining / 1000);
                    cooldownElement.textContent = `Next request in: ${newSeconds}s`;
                }
            }, 1000);
        } else {
            cooldownElement.textContent = '';
        }
    }
}

// Input sanitization
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';

    // First trim whitespace
    input = input.trim();

    // If empty after trimming, return empty
    if (input.length === 0) return '';

    // Remove any HTML/script tags
    input = input.replace(/<[^>]*>?/gm, '');

    // Remove potentially dangerous characters
    input = input.replace(/[<>\"'&]/g, '');

    // Check against allowed characters - if invalid, return empty string
    if (!SECURITY_CONFIG.ALLOWED_CHARS_REGEX.test(input)) {
        console.log('Input failed regex test:', input);
        return '';
    }

    return input;
}

// Validate competitor name
function validateCompetitorName(name) {
    if (!name || name.length === 0) return true; // Empty is allowed
    if (name.length > 25) return false;
    if (!SECURITY_CONFIG.ALLOWED_CHARS_REGEX.test(name)) return false;

    // Additional security checks
    if (name.includes('..') || name.includes('//')) return false; // Path traversal prevention

    return true;
}

function runAnalysis() {
    console.log('Run analysis clicked');
    hideMessages();

    // Get competitor values and sanitize them
    let competitor1 = sanitizeInput(document.getElementById('competitor1').value);
    let competitor2 = sanitizeInput(document.getElementById('competitor2').value);
    let competitor3 = sanitizeInput(document.getElementById('competitor3').value);

    console.log('Sanitized values:', competitor1, competitor2, competitor3);

    // Validation - at least one competitor required (check AFTER sanitization)
    if (!competitor1 && !competitor2 && !competitor3) {
        console.log('No valid competitors entered after sanitization');
        showError('Please enter at least one valid competitor/brand name for viral content analysis');
        return;
    }

    // Rate limiting check (moved after input validation)
    if (!checkRateLimit()) {
        showError('Rate limit exceeded. Please wait before making another request (max 10 requests per hour, 1 minute between requests).', 'rate-limit-warning');
        return;
    }

    // Validate each competitor name (this is now redundant but kept for extra safety)
    if ((competitor1 && !validateCompetitorName(competitor1)) ||
        (competitor2 && !validateCompetitorName(competitor2)) ||
        (competitor3 && !validateCompetitorName(competitor3))) {
        showError('Invalid competitor name detected. Only letters, numbers, spaces, hyphens, dots and underscores are allowed.');
        return;
    }

    // Collect only non-empty competitors
    const competitors = [competitor1, competitor2, competitor3].filter(c => c !== '');

    // Check for competitor name length (max 25 characters)
    const tooLongCompetitors = competitors.filter(c => c.length > 25);
    if (tooLongCompetitors.length > 0) {
        showError('Competitor names must be 25 characters or less');
        return;
    }

    // Check for duplicates among entered competitors (case-insensitive)
    const uniqueCompetitors = [...new Set(competitors.map(c => c.toLowerCase()))];
    if (uniqueCompetitors.length !== competitors.length) {
        showError('Please enter different competitors (no duplicates)');
        return;
    }

    // Validate dropdown selections
    const country = document.getElementById('country').value;
    const status = document.getElementById('status').value;

    const allowedCountries = ['UA', 'PL', 'DE', 'US', 'GB'];
    const allowedStatuses = ['active', 'inactive'];

    if (!allowedCountries.includes(country) || !allowedStatuses.includes(status)) {
        showError('Invalid selection detected');
        return;
    }

    // Collect form data with security headers
    const formData = {
        competitors: competitors,
        country: country,
        status: status,
        sessionToken: SECURITY_CONFIG.SESSION_TOKEN,
        timestamp: Date.now(),
        userAgent: navigator.userAgent.substr(0, 100) // Limit length
    };

    console.log('Secure data to send:', {
        competitors: formData.competitors,
        country: formData.country,
        status: formData.status,
        hasToken: !!formData.sessionToken
    });

    // Replace with your actual webhook URL
    const webhookUrl = 'YOUR_N8N_WEBHOOK_URL_HERE';

    // For testing purposes, just show success without actually sending
    if (webhookUrl === 'YOUR_N8N_WEBHOOK_URL_HERE') {
        showSuccess('✅ Security validation passed. Ready to send data to webhook. Rate limit: 10 requests/hour, 1 minute between requests.');
        return;
    }

    // Disable submit button to prevent double submission
    const submitBtn = document.querySelector('.btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    // Send to webhook with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-Session-Token': SECURITY_CONFIG.SESSION_TOKEN
        },
        body: JSON.stringify(formData),
        signal: controller.signal
    })
    .then(response => {
        clearTimeout(timeoutId);
        if (response.ok) {
            showSuccess('Analysis started successfully!');
            // Generate new token for next request
            SECURITY_CONFIG.SESSION_TOKEN = generateSessionToken();
        } else {
            showError('Error starting analysis');
        }
    })
    .catch(error => {
        clearTimeout(timeoutId);
        console.error('Error:', error);
        if (error.name === 'AbortError') {
            showError('Request timeout. Please try again.');
        } else {
            showError('Error connecting to webhook');
        }
    })
    .finally(() => {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

function resetForm() {
    document.getElementById('competitorForm').reset();
    hideMessages();
    // Don't reset rate limiting on form reset
}

function showError(message, className = 'error-message') {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    errorDiv.textContent = message;
    errorDiv.className = `message ${className}`;
    errorDiv.style.display = 'block';
    successDiv.style.display = 'none';
}

function showSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    errorDiv.style.display = 'none';
}

function hideMessages() {
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
}

// Security event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded with security features enabled');

    // Initialize rate limit display
    updateRateLimitDisplay();

    // Update display every 30 seconds to keep it current
    setInterval(updateRateLimitDisplay, 30000);

    // Prevent form submission via Enter key to force validation
    document.getElementById('competitorForm').addEventListener('submit', function(e) {
        console.log('Form submit triggered');
        e.preventDefault();
        runAnalysis();
    });

    // Real-time input validation
    ['competitor1', 'competitor2', 'competitor3'].forEach(id => {
        const input = document.getElementById(id);
        input.addEventListener('input', function() {
            const value = this.value;
            if (value && !SECURITY_CONFIG.ALLOWED_CHARS_REGEX.test(value)) {
                this.style.borderColor = '#ef4444';
                this.title = 'Invalid characters detected';
            } else {
                this.style.borderColor = '#e2e8f0';
                this.title = 'Only letters, numbers, spaces, hyphens, dots and underscores allowed';
            }
        });
    });

    // Prevent right-click context menu on form (optional security measure)
    document.getElementById('competitorForm').addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    // Clear sensitive data on page unload
    window.addEventListener('beforeunload', function() {
        // Clear any sensitive data if needed
        SECURITY_CONFIG.SESSION_TOKEN = null;
    });
});

// Additional security: Detect if form is being automated
let humanInteraction = false;
document.addEventListener('mousemove', () => humanInteraction = true, { once: true });
document.addEventListener('keydown', () => humanInteraction = true, { once: true });