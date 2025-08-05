// E6B Wind Calculator - ES6 Module
class E6BWindCalculator {
    constructor() {
        // Only initialize DOM elements if we're in a browser environment
        if (typeof document !== 'undefined') {
            this.initializeElements();
            this.bindEvents();
            this.drawInitialTriangle();
        }
    }

    initializeElements() {
        this.trueCourseInput = document.getElementById('trueCourse');
        this.trueAirspeedInput = document.getElementById('trueAirspeed');
        this.windDirectionInput = document.getElementById('windDirection');
        this.windSpeedInput = document.getElementById('windSpeed');
        this.calculateBtn = document.getElementById('calculateBtn');
        
        this.wcaResult = document.getElementById('wca');
        this.groundSpeedResult = document.getElementById('groundSpeed');
        this.headingResult = document.getElementById('heading');
        this.windAngleResult = document.getElementById('windAngle');
        
        this.canvas = document.getElementById('windTriangle');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
        }
    }

    bindEvents() {
        if (this.calculateBtn) {
            this.calculateBtn.addEventListener('click', () => this.calculate());
        }
        
        // Auto-calculate on input changes
        [this.trueCourseInput, this.trueAirspeedInput, this.windDirectionInput, this.windSpeedInput]
            .forEach(input => {
                if (input) {
                    input.addEventListener('input', () => this.calculate());
                }
            });
    }

    calculate() {
        // Get input values
        const inputs = this.getInputs();
        
        // Validate inputs
        if (!this.validateInputs(inputs)) {
            return;
        }
        
        // Perform calculation
        const results = this.performCalculation(inputs);
        
        // Update UI with results
        this.updateResults(results.wca, results.groundSpeed, results.heading, results.windAngle);
        this.drawWindTriangle(inputs.trueCourse, inputs.trueAirspeed, inputs.windFromDirection, inputs.windSpeed, results.wca, results.groundSpeed);
    }

    getInputs() {
        return {
            trueCourse: parseFloat(this.trueCourseInput.value) % 360,
            trueAirspeed: parseFloat(this.trueAirspeedInput.value),
            windFromDirection: parseFloat(this.windDirectionInput.value) % 360,
            windSpeed: parseFloat(this.windSpeedInput.value)
        };
    }

    validateInputs(inputs) {
        return !isNaN(inputs.trueCourse) && 
               !isNaN(inputs.trueAirspeed) && 
               !isNaN(inputs.windFromDirection) && 
               !isNaN(inputs.windSpeed);
    }

    performCalculation(inputs) {
        // Calculate wind angle (angle between true course and wind from direction)
        // For wind from direction, we need the angle from true course to wind from direction
        let windToDirection = (inputs.windFromDirection + 180) % 360;
        let windAngle = (windToDirection - inputs.trueCourse) % 360;
        if (windAngle < 0) windAngle += 360;

        // Calculate Wind Correction Angle (WCA) and Ground Speed using law of sines
        let wca, groundSpeed;
        
        if (inputs.windSpeed === 0) {
            // No wind
            wca = 0;
            groundSpeed = inputs.trueAirspeed;
            windAngle = 0;
        } else if (windAngle === 0) {
            // Wind is directly behind (tailwind)
            wca = 0;
            groundSpeed = inputs.trueAirspeed + inputs.windSpeed;
        } else if (windAngle === 180) {
            // Wind is directly ahead (headwind)
            wca = 0;
            groundSpeed = inputs.trueAirspeed - inputs.windSpeed;
        } else {
            // Use law of sines for AAS triangle
            const windAngleRad = this.degreesToRadians(windAngle);
            wca = this.radiansToDegrees(Math.asin((inputs.windSpeed * Math.sin(windAngleRad)) / inputs.trueAirspeed));
            
            // Determine sign of WCA based on wind angle
            // If wind angle > 180, wind is from the left, so WCA should be negative
            if (windAngle > 180) {
                wca = -Math.abs(wca);
            }
            
            // Calculate ground speed angle (GSA) - the angle between wind and ground track
            const gsa = 180 - (windAngle + Math.abs(wca));
            const gsaRad = this.degreesToRadians(gsa);
            const wcaRad = this.degreesToRadians(Math.abs(wca));
            
            // Calculate ground speed using law of sines
            groundSpeed = Math.abs((inputs.windSpeed * Math.sin(gsaRad)) / Math.sin(wcaRad));
        }

        // Calculate heading (true course + wind correction angle)
        let heading = (inputs.trueCourse + wca + 360) % 360;
        
        return { wca, groundSpeed, heading, windAngle };
    }

    updateResults(wca, groundSpeed, heading, windAngle) {
        const results = [
            { element: this.wcaResult, value: Math.round(wca) },
            { element: this.groundSpeedResult, value: Math.round(groundSpeed) },
            { element: this.headingResult, value: Math.round(heading) },
            { element: this.windAngleResult, value: Math.round(windAngle) }
        ];

        results.forEach(({ element, value }) => {
            if (element) {
                element.textContent = value;
                element.classList.add('updated');
                setTimeout(() => element.classList.remove('updated'), 500);
            }
        });
        
        // Log wind angle for debugging
        console.log('Wind Angle:', Math.round(windAngle));
    }

    drawInitialTriangle() {
        if (!this.canvas || !this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Enter flight data and click Calculate', this.canvas.width / 2, this.canvas.height / 2);
    }

    drawWindTriangle(trueCourse, trueAirspeed, windFromDirection, windSpeed, wca, groundSpeed) {
        if (!this.canvas || !this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Calculate dynamic scale to ensure largest vector stays within 10% of edge
        const maxVectorLength = Math.max(trueAirspeed, windSpeed, groundSpeed);
        const availableRadius = Math.min(this.canvas.width, this.canvas.height) * 0.45; // 90% of half canvas size
        const scale = availableRadius / maxVectorLength;
        
        // Calculate heading (what you actually fly)
        const heading = (trueCourse + wca) % 360;
        
        // Convert wind from direction to wind to direction for visualization
        const windToDirection = (windFromDirection + 180) % 360;
        
        // Convert aviation coordinates (0° = North) to canvas coordinates (0° = East)
        const headingRad = this.degreesToRadians(90 - heading);
        const trueCourseRad = this.degreesToRadians(90 - trueCourse);
        const windRad = this.degreesToRadians(90 - windToDirection);
        
        // Heading vector (blue) - what you actually fly
        const headingX = centerX + Math.cos(headingRad) * trueAirspeed * scale;
        const headingY = centerY - Math.sin(headingRad) * trueAirspeed * scale;
        
        // Ground track vector (green) - resultant direction (true course direction)
        const groundTrackX = centerX + Math.cos(trueCourseRad) * groundSpeed * scale;
        const groundTrackY = centerY - Math.sin(trueCourseRad) * groundSpeed * scale;
        
        // Wind vector (red) - from heading end to ground track end
        const windX = groundTrackX - headingX;
        const windY = groundTrackY - headingY;
        
        // Draw vectors
        this.drawVector(centerX, centerY, headingX, headingY, '#3498db', 'Heading');
        this.drawVector(headingX, headingY, groundTrackX, groundTrackY, '#e74c3c', 'Wind');
        this.drawVector(centerX, centerY, groundTrackX, groundTrackY, '#2ecc71', 'Track');
        
        // Draw center point
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    drawVector(startX, startY, endX, endY, color, label) {
        if (!this.ctx) return;
        
        // Draw arrow
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        
        // Draw arrowhead
        const angle = Math.atan2(endY - startY, endX - startX);
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;
        
        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - arrowLength * Math.cos(angle - arrowAngle),
            endY - arrowLength * Math.sin(angle - arrowAngle)
        );
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - arrowLength * Math.cos(angle + arrowAngle),
            endY - arrowLength * Math.sin(angle + arrowAngle)
        );
        this.ctx.stroke();
    }

    degreesToRadians(degrees) {
        return (degrees * Math.PI / 180) % (2 * Math.PI);
    }

    radiansToDegrees(radians) {
        return (radians * 180 / Math.PI) % 360;
    }

    aviationHeadingToCanvasHeading(heading) {
        return (heading + 90) % 360;
    }

    canvasHeadingToAviationHeading(heading) {
        return (heading - 90) % 360;
    }
}

// Initialize the calculator when the DOM is loaded (browser only)
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        new E6BWindCalculator();
    });
}

// Export for Deno testing
export { E6BWindCalculator }; 