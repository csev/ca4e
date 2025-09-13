/**
 * Common Tool Utilities for CA4E Tools
 * Provides frequently used utility functions across tools
 */

class ToolUtilities {
    constructor() {
        this.debounceTimers = new Map();
    }
    
    /**
     * Debounce function calls
     * @param {string} key - Unique identifier for the debounced function
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     */
    debounce(key, func, delay = 300) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }
        
        const timer = setTimeout(() => {
            func();
            this.debounceTimers.delete(key);
        }, delay);
        
        this.debounceTimers.set(key, timer);
    }
    
    /**
     * Show temporary message to user
     * @param {string} message - Message to display
     * @param {string} type - Message type: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duration in milliseconds
     */
    showMessage(message, type = 'info', duration = 3000) {
        // Remove existing message if any
        const existingMessage = document.querySelector('.ca4e-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `ca4e-message ca4e-message-${type}`;
        messageEl.textContent = message;
        
        // Add styles if not already added
        this.addMessageStyles();
        
        // Add to page
        document.body.appendChild(messageEl);
        
        // Auto-remove after duration
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.style.opacity = '0';
                setTimeout(() => {
                    if (messageEl.parentNode) {
                        messageEl.remove();
                    }
                }, 300);
            }
        }, duration);
    }
    
    /**
     * Add message styles
     */
    addMessageStyles() {
        if (document.getElementById('ca4e-message-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'ca4e-message-styles';
        style.textContent = `
            .ca4e-message {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 6px;
                color: white;
                font-weight: bold;
                z-index: 10000;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: opacity 0.3s ease;
            }
            
            .ca4e-message-success {
                background-color: #28a745;
            }
            
            .ca4e-message-error {
                background-color: #dc3545;
            }
            
            .ca4e-message-warning {
                background-color: #ffc107;
                color: #212529;
            }
            
            .ca4e-message-info {
                background-color: #17a2b8;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Format timestamp for display
     * @param {Date|string} timestamp - Timestamp to format
     * @returns {string} - Formatted timestamp
     */
    formatTimestamp(timestamp) {
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        return date.toLocaleString();
    }
    
    /**
     * Generate unique ID
     * @param {string} prefix - Prefix for the ID
     * @returns {string} - Unique ID
     */
    generateId(prefix = 'ca4e') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} - Success status
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const result = document.execCommand('copy');
                textArea.remove();
                return result;
            }
        } catch (error) {
            console.error('Failed to copy text:', error);
            return false;
        }
    }
    
    /**
     * Download data as file
     * @param {string} data - Data to download
     * @param {string} filename - Filename
     * @param {string} mimeType - MIME type
     */
    downloadAsFile(data, filename, mimeType = 'text/plain') {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * Load file from user input
     * @param {string} accept - File types to accept
     * @returns {Promise<File>} - Selected file
     */
    loadFileFromUser(accept = '*/*') {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = accept;
            input.style.display = 'none';
            
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    resolve(file);
                } else {
                    reject(new Error('No file selected'));
                }
                document.body.removeChild(input);
            });
            
            input.addEventListener('cancel', () => {
                reject(new Error('File selection cancelled'));
                document.body.removeChild(input);
            });
            
            document.body.appendChild(input);
            input.click();
        });
    }
    
    /**
     * Read file as text
     * @param {File} file - File to read
     * @returns {Promise<string>} - File contents
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }
    
    /**
     * Validate email address
     * @param {string} email - Email to validate
     * @returns {boolean} - Is valid email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    /**
     * Escape HTML characters
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Get URL parameters
     * @returns {Object} - URL parameters as key-value pairs
     */
    getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    }
    
    /**
     * Set URL parameter without page reload
     * @param {string} key - Parameter key
     * @param {string} value - Parameter value
     */
    setUrlParam(key, value) {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.replaceState({}, '', url);
    }
    
    /**
     * Remove URL parameter without page reload
     * @param {string} key - Parameter key to remove
     */
    removeUrlParam(key) {
        const url = new URL(window.location);
        url.searchParams.delete(key);
        window.history.replaceState({}, '', url);
    }
    
    /**
     * Check if element is in viewport
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} - Is element in viewport
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    /**
     * Smooth scroll to element
     * @param {HTMLElement|string} element - Element or selector
     * @param {Object} options - Scroll options
     */
    scrollToElement(element, options = {}) {
        const targetElement = typeof element === 'string' ? 
            document.querySelector(element) : element;
            
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest',
                ...options
            });
        }
    }
}

// Create global instance
const toolUtilities = new ToolUtilities();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ToolUtilities, toolUtilities };
}
