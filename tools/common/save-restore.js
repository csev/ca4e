/**
 * Common Save/Restore Utility for CA4E Tools
 * Provides localStorage-based save/restore functionality with common UI patterns
 */

class SaveRestoreManager {
    constructor(toolName, options = {}) {
        this.toolName = toolName;
        this.storageKey = `ca4e_${toolName}_saves`;
        
        // Default options
        this.options = {
            maxSaves: 20,
            defaultNamePrefix: `${toolName.charAt(0).toUpperCase() + toolName.slice(1)}_`,
            confirmDelete: true,
            showTimestamps: true,
            ...options
        };
        
        this.saves = this.loadSaves();
    }
    
    /**
     * Load all saves from localStorage
     */
    loadSaves() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error loading saves:', error);
            return {};
        }
    }
    
    /**
     * Save data to localStorage
     */
    saveSaves() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.saves));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }
    
    /**
     * Save current state with a given name
     * @param {string} name - Name for the save
     * @param {Object} data - Data to save
     * @returns {boolean} - Success status
     */
    save(name, data) {
        if (!name || !data) {
            return false;
        }
        
        // Clean up old saves if we're at the limit
        const saveNames = Object.keys(this.saves);
        if (saveNames.length >= this.options.maxSaves) {
            // Remove oldest save
            const oldestName = saveNames.reduce((oldest, current) => {
                return this.saves[current].timestamp < this.saves[oldest].timestamp ? current : oldest;
            });
            delete this.saves[oldestName];
        }
        
        this.saves[name] = {
            data: data,
            timestamp: new Date().toISOString(),
            toolName: this.toolName
        };
        
        return this.saveSaves();
    }
    
    /**
     * Load saved data by name
     * @param {string} name - Name of the save to load
     * @returns {Object|null} - Saved data or null if not found
     */
    load(name) {
        if (this.saves[name]) {
            return this.saves[name].data;
        }
        return null;
    }
    
    /**
     * Delete a save by name
     * @param {string} name - Name of the save to delete
     * @returns {boolean} - Success status
     */
    delete(name) {
        if (this.saves[name]) {
            delete this.saves[name];
            return this.saveSaves();
        }
        return false;
    }
    
    /**
     * Get list of all save names
     * @returns {Array} - Array of save names sorted by timestamp (newest first)
     */
    getSaveNames() {
        return Object.keys(this.saves).sort((a, b) => {
            return new Date(this.saves[b].timestamp) - new Date(this.saves[a].timestamp);
        });
    }
    
    /**
     * Get save info including timestamp
     * @param {string} name - Name of the save
     * @returns {Object|null} - Save info or null if not found
     */
    getSaveInfo(name) {
        if (this.saves[name]) {
            return {
                name: name,
                timestamp: this.saves[name].timestamp,
                date: new Date(this.saves[name].timestamp).toLocaleString(),
                toolName: this.saves[name].toolName
            };
        }
        return null;
    }
    
    /**
     * Clear all saves
     * @returns {boolean} - Success status
     */
    clearAll() {
        this.saves = {};
        return this.saveSaves();
    }
    
    /**
     * Generate a default save name with timestamp
     * @returns {string} - Generated name
     */
    generateDefaultName() {
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
        return `${this.options.defaultNamePrefix}${timestamp}`;
    }
    
    /**
     * Show save dialog and save current data
     * @param {Function} getDataCallback - Function that returns current data to save
     * @param {Function} successCallback - Optional success callback
     */
    showSaveDialog(getDataCallback, successCallback = null) {
        const currentData = getDataCallback();
        if (!currentData) {
            alert('No data to save');
            return;
        }
        
        const defaultName = this.generateDefaultName();
        const saveName = prompt(`Enter a name for this ${this.toolName}:`, defaultName);
        
        if (saveName) {
            if (this.save(saveName, currentData)) {
                alert(`"${saveName}" saved successfully!`);
                if (successCallback) successCallback(saveName);
            } else {
                alert('Failed to save. Please try again.');
            }
        }
    }
    
    /**
     * Show load dialog and load selected data
     * @param {Function} setDataCallback - Function that sets the loaded data
     * @param {Function} successCallback - Optional success callback
     */
    showLoadDialog(setDataCallback, successCallback = null) {
        const saveNames = this.getSaveNames();
        
        if (saveNames.length === 0) {
            alert(`No saved ${this.toolName} files found`);
            return;
        }
        
        let message = `Enter the name of the ${this.toolName} to load:\n\nAvailable saves:\n`;
        saveNames.forEach(name => {
            const info = this.getSaveInfo(name);
            if (this.options.showTimestamps) {
                message += `${name} (${info.date})\n`;
            } else {
                message += `${name}\n`;
            }
        });
        
        const loadName = prompt(message);
        if (loadName) {
            const data = this.load(loadName);
            if (data) {
                setDataCallback(data);
                alert(`"${loadName}" loaded successfully!`);
                if (successCallback) successCallback(loadName, data);
            } else {
                alert(`"${loadName}" not found`);
            }
        }
    }
    
    /**
     * Show delete dialog and delete selected save
     * @param {Function} successCallback - Optional success callback
     */
    showDeleteDialog(successCallback = null) {
        const saveNames = this.getSaveNames();
        
        if (saveNames.length === 0) {
            alert(`No saved ${this.toolName} files found`);
            return;
        }
        
        let message = `Enter the name of the ${this.toolName} to delete:\n\nAvailable saves:\n`;
        saveNames.forEach(name => {
            const info = this.getSaveInfo(name);
            if (this.options.showTimestamps) {
                message += `${name} (${info.date})\n`;
            } else {
                message += `${name}\n`;
            }
        });
        
        const deleteName = prompt(message);
        if (deleteName) {
            if (this.saves[deleteName]) {
                let confirmDelete = true;
                if (this.options.confirmDelete) {
                    confirmDelete = confirm(`Are you sure you want to delete "${deleteName}"?`);
                }
                
                if (confirmDelete) {
                    if (this.delete(deleteName)) {
                        alert(`"${deleteName}" deleted successfully!`);
                        if (successCallback) successCallback(deleteName);
                    } else {
                        alert('Failed to delete. Please try again.');
                    }
                }
            } else {
                alert(`"${deleteName}" not found`);
            }
        }
    }
    
    /**
     * Show manage dialog with list of all saves
     */
    showManageDialog() {
        const saveNames = this.getSaveNames();
        
        if (saveNames.length === 0) {
            alert(`No saved ${this.toolName} files found`);
            return;
        }
        
        let message = `Saved ${this.toolName} files:\n\n`;
        saveNames.forEach(name => {
            const info = this.getSaveInfo(name);
            message += `${name} (saved: ${info.date})\n`;
        });
        message += `\nTo load: Click "Load" and enter the file name\nTo delete: Click "Delete" and enter the file name`;
        
        alert(message);
    }
    
    /**
     * Create standard save/restore buttons and attach event listeners
     * @param {Object} config - Configuration object with callbacks
     */
    createButtons(config) {
        const {
            saveButtonId = 'saveButton',
            loadButtonId = 'loadButton',
            deleteButtonId = 'deleteButton',
            manageButtonId = 'manageButton',
            getDataCallback,
            setDataCallback,
            successCallback = null
        } = config;
        
        // Save button
        const saveButton = document.getElementById(saveButtonId);
        if (saveButton && getDataCallback) {
            saveButton.addEventListener('click', () => {
                this.showSaveDialog(getDataCallback, successCallback);
            });
        }
        
        // Load button
        const loadButton = document.getElementById(loadButtonId);
        if (loadButton && setDataCallback) {
            loadButton.addEventListener('click', () => {
                this.showLoadDialog(setDataCallback, successCallback);
            });
        }
        
        // Delete button
        const deleteButton = document.getElementById(deleteButtonId);
        if (deleteButton) {
            deleteButton.addEventListener('click', () => {
                this.showDeleteDialog(successCallback);
            });
        }
        
        // Manage button
        const manageButton = document.getElementById(manageButtonId);
        if (manageButton) {
            manageButton.addEventListener('click', () => {
                this.showManageDialog();
            });
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SaveRestoreManager;
}
