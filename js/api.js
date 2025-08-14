import { SECURITY_CONFIG, UI_CONFIG, generateSessionToken } from './config.js';

// Send data to n8n webhook
export async function sendToWebhook(competitors, country, status) {
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

    // Disable submit button to prevent double submission
    const submitBtn = document.querySelector('.btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    try {
        // Send to webhook with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), UI_CONFIG.REQUEST_TIMEOUT);

        const response = await fetch(SECURITY_CONFIG.WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-Session-Token': SECURITY_CONFIG.SESSION_TOKEN
            },
            body: JSON.stringify(formData),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            // Generate new token for next request
            SECURITY_CONFIG.SESSION_TOKEN = generateSessionToken();
            return { success: true, message: 'Analysis started successfully!' };
        } else {
                return { success: false, message: `Error: ${error.message || 'Connection failed'}` };
              }

    } catch (error) {
        console.error('API Error:', error);

        if (error.name === 'AbortError') {
            return { success: false, message: 'Request timeout. Please try again.' };
        } else {
            return { success: false, message: 'Error connecting to webhook' };
        }

    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}