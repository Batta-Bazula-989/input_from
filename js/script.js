// Main application orchestrator
import { SECURITY_CONFIG } from './config.js';
import { sanitizeInput, validateFormData, setupInputValidation } from './validation.js';
import { checkRateLimit, initializeRateLimit } from './rateLimit.js';
import { sendToWebhook } from './api.js';
import { showError, showSuccess, hideMessages, resetForm, setupSecurityEventListeners, setupBotDetection } from './ui.js';

// Main analysis function
async function runAnalysis() {
    console.log('Run analysis clicked');
    hideMessages();

    // Get competitor values and sanitize them
    let competitor1 = sanitizeInput(document.getElementById('competitor1')?.value || '');
    let competitor2 = sanitizeInput(document.getElementById('competitor2')?.value || '');
    let competitor3 = sanitizeInput(document.getElementById('competitor3')?.value || '');

    console.log('Sanitized values:', competitor1, competitor2, competitor3);

    // Collect only non-empty competitors
    const competitors = [competitor1, competitor2, competitor3].filter(c => c !== '');

    // Get dropdown values
    const country = document.getElementById('country')?.value || '';
    const status = document.getElementById('status')?.value || '';

    // Validate form data
    const validation = validateFormData(competitors, country, status);
    if (!validation.valid) {
        showError(validation.error);
        return;
    }

    // Rate limiting check
    if (!checkRateLimit()) {
        showError('Rate limit exceeded. Please wait before making another request (max 10 requests per hour, 1 minute between requests).', 'rate-limit-warning');
        return;
    }

    // Send to API
    try {
        const result = await sendToWebhook(competitors, country, status);

        if (result.success) {
            showSuccess(result.message);
        } else {
            showError(result.message);
        }
    } catch (error) {
        console.error('Unexpected error:', error);
        showError('An unexpected error occurred. Please try again.');
    }
}

// Initialize application
function initializeApp() {
    console.log('Page loaded with security features enabled');

    // Initialize rate limiting
    initializeRateLimit();

    // Setup input validation
    setupInputValidation();

    // Setup security event listeners
    setupSecurityEventListeners();

    // Setup bot detection
    const checkHumanInteraction = setupBotDetection();

    // Attach global functions to window for HTML onclick handlers
    window.runAnalysis = runAnalysis;
    window.resetForm = resetForm;

    // Additional security logging
    console.log('All modules loaded and initialized');
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);