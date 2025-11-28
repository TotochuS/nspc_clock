// static/js/main.js
// Fonctions utilitaires communes

/**
 * Formate un temps en secondes vers MM:SS
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formate le temps total en heures et minutes
 */
function formatTotalTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
}

/**
 * Convertit minutes en secondes
 */
function minutesToSeconds(minutes) {
    return minutes * 60;
}

/**
 * Convertit secondes en minutes
 */
function secondsToMinutes(seconds) {
    return Math.floor(seconds / 60);
}

/**
 * Appel API générique
 */
async function apiCall(url, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Affiche un message de notification
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `save-status ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}