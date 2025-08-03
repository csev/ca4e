// E6B Wind Calculator - ES6 Module
class E6BWindCalculator {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.drawInitialTriangle();
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
        this.driftAngleResult = document.getElementById('driftAngle');
        
        this.canvas = document.getElementById('windTriangle');
        this.ctx = this.canvas.getContext('2d');
    }

    bindEvents() {
        this.calculateBtn.addEventListener('click', () => this.calculate());
        
        // Auto-calculate on input changes
        [this.trueCourseInput, this.trueAirspeedInput, this.windDirectionInput, this.windSpeedInput]
            .forEach(input => {
                input.addEventListener('input', () => this.calculate());
            });
    }

    calculate() {
        const trueCourse = parseFloat(this.trueCourseInput.value);
        const trueAirspeed = parseFloat(this.trueAirspeedInput.value);
        const windDirection = parseFloat(this.windDirectionInput.value);
        const windSpeed = parseFloat(this.windSpeedInput.value);

        if (isNaN(trueCourse) || isNaN(trueAirspeed) || isNaN(windDirection) || isNaN(windSpeed)) {
            return;
        }

        // Calculate wind angle (angle between true course and wind direction)
        let windAngle = (windDirection - trueCourse) % 360;

        // Convert to radians for calculations
        const windAngleRad = this.degreesToRadians(windAngle);
        const trueCourseRad = this.degreesToRadians(trueCourse);

        // Calculate Wind Correction Angle (WCA)
        const wcaRad = Math.asin((windSpeed * Math.sin(windAngleRad)) / trueAirspeed);
        const wca = this.radiansToDegrees(wcaRad);

        // Calculate Ground Speed using cosine law
        const groundSpeed = Math.sqrt(
            Math.pow(trueAirspeed, 2) - 
            // Math.pow(windSpeed, 2) - 
            2 * trueAirspeed * windSpeed * Math.cos(windAngleRad)
        );

        // Calculate heading (true course + wind correction angle)
        let heading = (trueCourse + wca) % 360;

        // Calculate drift angle with proper sign
        // Positive drift angle means aircraft is drifting right (wind from left)
        // Negative drift angle means aircraft is drifting left (wind from right)
        let driftAngle = wca;
        
        // Determine sign based on wind angle
        // If wind angle is between 0° and 180°, wind is from the right, so drift is negative
        // If wind angle is between 180° and 360°, wind is from the left, so drift is positive
        if (windAngle > 180) {
            driftAngle = -Math.abs(wca);
        } else {
            driftAngle = Math.abs(wca);
        }

        // Update results
        this.updateResults(wca, groundSpeed, heading, driftAngle);
        
        // Update visualization
        this.drawWindTriangle(trueCourse, trueAirspeed, windDirection, windSpeed, wca, groundSpeed);
    }

    updateResults(wca, groundSpeed, heading, driftAngle) {
        const results = [
            { element: this.wcaResult, value: wca.toFixed(1) },
            { element: this.groundSpeedResult, value: groundSpeed.toFixed(1) },
            { element: this.headingResult, value: heading.toFixed(1) },
            { element: this.driftAngleResult, value: driftAngle.toFixed(1) + '°' }
        ];

        results.forEach(({ element, value }) => {
            element.textContent = value;
            element.classList.add('updated');
            setTimeout(() => element.classList.remove('updated'), 500);
        });
    }

    drawInitialTriangle() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Enter flight data and click Calculate', this.canvas.width / 2, this.canvas.height / 2);
    }

    drawWindTriangle(trueCourse, trueAirspeed, windDirection, windSpeed, wca, groundSpeed) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Calculate dynamic scale to ensure largest vector stays within 10% of edge
        const maxVectorLength = Math.max(trueAirspeed, windSpeed, groundSpeed);
        const availableRadius = Math.min(this.canvas.width, this.canvas.height) * 0.45; // 90% of half canvas size
        const scale = availableRadius / maxVectorLength;
        
        // Calculate vectors - Convert aviation coordinates (0° = North) to canvas coordinates (0° = East)
        const trueCourseRad = this.degreesToRadians(90 - trueCourse); // Convert aviation to math coordinates
        console.log('true course', trueCourse, trueCourseRad);
        const windDirectionRad = this.degreesToRadians(90 - windDirection); // Convert aviation to math coordinates
        const headingRad = this.degreesToRadians(90 - (trueCourse + wca)); // Convert aviation to math coordinates
        console.log('heading', (trueCourse+wca), headingRad);
        // Computed heading vector (blue) - what you actually fly
        const headingX = centerX + Math.cos(headingRad) * trueAirspeed * scale;
        const headingY = centerY - Math.sin(headingRad) * trueAirspeed * scale;
        
        // Wind vector (red) - Wind direction is FROM, convert to direction wind is blowing
        const windToDirection = (windDirection + 180) % 360; // Convert FROM to TO direction
        const windToRad = this.degreesToRadians(90 - windToDirection); // Convert to canvas coordinates
        console.log('wind direction', windDirection, windToDirection, windToRad);
        const windX = centerX + Math.cos(windToRad) * windSpeed * scale;
        const windY = centerY - Math.sin(windToRad) * windSpeed * scale;
        console.log('wind', windX, windY, windToRad, windSpeed);
        console.log('zap', Math.sin(windToRad) * windSpeed * scale);
        console.log('center', centerX, centerY);
        
        // Ground track vector (green) - same direction as true course but with wind-adjusted speed
        const groundTrackX = centerX + Math.cos(trueCourseRad) * groundSpeed * scale;
        const groundTrackY = centerY - Math.sin(trueCourseRad) * groundSpeed * scale;
        
        // Draw vectors
        this.drawVector(centerX, centerY, headingX, headingY, '#3498db', 'Heading');
        this.drawVector(centerX, centerY, windX, windY, '#e74c3c', 'Wind');
        this.drawVector(centerX, centerY, groundTrackX, groundTrackY, '#2ecc71', 'Track');
        
        // Draw wind triangle
        this.ctx.strokeStyle = '#95a5a6';
        this.ctx.setLineDash([5, 5]);
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(headingX, headingY);
        this.ctx.lineTo(groundTrackX, groundTrackY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw center point
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    drawVector(startX, startY, endX, endY, color, label) {
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

// Initialize the calculator when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new E6BWindCalculator();
}); 