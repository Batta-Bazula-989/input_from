// Configuration and constants
export const SECURITY_CONFIG = {
    MAX_REQUESTS_PER_HOUR: 10,
    ALLOWED_CHARS_REGEX: /^[a-zA-Z0-9\s\-\.\_]+$/,
    MIN_REQUEST_INTERVAL: 60000, // 1 minute between requests
    SESSION_TOKEN: null,
    WEBHOOK_URL: 'https://bazoula.app.n8n.cloud/webhook/inputrigger'
};

export const UI_CONFIG = {
    ALLOWED_COUNTRIES: ['UA', 'PL', 'DE', 'US', 'GB'],
    ALLOWED_STATUSES: ['active', 'inactive'],
    MAX_COMPETITOR_LENGTH: 25,
    REQUEST_TIMEOUT: 30000 // 30 seconds
};

// Generate session token for CSRF protection
export function generateSessionToken() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Initialize session token
SECURITY_CONFIG.SESSION_TOKEN = generateSessionToken();