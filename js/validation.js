import { SECURITY_CONFIG, UI_CONFIG } from './config.js';

// Input sanitization
export function sanitizeInput(input) {
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
export function validateCompetitorName(name) {
    if (!name || name.length === 0) return true; // Empty is allowed
    if (name.length > UI_CONFIG.MAX_COMPETITOR_LENGTH) return false;
    if (!SECURITY_CONFIG.ALLOWED_CHARS_REGEX.test(name)) return false;

    // Additional security checks
    if (name.includes('..') || name.includes('//')) return false; // Path traversal prevention

    return true;
}

// Validate form data
export function validateFormData(competitors, country, status) {
    // At least one competitor required
    if (competitors.length === 0) {
        return { valid: false, error: 'Please enter at least one valid competitor/brand name for content analysis' };
    }

    // Check for competitor name length
    const tooLongCompetitors = competitors.filter(c => c.length > UI_CONFIG.MAX_COMPETITOR_LENGTH);
    if (tooLongCompetitors.length > 0) {
        return { valid: false, error: 'Competitor names must be 25 characters or less' };
    }

    // Check for duplicates among entered competitors (case-insensitive)
    const uniqueCompetitors = [...new Set(competitors.map(c => c.toLowerCase()))];
    if (uniqueCompetitors.length !== competitors.length) {
        return { valid: false, error: 'Please enter different competitors (no duplicates)' };
    }

    // Validate dropdown selections
    if (!UI_CONFIG.ALLOWED_COUNTRIES.includes(country) || !UI_CONFIG.ALLOWED_STATUSES.includes(status)) {
        return { valid: false, error: 'Invalid selection detected' };
    }

    return { valid: true };
}

// Real-time input validation setup
export function setupInputValidation() {
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
}