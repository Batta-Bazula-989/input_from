import { SECURITY_CONFIG } from './config.js';
import { getStoredRequests, setStoredRequests, cleanOldRequests } from './storage.js';

// Rate limiting functionality
export function checkRateLimit() {
    const now = Date.now();
    const recentRequests = cleanOldRequests();

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
export function updateRateLimitDisplay() {
    const now = Date.now();
    const recentRequests = cleanOldRequests();

    const remaining = SECURITY_CONFIG.MAX_REQUESTS_PER_HOUR - recentRequests.length;
    const counterElement = document.getElementById('rateLimitCounter');
    const remainingElement = document.getElementById('requestsRemaining');
    const cooldownElement = document.getElementById('cooldownTimer');

    if (!remainingElement) return; // Guard clause

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

// Initialize rate limit display and periodic updates
export function initializeRateLimit() {
    updateRateLimitDisplay();
    // Update display every 30 seconds to keep it current
    setInterval(updateRateLimitDisplay, 30000);
}