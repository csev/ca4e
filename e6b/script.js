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
        // Wind angle is the angle from true course to wind direction
        let windAngle = (windDirection - trueCourse) % 360;
        if (windAngle < 0) windAngle += 360;

        // Convert to radians for calculations
        const windAngleRad = this.degreesToRadians(windAngle);
        
        // For ground speed calculation, we need the angle between TAS and wind vectors
        // This is the supplement of the wind angle (180° - windAngle)
        const groundSpeedAngleRad = Math.PI - windAngleRad;

        // Calculate Wind Correction Angle (WCA) using sine law
        // WCA = arcsin((windSpeed * sin(windAngle)) / trueAirspeed)
        const wcaRad = Math.asin((windSpeed * Math.sin(windAngleRad)) / trueAirspeed);
        const wca = this.radiansToDegrees(wcaRad);

        // Calculate Ground Speed using cosine law
        // Ground Speed = sqrt(TAS² + WS² - 2*TAS*WS*cos(angle between TAS and wind))
        const groundSpeed = Math.sqrt(
            Math.pow(trueAirspeed, 2) + 
            Math.pow(windSpeed, 2) - 
            2 * trueAirspeed * windSpeed * Math.cos(groundSpeedAngleRad)
        );

        // Calculate heading (true course + wind correction angle)
        let heading = (trueCourse + wca) % 360;
        if (heading < 0) heading += 360;
        
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
        
        // Calculate heading (what you actually fly)
        const heading = (trueCourse + wca) % 360;
        
        // Convert aviation coordinates (0° = North) to canvas coordinates (0° = East)
        const headingRad = this.degreesToRadians(90 - heading);
        const trueCourseRad = this.degreesToRadians(90 - trueCourse);
        
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