// UI management functions

export function showError(message, className = 'error-message') {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');

    if (!errorDiv || !successDiv) return;

    errorDiv.textContent = message;
    errorDiv.className = `message ${className}`;
    errorDiv.style.display = 'block';
    successDiv.style.display = 'none';
}

export function showSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');

    if (!errorDiv || !successDiv) return;

    successDiv.textContent = message;
    successDiv.style.display = 'block';
    errorDiv.style.display = 'none';
}

export function hideMessages() {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');

    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';
}

export function resetForm() {
    const form = document.getElementById('competitorForm');
    if (form) {
        form.reset();
        hideMessages();
        // Don't reset rate limiting on form reset
    }
}

// Security event listeners setup
export function setupSecurityEventListeners() {
    // Prevent form submission via Enter key to force validation
    const form = document.getElementById('competitorForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            console.log('Form submit triggered');
            e.preventDefault();
            // runAnalysis will be called from index.js
        });
    }

    // Prevent right-click context menu on form (optional security measure)
    if (form) {
        form.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
    }

    // Clear sensitive data on page unload
    window.addEventListener('beforeunload', function() {
        // Clear any sensitive data if needed
        // This will be handled by config.js
    });
}

// Additional security: Detect if form is being automated
export function setupBotDetection() {
    let humanInteraction = false;
    document.addEventListener('mousemove', () => humanInteraction = true, { once: true });
    document.addEventListener('keydown', () => humanInteraction = true, { once: true });

    // Return function to check if human interaction detected
    return () => humanInteraction;
}