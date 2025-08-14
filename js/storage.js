// Local storage management for rate limiting
export function getStoredRequests() {
    try {
        return JSON.parse(localStorage.getItem('requests') || '[]');
    } catch (error) {
        console.error('Error reading stored requests:', error);
        return [];
    }
}

export function setStoredRequests(requests) {
    try {
        localStorage.setItem('requests', JSON.stringify(requests));
    } catch (error) {
        console.error('Error storing requests:', error);
    }
}

export function cleanOldRequests() {
    const now = Date.now();
    const requests = getStoredRequests();
    const recentRequests = requests.filter(time => now - time < 3600000);

    if (requests.length !== recentRequests.length) {
        setStoredRequests(recentRequests);
    }

    return recentRequests;
}