/**
 * Common Modal Manager for CA4E Tools
 * Provides consistent modal functionality across all tools including:
 * - Assignment modals with dragging and centering
 * - Generic modal management
 * - Common grading interface
 */

class ModalManager {
    constructor() {
        this.modals = new Map();
        this.setupGlobalEventListeners();
    }
    
    /**
     * Register a modal for management
     * @param {string} name - Modal identifier
     * @param {HTMLElement} modalElement - Modal DOM element
     * @param {Object} options - Configuration options
     */
    registerModal(name, modalElement, options = {}) {
        const config = {
            draggable: options.draggable || false,
            centerOnShow: options.centerOnShow || false,
            closeOnOutsideClick: options.closeOnOutsideClick !== false, // default true
            closeOnEscape: options.closeOnEscape !== false, // default true
            ...options
        };
        
        this.modals.set(name, {
            element: modalElement,
            config: config,
            isVisible: false
        });
        
        // Setup modal-specific functionality
        this.setupModal(name);
    }
    
    /**
     * Setup modal functionality
     */
    setupModal(name) {
        const modal = this.modals.get(name);
        if (!modal) return;
        
        const { element, config } = modal;
        
        // Setup close buttons (only if they don't already have onclick handlers)
        const closeButtons = element.querySelectorAll('.close, .close-btn');
        closeButtons.forEach(btn => {
            // Only add event listener if button doesn't already have onclick attribute
            if (!btn.hasAttribute('onclick')) {
                btn.addEventListener('click', () => this.hideModal(name));
            }
        });
        
        // Setup dragging if enabled
        if (config.draggable) {
            this.makeDraggable(element);
        }
    }
    
    /**
     * Show a modal
     */
    showModal(name, data = {}) {
        const modal = this.modals.get(name);
        if (!modal) return;
        
        const { element, config } = modal;
        
        // Call beforeShow callback if provided
        if (config.beforeShow) {
            config.beforeShow(data);
        }
        
        // Show modal
        if (element.classList.contains('hidden')) {
            element.classList.remove('hidden');
        } else {
            element.style.display = 'block';
        }
        
        modal.isVisible = true;
        
        // Add modal-open class to body to prevent background scrolling
        document.body.classList.add('modal-open');
        
        // Center modal if configured
        if (config.centerOnShow) {
            this.centerModal(element);
        }
        
        // Call afterShow callback if provided
        if (config.afterShow) {
            config.afterShow(data);
        }
    }
    
    /**
     * Hide a modal
     */
    hideModal(name) {
        const modal = this.modals.get(name);
        if (!modal) return;
        
        const { element, config } = modal;
        
        // Call beforeHide callback if provided
        if (config.beforeHide) {
            config.beforeHide();
        }
        
        // Hide modal
        if (element.classList.contains('hidden') !== undefined) {
            element.classList.add('hidden');
        } else {
            element.style.display = 'none';
        }
        
        modal.isVisible = false;
        
        // Remove modal-open class from body if no modals are visible
        if (!this.isAnyModalVisible()) {
            document.body.classList.remove('modal-open');
        }
        
        // Call afterHide callback if provided
        if (config.afterHide) {
            config.afterHide();
        }
    }
    
    /**
     * Center a modal in the viewport
     */
    centerModal(modalElement) {
        // Only set initial position if modal doesn't already have a position
        if (!modalElement.style.left && !modalElement.style.top) {
            const modalW = modalElement.offsetWidth;
            const modalH = modalElement.offsetHeight;
            
            // Position modal nudged to the right, near the top of viewport
            const left = Math.max(0, Math.floor((window.innerWidth - modalW) * 0.7)); // 70% from left edge
            const top = Math.max(20, Math.floor(window.innerHeight * 0.1)); // 10% from top, minimum 20px
            
            modalElement.style.left = left + 'px';
            modalElement.style.top = top + 'px';
        }
    }
    
    /**
     * Make a modal draggable
     */
    makeDraggable(modalElement) {
        const modalHeader = modalElement.querySelector('.modal-header, [title*="Drag"]');
        
        if (!modalHeader) return;
        
        let isDragging = false;
        let dragOffset = { startX: 0, startY: 0, startLeft: 0, startTop: 0 };
        
        // Add cursor styling
        modalHeader.style.cursor = 'grab';
        
        // Add drag handle styling to make it clear where to drag
        modalHeader.style.userSelect = 'none';
        modalHeader.style.webkitUserSelect = 'none';
        modalHeader.style.mozUserSelect = 'none';
        modalHeader.style.msUserSelect = 'none';
        
        modalHeader.addEventListener('mousedown', dragStart, true);
        modalHeader.addEventListener('touchstart', dragStart, { passive: false, capture: true });
        document.addEventListener('mousemove', drag, true);
        document.addEventListener('touchmove', drag, { passive: false, capture: true });
        document.addEventListener('mouseup', dragEnd, true);
        document.addEventListener('touchend', dragEnd, true);
        
        function dragStart(e) {
            // Don't start drag if clicking on close button or other interactive elements
            if (e.target.classList.contains('close-btn') || 
                e.target.classList.contains('close') ||
                e.target.tagName === 'BUTTON') {
                return;
            }
            
            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;
            
            // Use the CDC8512 approach - get current CSS left/top values directly
            dragOffset.startX = clientX;
            dragOffset.startY = clientY;
            dragOffset.startLeft = parseInt(modalElement.style.left) || 0;
            dragOffset.startTop = parseInt(modalElement.style.top) || 0;
            
            isDragging = true;
            modalHeader.style.cursor = 'grabbing';
            document.body.style.cursor = 'grabbing';
            
            // Prevent text selection and other default behaviors
            e.preventDefault();
            e.stopPropagation();
        }
        
        function drag(e) {
            if (!isDragging) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;
            
            // Use CDC8512 approach - calculate delta from start position
            const dx = clientX - dragOffset.startX;
            const dy = clientY - dragOffset.startY;
            
            // Calculate new position
            let newLeft = dragOffset.startLeft + dx;
            let newTop = dragOffset.startTop + dy;
            
            // Keep modal within viewport bounds
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const modalWidth = modalElement.offsetWidth;
            const modalHeight = modalElement.offsetHeight;
            
            // Constrain to viewport
            const maxLeft = viewportWidth - modalWidth;
            const maxTop = viewportHeight - modalHeight;
            newLeft = Math.max(0, Math.min(maxLeft, newLeft));
            newTop = Math.max(0, Math.min(maxTop, newTop));
            
            // Apply position
            modalElement.style.left = newLeft + 'px';
            modalElement.style.top = newTop + 'px';
        }
        
        function dragEnd(e) {
            if (!isDragging) return;
            
            isDragging = false;
            modalHeader.style.cursor = 'grab';
            document.body.style.cursor = '';
            
            // Allow a small delay before re-enabling clicks to prevent accidental closes
            setTimeout(() => {
                // Reset any event capture issues
            }, 10);
        }
    }
    
    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Close modals on outside click
        document.addEventListener('click', (e) => {
            this.modals.forEach((modal, name) => {
                if (modal.isVisible && modal.config.closeOnOutsideClick) {
                    if (e.target === modal.element) {
                        this.hideModal(name);
                    }
                }
            });
        });
        
        // Close modals on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.modals.forEach((modal, name) => {
                    if (modal.isVisible && modal.config.closeOnEscape) {
                        this.hideModal(name);
                    }
                });
            }
        });
    }
    
    /**
     * Check if any modal is visible
     */
    isAnyModalVisible() {
        return Array.from(this.modals.values()).some(modal => modal.isVisible);
    }
    
    /**
     * Get modal by name
     */
    getModal(name) {
        return this.modals.get(name);
    }
}

/**
 * Assignment Modal Manager
 * Specialized manager for assignment modals with grading functionality
 */
class AssignmentModalManager {
    constructor(modalManager) {
        this.modalManager = modalManager;
        this.currentExercise = null;
        this.gradeSubmitUrl = null;
        this.isInstructor = false;
        this.assignmentType = '';
    }
    
    /**
     * Initialize assignment modal
     */
    initialize(config = {}) {
        const {
            modalId = 'assignmentModal',
            buttonId = 'assignmentBtn',
            exerciseInstance = null,
            gradeSubmitUrl = null,
            isInstructor = false,
            assignmentType = ''
        } = config;
        
        this.currentExercise = exerciseInstance;
        this.gradeSubmitUrl = gradeSubmitUrl;
        this.isInstructor = isInstructor;
        this.assignmentType = assignmentType;
        
        const modalElement = document.getElementById(modalId);
        const buttonElement = document.getElementById(buttonId);
        
        if (!modalElement) {
            console.warn('Assignment modal not found:', modalId);
            return;
        }
        
        // Register modal with drag and center functionality
        this.modalManager.registerModal('assignment', modalElement, {
            draggable: true,
            centerOnShow: true,
            beforeShow: () => this.loadInstructions(),
            afterHide: () => this.resetGrading()
        });
        
        // Setup button click handler
        if (buttonElement) {
            buttonElement.addEventListener('click', () => this.show());
        }
        
        // Setup global grading functions
        this.setupGradingFunctions();
    }
    
    /**
     * Show assignment modal
     */
    show() {
        this.modalManager.showModal('assignment');
    }
    
    /**
     * Hide assignment modal
     */
    hide() {
        this.modalManager.hideModal('assignment');
    }
    
    /**
     * Load instructions into modal
     */
    loadInstructions() {
        if (this.currentExercise && this.currentExercise.instructions) {
            const instructionsElement = document.getElementById('assignmentInstructions') || 
                                       document.getElementById('assignmentInstructionsText');
            
            if (instructionsElement) {
                let instructions = this.currentExercise.instructions;
                
                
                instructionsElement.innerHTML = instructions;
            }
        } else if (!this.assignmentType) {
            // Show default message if no exercise is configured
            const instructionsElement = document.getElementById('assignmentInstructions') || 
                                       document.getElementById('assignmentInstructionsText');
            if (instructionsElement) {
                instructionsElement.innerHTML = `
                    <h3>No Assignment Configured</h3>
                    <p>The instructor has not yet configured an assignment for this tool.</p>
                    <p>Please contact your instructor or try again later.</p>
                `;
            }
        }
        
        // Reset grading to beginning state
        this.resetGrading();
    }
    
    /**
     * Reset grading state
     */
    resetGrading() {
        if (this.currentExercise && this.currentExercise.resetGrading) {
            this.currentExercise.resetGrading();
        }
    }
    
    /**
     * Setup global grading functions
     */
    setupGradingFunctions() {
        // Global function for starting grading
        window.startGrading = () => {
            if (this.currentExercise && this.currentExercise.startGrading) {
                this.currentExercise.startGrading();
            }
        };
        
        // Global function for next step
        window.nextStep = () => {
            if (this.currentExercise && this.currentExercise.nextStep) {
                this.currentExercise.nextStep();
            }
        };
        
        // Global function for grade submission
        window.submitGradeToLMS = (grade) => {
            if (!this.gradeSubmitUrl) {
                console.warn('No grade submit URL configured');
                return;
            }
            
            const formData = new FormData();
            formData.append('grade', grade);
            formData.append('code', 'EXERCISE_COMPLETED');
            
            fetch(this.gradeSubmitUrl, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    alert('🎉 Excellent work! Your assignment has been completed successfully and your grade has been submitted to the LMS.');
                } else {
                    alert(`⚠️ Grade submission failed: ${data.detail}`);
                }
            })
            .catch(error => {
                alert(`⚠️ Grade submission error: ${error.message}`);
            });
        };
    }
}

// Create global instances
const modalManager = new ModalManager();
const assignmentModalManager = new AssignmentModalManager(modalManager);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModalManager, AssignmentModalManager, modalManager, assignmentModalManager };
}
