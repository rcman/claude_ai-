// ui-messages.js - Handles message logging and notifications

const UIMessages = (function() {
    // Private variables
    const messageLog = document.getElementById('messageLog');
    const maxMessages = 10;
    
    // Public API
    return {
        // Log a message to the message panel
        logMessage: function(message, type = 'info') {
            console.log(`[${type.toUpperCase()}] ${message}`); // Log to console as well

            // Safety check - if messageLog isn't available, just log to console
            if (!messageLog) {
                console.warn('Message log element not found, displaying in console only');
                return;
            }

            const messageDiv = document.createElement('div');
            messageDiv.classList.add('logMessage');
            messageDiv.classList.add(type); // Add type-specific class for styling
            messageDiv.textContent = message;

            messageLog.appendChild(messageDiv);

            // Limit number of messages shown
            while (messageLog.children.length > maxMessages) {
                messageLog.removeChild(messageLog.firstChild);
            }
            
            // Auto-scroll to bottom
            messageLog.scrollTop = messageLog.scrollHeight;
            
            // Optional: Auto-fade message after a delay
            setTimeout(() => {
                messageDiv.style.opacity = '0.7';
            }, 5000);
        },
        
        // Clear all messages
        clearMessages: function() {
            if (!messageLog) return;
            
            while (messageLog.firstChild) {
                messageLog.removeChild(messageLog.firstChild);
            }
        },
        
        // Show a temporary notification (overlay)
        showNotification: function(message, duration = 3000) {
            // Create temporary overlay notification
            const notification = document.createElement('div');
            notification.style.position = 'fixed';
            notification.style.top = '20%';
            notification.style.left = '50%';
            notification.style.transform = 'translate(-50%, -50%)';
            notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            notification.style.color = 'white';
            notification.style.padding = '10px 20px';
            notification.style.borderRadius = '5px';
            notification.style.zIndex = '100';
            notification.style.transition = 'opacity 0.5s';
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            // Fade out and remove after duration
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    try {
                        document.body.removeChild(notification);
                    } catch (error) {
                        console.warn('Could not remove notification:', error);
                    }
                }, 500);
            }, duration);
        }
    };
})();