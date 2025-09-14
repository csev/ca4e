class TraditionalSlideRule {
    constructor() {
        this.initializeElements();
        this.createScales();
        this.bindEvents();
        this.updateHairline();
    }

    initializeElements() {
        this.slideRule = document.getElementById('slideRule');
        this.fixedMarkings = document.getElementById('fixedMarkings');
        this.slidingMarkings = document.getElementById('slidingMarkings');
        this.lMarkings = document.getElementById('lMarkings');
        this.hairline = document.getElementById('hairline');
        this.dValue = document.getElementById('dValue');
        this.cValue = document.getElementById('cValue');
        this.lValue = document.getElementById('lValue');
        this.hairlinePosition = document.getElementById('hairlinePosition');
        this.slidingOffset = document.getElementById('slidingOffset');
    }

    createScales() {
        this.createAScaleMarkings(this.fixedMarkings);
        this.createBScaleMarkings(this.slidingMarkings);
        this.createLScaleMarkings(this.lMarkings);
    }

    createScaleMarkings(container, scaleType) {
        const markings = this.generateLogarithmicMarkings();
        
        markings.forEach(marking => {
            const markingElement = document.createElement('div');
            markingElement.className = `marking ${marking.isMajor ? 'major' : ''}`;
            markingElement.style.left = `${marking.position}%`;
            markingElement.setAttribute('data-value', marking.value);
            markingElement.setAttribute('data-scale', scaleType);
            markingElement.setAttribute('tabindex', '0');
            markingElement.setAttribute('role', 'button');
            markingElement.setAttribute('aria-label', `${scaleType} scale, value ${marking.value}`);
            
            // Add label for major markings
            if (marking.isMajor) {
                const label = document.createElement('div');
                label.className = 'marking-label';
                label.textContent = marking.value;
                markingElement.appendChild(label);
                
                // Add side label for major markings
                const sideLabel = document.createElement('div');
                sideLabel.className = 'side-label left';
                sideLabel.textContent = marking.value;
                markingElement.appendChild(sideLabel);
            }
            
            container.appendChild(markingElement);
        });
    }

    generateLogarithmicMarkings() {
        const markings = [];
        const majorValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        
        // Generate major markings (0-10)
        majorValues.forEach(value => {
            const position = this.logToPosition(value);
            markings.push({
                value: value,
                position: position,
                isMajor: true
            });
        });
        
        // Generate minor markings
        for (let i = 0; i <= 9; i++) {
            for (let j = 1; j <= 9; j++) {
                const value = i + j * 0.1;
                if (value <= 10) {
                    const position = this.logToPosition(value);
                    markings.push({
                        value: Math.round(value * 10) / 10,
                        position: position,
                        isMajor: false
                    });
                }
            }
        }
        
        return markings;
    }

    generateLogarithmicMarkingsForB() {
        const markings = [];
        const majorValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        
        // Generate major markings (1-10 only)
        majorValues.forEach(value => {
            const position = this.logToPosition(value);
            markings.push({
                value: value,
                position: position,
                isMajor: true
            });
        });
        
        // Generate minor markings (1.1 to 9.9)
        for (let i = 1; i <= 9; i++) {
            for (let j = 1; j <= 9; j++) {
                const value = i + j * 0.1;
                if (value <= 10) {
                    const position = this.logToPosition(value);
                    markings.push({
                        value: Math.round(value * 10) / 10,
                        position: position,
                        isMajor: false
                    });
                }
            }
        }
        
        return markings;
    }

    generateLogarithmicMarkingsForA() {
        const markings = [];
        const majorValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        
        // Generate major markings (1-10 only)
        majorValues.forEach(value => {
            const position = this.logToPosition(value);
            markings.push({
                value: value,
                position: position,
                isMajor: true
            });
        });
        
        // Generate minor markings (1.1 to 9.9)
        for (let i = 1; i <= 9; i++) {
            for (let j = 1; j <= 9; j++) {
                const value = i + j * 0.1;
                if (value <= 10) {
                    const position = this.logToPosition(value);
                    markings.push({
                        value: Math.round(value * 10) / 10,
                        position: position,
                        isMajor: false
                    });
                }
            }
        }
        
        return markings;
    }

    createAScaleMarkings(container) {
        const markings = this.generateLogarithmicMarkingsForA();
        
        markings.forEach(marking => {
            const markingElement = document.createElement('div');
            markingElement.className = `marking ${marking.isMajor ? 'major' : ''}`;
            markingElement.style.left = `${marking.position}%`;
            markingElement.setAttribute('data-value', marking.value);
            markingElement.setAttribute('data-scale', 'A');
            markingElement.setAttribute('tabindex', '0');
            markingElement.setAttribute('role', 'button');
            markingElement.setAttribute('aria-label', `A scale, value ${marking.value}`);
            
            // Add label for major markings
            if (marking.isMajor) {
                const label = document.createElement('div');
                label.className = 'marking-label';
                label.textContent = marking.value;
                markingElement.appendChild(label);
                
                // Add side label for major markings
                const sideLabel = document.createElement('div');
                sideLabel.className = 'side-label left';
                sideLabel.textContent = marking.value;
                markingElement.appendChild(sideLabel);
            }
            
            container.appendChild(markingElement);
        });
    }

    createBScaleMarkings(container) {
        const markings = this.generateLogarithmicMarkingsForB();
        
        markings.forEach(marking => {
            const markingElement = document.createElement('div');
            markingElement.className = `marking ${marking.isMajor ? 'major' : ''}`;
            markingElement.style.left = `${marking.position}%`;
            markingElement.setAttribute('data-value', marking.value);
            markingElement.setAttribute('data-scale', 'B');
            markingElement.setAttribute('tabindex', '0');
            markingElement.setAttribute('role', 'button');
            markingElement.setAttribute('aria-label', `B scale, value ${marking.value}`);
            
            // Add label for major markings
            if (marking.isMajor) {
                const label = document.createElement('div');
                label.className = 'marking-label';
                label.textContent = marking.value;
                markingElement.appendChild(label);
                
                // Add side label for major markings
                const sideLabel = document.createElement('div');
                sideLabel.className = 'side-label left';
                sideLabel.textContent = marking.value;
                markingElement.appendChild(sideLabel);
            }
            
            container.appendChild(markingElement);
        });
    }

    createLScaleMarkings(container) {
        const markings = this.generateLinearMarkings();
        
        markings.forEach(marking => {
            const markingElement = document.createElement('div');
            markingElement.className = `marking ${marking.isMajor ? 'major' : ''}`;
            markingElement.style.left = `${marking.position}%`;
            markingElement.setAttribute('data-value', marking.value);
            markingElement.setAttribute('data-scale', 'L');
            markingElement.setAttribute('tabindex', '0');
            markingElement.setAttribute('role', 'button');
            markingElement.setAttribute('aria-label', `L scale, value ${marking.value}`);
            
            // Add label for major markings
            if (marking.isMajor) {
                const label = document.createElement('div');
                label.className = 'marking-label';
                label.textContent = marking.value;
                markingElement.appendChild(label);
                
                // Add side label for major markings
                const sideLabel = document.createElement('div');
                sideLabel.className = 'side-label left';
                sideLabel.textContent = marking.value;
                markingElement.appendChild(sideLabel);
            }
            
            container.appendChild(markingElement);
        });
    }

    generateLinearMarkings() {
        const markings = [];
        
        // Generate major markings (0.0, 0.1, 0.2, ..., 1.0)
        for (let i = 0; i <= 10; i++) {
            const value = i * 0.1;
            const position = (value / 1) * 100; // Linear scale from 0 to 100%
            markings.push({
                value: Math.round(value * 10) / 10,
                position: position,
                isMajor: true
            });
        }
        
        // Generate minor markings (0.01, 0.02, ..., 0.99)
        for (let i = 1; i <= 99; i++) {
            const value = i * 0.01;
            const position = (value / 1) * 100;
            if (i % 10 !== 0) { // Skip major markings
                markings.push({
                    value: Math.round(value * 10) / 10,
                    position: position,
                    isMajor: false
                });
            }
        }
        
        return markings;
    }

    logToPosition(value) {
        // Convert logarithmic value to percentage position (0-100)
        // log(1) = 0, log(10) = 1, so we map 0-1 to 0-100
        return (Math.log10(value) / Math.log10(10)) * 100;
    }

    positionToLog(position) {
        // Convert percentage position back to logarithmic value
        return Math.pow(10, (position / 100) * Math.log10(10));
    }

    bindEvents() {
        // Hairline position control
        this.hairlinePosition.addEventListener('input', () => {
            this.updateHairline();
        });

        // Sliding offset control
        this.slidingOffset.addEventListener('input', () => {
            this.updateSlidingScale();
        });

        // Marking interactions
        this.slideRule.addEventListener('click', (e) => {
            if (e.target.classList.contains('marking')) {
                this.announceMarking(e.target);
            }
        });

        this.slideRule.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('marking')) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.announceMarking(e.target);
                }
            }
        });

        // Touch events for mobile
        this.slideRule.addEventListener('touchstart', (e) => {
            const marking = e.target.closest('.marking');
            if (marking) {
                this.announceMarking(marking);
            }
        });

        // Hover events for desktop
        this.slideRule.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('marking')) {
                this.announceMarking(e.target);
            }
        });
    }

    announceMarking(markingElement) {
        const value = markingElement.getAttribute('data-value');
        const scale = markingElement.getAttribute('data-scale');
        console.log(`${scale} scale, value ${value}`);
    }

    updateHairline() {
        const position = parseFloat(this.hairlinePosition.value);
        const value = this.positionToLog(position);
        const cOffset = parseFloat(this.slidingOffset.value);
        
        // Update hairline position smoothly
        this.hairline.style.left = `${position}%`;
        
        // Update D scale value (same as hairline value)
        this.dValue.textContent = value.toFixed(3);
        
        // Update C scale value (considering both hairline position and C scale offset)
        const cPosition = position - (cOffset / 10); // Convert pixel offset to percentage, subtract for correct direction
        const cValue = this.positionToLog(cPosition);
        this.cValue.textContent = cValue.toFixed(3);
        
        // Update L scale value (logarithm of the value)
        const logValue = Math.log10(value);
        this.lValue.textContent = logValue.toFixed(3);
        
        console.log(`Hairline at ${value.toFixed(3)}, C scale at ${cValue.toFixed(3)}`);
    }

    updateSlidingScale() {
        const offset = this.slidingOffset.value;
        
        // Apply offset to sliding scale
        this.slidingMarkings.style.transform = `translateX(${offset}px)`;
        
        // Update hairline to recalculate C scale value
        this.updateHairline();
    }

    // Calculate multiplication: a × b
    multiply(a, b) {
        const logA = Math.log10(a);
        const logB = Math.log10(b);
        const result = Math.pow(10, logA + logB);
        return result;
    }

    // Calculate division: a ÷ b
    divide(a, b) {
        const logA = Math.log10(a);
        const logB = Math.log10(b);
        const result = Math.pow(10, logA - logB);
        return result;
    }

    // Reset slide rule to original position
    resetSlideRule() {
        // Reset hairline to center (50%)
        this.hairlinePosition.value = 50;
        this.updateHairline();
        
        // Reset C scale to original position (0 offset)
        this.slidingOffset.value = 0;
        this.slidingMarkings.style.transform = 'translateX(0px)';
    }
    
    // Demonstrate slide rule calculation
    async demonstrateCalculation() {
        // Reset to original position first
        console.log('Resetting slide rule to original position...');
        this.resetSlideRule();
        
        // Wait a moment for reset to be visible
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const a = 2.5;
        const b = 3.2;
        const product = this.multiply(a, b);
        
        console.log(`Demonstrating: ${a} × ${b} = ${product}`);
        
        // Step 1: Move hairline to first number (2.5) on A scale
        console.log(`Step 1: Moving hairline to ${a} on A scale...`);
        const positionA = this.logToPosition(a);
        await this.animateHairline(positionA, 3000);
        
        // Step 2: Slide B scale to align 1 with hairline
        console.log(`Step 2: Sliding B scale to align 1 with hairline...`);
        const offsetNeeded = this.calculateOffsetForAlignment(a);
        await this.animateSlidingScale(offsetNeeded, 3000);
        
        // Step 3: Move hairline to second number (3.2) on B scale
        console.log(`Step 3: Moving hairline to ${b} on B scale...`);
        const positionB = this.logToPosition(b);
        const finalPosition = positionB + (offsetNeeded / 10); // Adjust for B scale offset
        await this.animateHairline(finalPosition, 3000);
        
        // Step 4: Show result
        console.log(`Step 4: Reading result ${product.toFixed(2)} on A scale`);
        this.showResult(product);
    }
    
    animateHairline(targetPosition, duration) {
        return new Promise((resolve) => {
            const startPosition = parseFloat(this.hairlinePosition.value);
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const currentPosition = startPosition + (targetPosition - startPosition) * progress;
                
                this.hairlinePosition.value = currentPosition;
                this.updateHairline();
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            animate();
        });
    }
    
    animateSlidingScale(targetOffset, duration) {
        return new Promise((resolve) => {
            const startOffset = parseFloat(this.slidingOffset.value);
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const currentOffset = startOffset + (targetOffset - startOffset) * progress;
                
                // Apply the transform directly to the sliding markings
                this.slidingMarkings.style.transform = `translateX(${currentOffset}px)`;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Update the slider value at the end
                    this.slidingOffset.value = targetOffset;
                    resolve();
                }
            };
            
            animate();
        });
    }
    
    calculateOffsetForAlignment(value) {
        // Calculate the offset needed to align the B scale's "1" with the given value on A scale
        const valuePosition = this.logToPosition(value);
        const onePosition = this.logToPosition(1);
        const offset = (valuePosition - onePosition) * 10; // Convert percentage to pixels
        return offset;
    }
    
    showResult(result) {
        // Create a temporary highlight effect
        const resultElement = document.createElement('div');
        resultElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #27ae60;
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        resultElement.textContent = `2.5 × 3.2 = ${result.toFixed(2)}`;
        
        document.body.appendChild(resultElement);
        
        // Remove after 3 seconds
        setTimeout(() => {
            document.body.removeChild(resultElement);
        }, 3000);
    }
}

// Initialize the slide rule when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.slideRule = new TraditionalSlideRule();
    
    // Add demonstration button
    const demoButton = document.createElement('button');
    demoButton.textContent = 'Demonstrate: 2.5 × 3.2 = 8.0';
    demoButton.style.cssText = `
        background: #27ae60;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        margin: 10px;
        cursor: pointer;
        font-size: 16px;
        transition: background-color 0.3s ease;
    `;
    demoButton.addEventListener('mouseenter', () => {
        demoButton.style.background = '#219a52';
    });
    demoButton.addEventListener('mouseleave', () => {
        demoButton.style.background = '#27ae60';
    });
    demoButton.addEventListener('click', async () => {
        demoButton.disabled = true;
        demoButton.textContent = 'Demonstrating...';
        demoButton.style.background = '#95a5a6';
        
        try {
            await window.slideRule.demonstrateCalculation();
        } finally {
            demoButton.disabled = false;
            demoButton.textContent = 'Demonstrate: 2.5 × 3.2 = 8.0';
            demoButton.style.background = '#27ae60';
        }
    });
    
    // Add reset button
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset';
    resetButton.style.cssText = `
        background: #e74c3c;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        margin: 10px;
        cursor: pointer;
        font-size: 16px;
        transition: background-color 0.3s ease;
    `;
    resetButton.addEventListener('mouseenter', () => {
        resetButton.style.background = '#c0392b';
    });
    resetButton.addEventListener('mouseleave', () => {
        resetButton.style.background = '#e74c3c';
    });
    resetButton.addEventListener('click', () => {
        window.slideRule.resetSlideRule();
    });
    
    // Create Assignment button (only for authenticated users)
    let assignmentButton = null;
    let instructorButton = null;
    
    if (USER_AUTHENTICATED && ASSIGNMENT_TYPE) {
        assignmentButton = document.createElement('button');
        assignmentButton.id = 'assignmentButton';
        assignmentButton.className = 'assignment-button';
        assignmentButton.textContent = 'Assignment';
        assignmentButton.style.cssText = `
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin: 10px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.3s ease;
        `;
        assignmentButton.addEventListener('mouseenter', () => {
            assignmentButton.style.background = '#45a049';
        });
        assignmentButton.addEventListener('mouseleave', () => {
            assignmentButton.style.background = '#4CAF50';
        });
        
        // Add click event listener for assignment button
        assignmentButton.addEventListener('click', function() {
            if (window.showAssignmentModal) {
                window.showAssignmentModal();
            }
        });
    }
    
    if (USER_IS_INSTRUCTOR) {
        instructorButton = document.createElement('a');
        instructorButton.href = INSTRUCTOR_URL;
        instructorButton.textContent = 'Instructor';
        instructorButton.style.cssText = `
            background: #28a745;
            color: white;
            font-size: 14px;
            padding: 10px 20px;
            border-radius: 5px;
            border: 1px solid #ccc;
            cursor: pointer;
            min-width: 60px;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-decoration: none;
            display: inline-block;
            margin: 10px;
        `;
        instructorButton.addEventListener('mouseenter', () => {
            instructorButton.style.background = '#218838';
        });
        instructorButton.addEventListener('mouseleave', () => {
            instructorButton.style.background = '#28a745';
        });
    }

    // Create a button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-top: 10px;
        flex-wrap: wrap;
    `;
    
    // Add buttons in order: Demonstrate, Reset, Assignment, Instructor
    buttonContainer.appendChild(demoButton);
    buttonContainer.appendChild(resetButton);
    if (assignmentButton) buttonContainer.appendChild(assignmentButton);
    if (instructorButton) buttonContainer.appendChild(instructorButton);
    
    document.querySelector('.controls').appendChild(buttonContainer);
}); 