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
        this.createDScaleMarkings(this.fixedMarkings);
        this.createCScaleMarkings(this.slidingMarkings);
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

    generateLogarithmicMarkingsForC() {
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

    generateLogarithmicMarkingsForD() {
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

    createDScaleMarkings(container) {
        const markings = this.generateLogarithmicMarkingsForD();
        
        markings.forEach(marking => {
            const markingElement = document.createElement('div');
            markingElement.className = `marking ${marking.isMajor ? 'major' : ''}`;
            markingElement.style.left = `${marking.position}%`;
            markingElement.setAttribute('data-value', marking.value);
            markingElement.setAttribute('data-scale', 'D');
            markingElement.setAttribute('tabindex', '0');
            markingElement.setAttribute('role', 'button');
            markingElement.setAttribute('aria-label', `D scale, value ${marking.value}`);
            
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

    createCScaleMarkings(container) {
        const markings = this.generateLogarithmicMarkingsForC();
        
        markings.forEach(marking => {
            const markingElement = document.createElement('div');
            markingElement.className = `marking ${marking.isMajor ? 'major' : ''}`;
            markingElement.style.left = `${marking.position}%`;
            markingElement.setAttribute('data-value', marking.value);
            markingElement.setAttribute('data-scale', 'C');
            markingElement.setAttribute('tabindex', '0');
            markingElement.setAttribute('role', 'button');
            markingElement.setAttribute('aria-label', `C scale, value ${marking.value}`);
            
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

    // Demonstrate slide rule calculation
    demonstrateCalculation() {
        const a = 2.5;
        const b = 3.2;
        const product = this.multiply(a, b);
        const quotient = this.divide(a, b);
        
        console.log(`${a} × ${b} = ${product}`);
        console.log(`${a} ÷ ${b} = ${quotient}`);
        
        // Show how to use the slide rule
        console.log(`To multiply ${a} × ${b}:`);
        console.log(`1. Move hairline to ${a} on D scale`);
        console.log(`2. Slide C scale to align 1 with hairline`);
        console.log(`3. Move hairline to ${b} on C scale`);
        console.log(`4. Read result ${product.toFixed(2)} on D scale`);
    }
}

// Initialize the slide rule when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const slideRule = new TraditionalSlideRule();
    
    // Add demonstration button
    const demoButton = document.createElement('button');
    demoButton.textContent = 'Demonstrate 2.5 × 3.2';
    demoButton.style.cssText = `
        background: #27ae60;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        margin: 10px;
        cursor: pointer;
        font-size: 16px;
    `;
    demoButton.addEventListener('click', () => {
        slideRule.demonstrateCalculation();
    });
    
    document.querySelector('.controls').appendChild(demoButton);
}); 