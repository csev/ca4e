class SimpleNixieDisplay {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas with id "${canvasId}" not found.`);
        }
        this.ctx = this.canvas.getContext('2d');
        this.value = null;
        this.draw();
    }

    setValue(value) {
        if (value === null || value === undefined) {
            this.value = null;
        } else {
            const numeric = Number(value);
            if (Number.isNaN(numeric)) {
                throw new Error('Nixie value must be a number between 0 and 7.');
            }
            this.value = Math.max(0, Math.min(7, Math.round(numeric)));
        }
        this.draw();
    }

    clear() {
        this.setValue(null);
    }

    draw() {
        const ctx = this.ctx;
        const value = this.value;
        const { width, height } = this.canvas;

        ctx.clearRect(0, 0, width, height);
        ctx.save();

        const centerX = width / 2;
        const centerY = height / 2 + 12;
        const tubeWidth = 90;
        const tubeHeight = 140;
        const tubeRadius = 30;
        const tubeTopY = centerY - tubeHeight / 2;
        const tubeBottomY = centerY + tubeHeight / 2;

        // Cylindrical tube body (with clipping for interior effects)
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(centerX - tubeWidth / 2, tubeTopY, tubeWidth, tubeHeight, tubeRadius);
        const bodyGradient = ctx.createLinearGradient(0, tubeTopY, 0, tubeBottomY);
        bodyGradient.addColorStop(0, '#1f2937');
        bodyGradient.addColorStop(0.5, '#111827');
        bodyGradient.addColorStop(1, '#1f2937');
        ctx.fillStyle = bodyGradient;
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.clip();

        const glassGradient = ctx.createRadialGradient(
            centerX - 18, tubeTopY + 25, 0,
            centerX - 6, centerY, tubeWidth
        );
        glassGradient.addColorStop(0, 'rgba(255, 255, 255, 0.20)');
        glassGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glassGradient;
        ctx.fillRect(centerX - tubeWidth / 2, tubeTopY, tubeWidth, tubeHeight);
        ctx.restore();


        // Digit
        if (value !== null) {
            ctx.shadowColor = 'rgba(255, 165, 0, 0.85)';
            ctx.shadowBlur = 34;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            ctx.fillStyle = '#ffa500';
            ctx.font = 'bold 82px "Orbitron", "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(value.toString(), centerX, centerY + 8);

            // Inner glow overlay (clipped to tube)
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(centerX - tubeWidth / 2, tubeTopY, tubeWidth, tubeHeight, tubeRadius);
            ctx.clip();
            const innerGlow = ctx.createRadialGradient(
                centerX, centerY + 4, 8,
                centerX, centerY + 4, 70
            );
            innerGlow.addColorStop(0, 'rgba(255, 200, 140, 0.3)');
            innerGlow.addColorStop(0.6, 'rgba(255, 150, 80, 0.15)');
            innerGlow.addColorStop(1, 'rgba(255, 150, 80, 0)');
            ctx.fillStyle = innerGlow;
            ctx.fillRect(centerX - tubeWidth / 2, tubeTopY, tubeWidth, tubeHeight);
            ctx.restore();
        } else {
            ctx.strokeStyle = 'rgba(71, 85, 105, 0.6)';
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.arc(centerX, centerY - 20, 42, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();
    }
}

const HEX_DIGITS = '0123456789ABCDEF';
const MAX_BINARY_ADDITION_SCORE = 10;
const MAX_CONVERSION_SCORE = 10;

function initTabbedCards() {
    document.querySelectorAll('.tabbed-card').forEach(card => {
        const buttons = card.querySelectorAll('.tab-btn');
        const panels = card.querySelectorAll('.tab-panel');
        if (buttons.length === 0 || panels.length === 0) return;
        buttons.forEach(button => {
            const targetSelector = button.dataset.tabTarget;
            if (!targetSelector) {
                return;
            }
            button.addEventListener('click', () => {
                if (button.classList.contains('active')) return;
                buttons.forEach(btn => {
                    if (btn.dataset.tabTarget) {
                        btn.classList.remove('active');
                    }
                });
                panels.forEach(panel => panel.classList.remove('active'));
                button.classList.add('active');
                const panel = card.querySelector(targetSelector);
                if (panel) panel.classList.add('active');
            });
        });
    });
}

function randomValue(allowZero = true, exclude = null) {
    const values = allowZero ? [0,1,2,3,4,5,6,7] : [1,2,3,4,5,6,7];
    const filtered = exclude === null ? values : values.filter(v => v !== exclude);
    return filtered[Math.floor(Math.random() * filtered.length)];
}

function initBase2Conversions() {
    if (!document.querySelector('.binary-input-grid')) {
        return;
    }

    const decimalNixie = new SimpleNixieDisplay('decimalNixie');

    const decimalValueSpan = document.getElementById('decimalValue');
    const decimalFeedback = document.getElementById('decimalFeedback');
    const conversionInputs = Array.from(document.querySelectorAll('.conversion-bit'));
    const nextDecimalBtn = document.getElementById('nextDecimalChallenge');
    const decimalAnswerInput = document.getElementById('decimalAnswerInput');
    const binaryFeedback = document.getElementById('binaryFeedback');
    const nextBinaryBtn = document.getElementById('nextBinaryChallenge');
    const scoreDisplay = document.getElementById('base2Score');
    const decimalCountdownSpan = document.getElementById('base2DecimalCountdown');
    const binaryCountdownSpan = document.getElementById('base2BinaryCountdown');

    if (!decimalValueSpan || !decimalFeedback || conversionInputs.length === 0 || !nextDecimalBtn || !decimalAnswerInput || !binaryFeedback || !nextBinaryBtn || !scoreDisplay || !decimalCountdownSpan || !binaryCountdownSpan) {
        return;
    }

    let decimalChallengeValue = 0;
    let binaryChallengeValue = 0;
    let decimalInteracted = false;
    let binaryInteracted = false;
    let decimalCompleted = false;
    let binaryCompleted = false;
    let score = 0;
    let decimalAutoTimeout = null;
    let decimalCountdownInterval = null;
    let binaryAutoTimeout = null;
    let binaryCountdownInterval = null;

    function updateScoreDisplay() {
        scoreDisplay.textContent = `Score: ${score}/${MAX_CONVERSION_SCORE}`;
    }

    function incrementScore() {
        if (score >= MAX_CONVERSION_SCORE) {
            return;
        }
        score += 1;
        updateScoreDisplay();
    }

    function resetFeedback(element) {
        element.textContent = '';
        element.classList.remove('correct', 'incorrect');
    }

    function getBinaryFromInputs() {
        return conversionInputs.reduce((total, input) => {
            const weight = Number(input.dataset.weight || 0);
            const bit = input.value === '1' ? 1 : 0;
            return total + (bit * weight);
        }, 0);
    }

    function setBitsFromValue(value) {
        conversionInputs.forEach(input => {
            const weight = Number(input.dataset.weight || 0);
            input.value = (value & weight) ? '1' : '';
        });
    }

    function renderBinaryStrip(container, value) {
        container.innerHTML = '';
        const bits = value.toString(2).padStart(3, '0');
        const template = ['blank', ...bits.split('')];
        template.forEach(bit => {
            const span = document.createElement('span');
            span.className = 'bit-display' + (bit === 'blank' ? ' blank' : '');
            span.textContent = bit === 'blank' ? '' : bit;
            container.appendChild(span);
        });
    }

    function updateBinaryDisplay(value) {
        const binaryBits = {
            4: document.querySelector('[data-bit="4"]'),
            2: document.querySelector('[data-bit="2"]'),
            1: document.querySelector('[data-bit="1"]'),
        };
        const bits = value.toString(2).padStart(3, '0');
        if (binaryBits[4]) binaryBits[4].textContent = bits[0];
        if (binaryBits[2]) binaryBits[2].textContent = bits[1];
        if (binaryBits[1]) binaryBits[1].textContent = bits[2];
    }

    function evaluateDecimalToBinary() {
        if (!decimalInteracted) {
            return;
        }

        const answer = getBinaryFromInputs();
        if (answer === decimalChallengeValue) {
            decimalFeedback.textContent = `Correct! ${decimalChallengeValue.toString(2).padStart(3, '0')} is ${decimalChallengeValue}.`;
            decimalFeedback.classList.remove('incorrect');
            decimalFeedback.classList.add('correct');
            if (!decimalCompleted) {
                incrementScore();
                decimalCompleted = true;
            }
            startDecimalAutoAdvance();
        } else {
            const expected = decimalChallengeValue.toString(2).padStart(3, '0');
            decimalFeedback.textContent = `Almost! ${decimalChallengeValue} in binary is ${expected}.`;
            decimalFeedback.classList.remove('correct');
            decimalFeedback.classList.add('incorrect');
            cancelDecimalAutoAdvance();
        }
    }

    function evaluateBinaryToDecimal() {
        if (!binaryInteracted) {
            return;
        }

        const rawValue = decimalAnswerInput.value.trim();
        if (rawValue === '') {
            resetFeedback(binaryFeedback);
            cancelBinaryAutoAdvance();
            return;
        }

        const numeric = Number(rawValue);
        if (Number.isNaN(numeric)) {
            binaryFeedback.textContent = 'Enter a decimal value between 0 and 7.';
            binaryFeedback.classList.remove('correct');
            binaryFeedback.classList.add('incorrect');
            cancelBinaryAutoAdvance();
            return;
        }

        const sanitized = Math.round(numeric);
        if (sanitized < 0 || sanitized > 7) {
            binaryFeedback.textContent = 'Keep it between 0 and 7.';
            binaryFeedback.classList.remove('correct');
            binaryFeedback.classList.add('incorrect');
            cancelBinaryAutoAdvance();
            return;
        }

        if (sanitized === binaryChallengeValue) {
            binaryFeedback.textContent = `Correct! ${binaryChallengeValue.toString(2).padStart(3, '0')} equals ${binaryChallengeValue}.`;
            binaryFeedback.classList.remove('incorrect');
            binaryFeedback.classList.add('correct');
            if (!binaryCompleted) {
                incrementScore();
                binaryCompleted = true;
            }
            startBinaryAutoAdvance();
        } else {
            binaryFeedback.textContent = `Not quite. ${binaryChallengeValue.toString(2).padStart(3, '0')} equals ${binaryChallengeValue}.`;
            binaryFeedback.classList.remove('correct');
            binaryFeedback.classList.add('incorrect');
            cancelBinaryAutoAdvance();
        }
    }

    function nextDecimalChallenge() {
        decimalChallengeValue = randomValue(false, decimalChallengeValue);
        decimalValueSpan.textContent = decimalChallengeValue;
        decimalNixie.setValue(decimalChallengeValue);
        setBitsFromValue(0);
        resetFeedback(decimalFeedback);
        decimalInteracted = false;
        decimalCompleted = false;
        cancelDecimalAutoAdvance();
        conversionInputs[conversionInputs.length - 1].focus();
    }

    function nextBinaryChallenge() {
        binaryChallengeValue = randomValue(true, binaryChallengeValue);
        updateBinaryDisplay(binaryChallengeValue);
        decimalAnswerInput.value = '';
        resetFeedback(binaryFeedback);
        binaryInteracted = false;
        binaryCompleted = false;
        cancelBinaryAutoAdvance();
    }

    function focusNextConversion(fromIndex) {
        const right = conversionInputs.slice(fromIndex + 1).find(input => input.value === '');
        if (right) {
            right.focus();
            right.select();
            return;
        }
        const left = conversionInputs.slice(0, fromIndex).reverse().find(input => input.value === '');
        if (left) {
            left.focus();
            left.select();
        }
    }

    conversionInputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            const char = input.value.trim().slice(0, 1);
            if (char === '0' || char === '1') {
                input.value = char;
            } else {
                input.value = '';
            }
            decimalInteracted = true;
            evaluateDecimalToBinary();
            if (input.value !== '') {
                focusNextConversion(index);
            } else {
                cancelDecimalAutoAdvance();
            }
        });
        input.addEventListener('focus', () => {
            input.select();
        });
    });

    decimalAnswerInput.addEventListener('input', () => {
        binaryInteracted = true;
        evaluateBinaryToDecimal();
    });

    function cancelDecimalAutoAdvance() {
        if (decimalAutoTimeout) {
            clearTimeout(decimalAutoTimeout);
            decimalAutoTimeout = null;
        }
        if (decimalCountdownInterval) {
            clearInterval(decimalCountdownInterval);
            decimalCountdownInterval = null;
        }
        decimalCountdownSpan.hidden = true;
    }

    function startDecimalAutoAdvance() {
        if (decimalAutoTimeout) {
            return;
        }
        let remaining = 5;
        decimalCountdownSpan.textContent = `(${remaining})`;
        decimalCountdownSpan.hidden = false;
        decimalCountdownInterval = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
                decimalCountdownSpan.textContent = '(0)';
                clearInterval(decimalCountdownInterval);
                decimalCountdownInterval = null;
            } else {
                decimalCountdownSpan.textContent = `(${remaining})`;
            }
        }, 1000);
        decimalAutoTimeout = setTimeout(() => {
            decimalAutoTimeout = null;
            decimalCountdownSpan.hidden = true;
            if (decimalCountdownInterval) {
                clearInterval(decimalCountdownInterval);
                decimalCountdownInterval = null;
            }
            nextDecimalChallenge();
        }, 5000);
    }

    function cancelBinaryAutoAdvance() {
        if (binaryAutoTimeout) {
            clearTimeout(binaryAutoTimeout);
            binaryAutoTimeout = null;
        }
        if (binaryCountdownInterval) {
            clearInterval(binaryCountdownInterval);
            binaryCountdownInterval = null;
        }
        binaryCountdownSpan.hidden = true;
    }

    function startBinaryAutoAdvance() {
        if (binaryAutoTimeout) {
            return;
        }
        let remaining = 5;
        binaryCountdownSpan.textContent = `(${remaining})`;
        binaryCountdownSpan.hidden = false;
        binaryCountdownInterval = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
                binaryCountdownSpan.textContent = '(0)';
                clearInterval(binaryCountdownInterval);
                binaryCountdownInterval = null;
            } else {
                binaryCountdownSpan.textContent = `(${remaining})`;
            }
        }, 1000);
        binaryAutoTimeout = setTimeout(() => {
            binaryAutoTimeout = null;
            binaryCountdownSpan.hidden = true;
            if (binaryCountdownInterval) {
                clearInterval(binaryCountdownInterval);
                binaryCountdownInterval = null;
            }
            nextBinaryChallenge();
        }, 5000);
    }

    nextDecimalBtn.addEventListener('click', () => {
        cancelDecimalAutoAdvance();
        nextDecimalChallenge();
    });

    nextBinaryBtn.addEventListener('click', () => {
        cancelBinaryAutoAdvance();
        nextBinaryChallenge();
    });

    updateScoreDisplay();
    nextDecimalChallenge();
    nextBinaryChallenge();
}

function initHexConversions() {
    const decimalValueSpan = document.getElementById('hexDecimalValue');
    const hexDigitInput = document.getElementById('hexDigitInput');
    const hexDecimalFeedback = document.getElementById('hexDecimalFeedback');
    const nextHexDecimalBtn = document.getElementById('nextHexDecimal');

    const hexRandomValueSpan = document.getElementById('hexRandomValue');
    const hexDecimalInput = document.getElementById('hexDecimalInput');
    const hexRandomFeedback = document.getElementById('hexRandomFeedback');
    const nextHexRandomBtn = document.getElementById('nextHexRandom');
    const scoreDisplay = document.getElementById('hexScore');
    const hexDecimalCountdown = document.getElementById('hexDecimalCountdown');
    const hexRandomCountdown = document.getElementById('hexRandomCountdown');

    if (!decimalValueSpan || !hexDigitInput || !hexDecimalFeedback || !nextHexDecimalBtn || !hexRandomValueSpan || !hexDecimalInput || !hexRandomFeedback || !nextHexRandomBtn || !scoreDisplay || !hexDecimalCountdown || !hexRandomCountdown) {
        return;
    }

    let decimalChallengeValue = 0;
    let randomHexValue = '8';
    let hexDigitInteracted = false;
    let hexDecimalInteracted = false;
    let hexDigitCompleted = false;
    let hexDecimalCompleted = false;
    let score = 0;
    let decimalAutoTimeout = null;
    let decimalCountdownInterval = null;
    let hexAutoTimeout = null;
    let hexCountdownInterval = null;

    function updateScoreDisplay() {
        scoreDisplay.textContent = `Score: ${score}/${MAX_CONVERSION_SCORE}`;
    }

    function incrementScore() {
        if (score >= MAX_CONVERSION_SCORE) {
            return;
        }
        score += 1;
        updateScoreDisplay();
    }

    function resetFeedback(element) {
        element.textContent = '';
        element.classList.remove('correct', 'incorrect');
    }

    function nextHexDecimalChallenge() {
        cancelDecimalAutoAdvance();
        const possible = [8,9,10,11,12,13,14,15].filter(v => v !== decimalChallengeValue);
        decimalChallengeValue = possible[Math.floor(Math.random() * possible.length)];
        decimalValueSpan.textContent = decimalChallengeValue;
        hexDigitInput.value = '';
        hexDigitInteracted = false;
        hexDigitCompleted = false;
        resetFeedback(hexDecimalFeedback);
        hexDigitInput.focus();
    }

    function nextHexRandomChallenge() {
        cancelHexAutoAdvance();
        const hexValues = HEX_DIGITS.slice(8).split('').filter(v => v !== randomHexValue);
        randomHexValue = hexValues[Math.floor(Math.random() * hexValues.length)];
        hexRandomValueSpan.textContent = randomHexValue;
        hexDecimalInput.value = '';
        hexDecimalInteracted = false;
        hexDecimalCompleted = false;
        resetFeedback(hexRandomFeedback);
        hexDecimalInput.focus();
    }

    function evaluateHexDigit() {
        if (!hexDigitInteracted) {
            return;
        }

        const char = hexDigitInput.value.trim().toUpperCase();
        if (char === '') {
            resetFeedback(hexDecimalFeedback);
            return;
        }

        if (!HEX_DIGITS.includes(char)) {
            hexDecimalFeedback.textContent = 'Use digits 0-9 or letters A-F.';
            hexDecimalFeedback.classList.remove('correct');
            hexDecimalFeedback.classList.add('incorrect');
            return;
        }

        const expected = decimalChallengeValue.toString(16).toUpperCase();
        if (char === expected) {
            hexDecimalFeedback.textContent = `${decimalChallengeValue} in hex is ${expected}.`;
            hexDecimalFeedback.classList.remove('incorrect');
            hexDecimalFeedback.classList.add('correct');
            if (!hexDigitCompleted) {
                incrementScore();
                hexDigitCompleted = true;
                startDecimalAutoAdvance();
            }
        } else {
            hexDecimalFeedback.textContent = `Almost! ${decimalChallengeValue} in hex is ${expected}.`;
            hexDecimalFeedback.classList.remove('correct');
            hexDecimalFeedback.classList.add('incorrect');
            cancelDecimalAutoAdvance();
        }
    }

    function evaluateHexDecimal() {
        if (!hexDecimalInteracted) {
            return;
        }

        const rawValue = hexDecimalInput.value.trim();
        if (rawValue === '') {
            resetFeedback(hexRandomFeedback);
            return;
        }

        const numeric = Number(rawValue);
        if (Number.isNaN(numeric)) {
            hexRandomFeedback.textContent = 'Enter a decimal value between 0 and 15.';
            hexRandomFeedback.classList.remove('correct');
            hexRandomFeedback.classList.add('incorrect');
            return;
        }

        if (numeric < 0 || numeric > 15) {
            hexRandomFeedback.textContent = 'Keep it between 0 and 15.';
            hexRandomFeedback.classList.remove('correct');
            hexRandomFeedback.classList.add('incorrect');
            return;
        }

        const expected = parseInt(randomHexValue, 16);
        if (numeric === expected) {
            hexRandomFeedback.textContent = `${randomHexValue} in decimal is ${expected}.`;
            hexRandomFeedback.classList.remove('incorrect');
            hexRandomFeedback.classList.add('correct');
            if (!hexDecimalCompleted) {
                incrementScore();
                hexDecimalCompleted = true;
                startHexAutoAdvance();
            }
        } else {
            hexRandomFeedback.textContent = `Not quite. ${randomHexValue} in decimal is ${expected}.`;
            hexRandomFeedback.classList.remove('correct');
            hexRandomFeedback.classList.add('incorrect');
            cancelHexAutoAdvance();
        }
    }

    hexDigitInput.addEventListener('input', () => {
        const char = hexDigitInput.value.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 1);
        hexDigitInput.value = char;
        hexDigitInteracted = true;
        evaluateHexDigit();
    });

    hexDigitInput.addEventListener('focus', () => {
        hexDigitInput.select();
    });

    hexDecimalInput.addEventListener('input', () => {
        hexDecimalInteracted = true;
        evaluateHexDecimal();
    });

    nextHexDecimalBtn.addEventListener('click', nextHexDecimalChallenge);
    nextHexRandomBtn.addEventListener('click', nextHexRandomChallenge);

    function cancelDecimalAutoAdvance() {
        if (decimalAutoTimeout) {
            clearTimeout(decimalAutoTimeout);
            decimalAutoTimeout = null;
        }
        if (decimalCountdownInterval) {
            clearInterval(decimalCountdownInterval);
            decimalCountdownInterval = null;
        }
        hexDecimalCountdown.hidden = true;
    }

    function startDecimalAutoAdvance() {
        if (decimalAutoTimeout) {
            return;
        }
        let remaining = 5;
        hexDecimalCountdown.textContent = `(${remaining})`;
        hexDecimalCountdown.hidden = false;
        decimalCountdownInterval = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
                hexDecimalCountdown.textContent = '(0)';
                clearInterval(decimalCountdownInterval);
                decimalCountdownInterval = null;
            } else {
                hexDecimalCountdown.textContent = `(${remaining})`;
            }
        }, 1000);
        decimalAutoTimeout = setTimeout(() => {
            decimalAutoTimeout = null;
            hexDecimalCountdown.hidden = true;
            if (decimalCountdownInterval) {
                clearInterval(decimalCountdownInterval);
                decimalCountdownInterval = null;
            }
            nextHexDecimalChallenge();
        }, 5000);
    }

    function cancelHexAutoAdvance() {
        if (hexAutoTimeout) {
            clearTimeout(hexAutoTimeout);
            hexAutoTimeout = null;
        }
        if (hexCountdownInterval) {
            clearInterval(hexCountdownInterval);
            hexCountdownInterval = null;
        }
        hexRandomCountdown.hidden = true;
    }

    function startHexAutoAdvance() {
        if (hexAutoTimeout) {
            return;
        }
        let remaining = 5;
        hexRandomCountdown.textContent = `(${remaining})`;
        hexRandomCountdown.hidden = false;
        hexCountdownInterval = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
                hexRandomCountdown.textContent = '(0)';
                clearInterval(hexCountdownInterval);
                hexCountdownInterval = null;
            } else {
                hexRandomCountdown.textContent = `(${remaining})`;
            }
        }, 1000);
        hexAutoTimeout = setTimeout(() => {
            hexAutoTimeout = null;
            hexRandomCountdown.hidden = true;
            if (hexCountdownInterval) {
                clearInterval(hexCountdownInterval);
                hexCountdownInterval = null;
            }
            nextHexRandomChallenge();
        }, 5000);
    }

    nextHexDecimalBtn.addEventListener('click', () => {
        cancelDecimalAutoAdvance();
        nextHexDecimalChallenge();
    });

    nextHexRandomBtn.addEventListener('click', () => {
        cancelHexAutoAdvance();
        nextHexRandomChallenge();
    });

    updateScoreDisplay();
    nextHexDecimalChallenge();
    nextHexRandomChallenge();
}

function initBinaryAddition() {
    const operandAContainer = document.getElementById('additionOperandA');
    const operandBContainer = document.getElementById('additionOperandB');
    const sumInputs = Array.from(document.querySelectorAll('.sum-input'));
    const additionFeedback = document.getElementById('additionFeedback');
    const nextAdditionBtn = document.getElementById('nextAdditionChallenge');
    const operandADecSpan = document.getElementById('additionOperandADec');
    const operandBDecSpan = document.getElementById('additionOperandBDec');
    const sumDecSpan = document.getElementById('additionSumDec');
    const scoreDisplay = document.getElementById('additionScore');
    const countdownSpan = document.getElementById('additionCountdown');

    if (!operandAContainer || !operandBContainer || sumInputs.length === 0 || !additionFeedback || !nextAdditionBtn || !operandADecSpan || !operandBDecSpan || !sumDecSpan || !scoreDisplay || !countdownSpan) {
        return;
    }

    let addendA = 0;
    let addendB = 0;
    let expectedSum = 0;
    let interacted = false;
    let score = 0;
    let autoAdvanceTimeout = null;
    let countdownInterval = null;

    function renderBinaryStrip(container, value) {
        container.innerHTML = '';
        const bits = value.toString(2).padStart(3, '0');
        const template = ['blank', ...bits.split('')];
        template.forEach(bit => {
            const span = document.createElement('span');
            span.className = 'bit-display' + (bit === 'blank' ? ' blank' : '');
            span.textContent = bit === 'blank' ? '' : bit;
            container.appendChild(span);
        });
    }

    function renderBits(container, value, bits, includeLeadingBlank = false) {
        container.innerHTML = '';
        const blank = document.createElement('span');
        blank.className = 'bit-display blank';
        blank.textContent = '';
        container.appendChild(blank);

        value.toString(2).padStart(3, '0').split('').forEach(bit => {
            const span = document.createElement('span');
            span.className = 'bit-display';
            span.textContent = bit;
            container.appendChild(span);
        });
    }

    function clampBit(value) {
        if (value === '') {
            return '';
        }
        const char = value.trim().slice(0, 1);
        if (char === '0' || char === '1') {
            return char;
        }
        return '';
    }

    function updateOperandSummaries() {
        operandADecSpan.textContent = addendA;
        operandBDecSpan.textContent = addendB;
    }

    function updateSumSummary() {
        const values = sumInputs.map(input => clampBit(input.value));
        if (values.every(v => v !== '')) {
            const sumValue = parseInt(values.join(''), 2);
            sumDecSpan.textContent = Number.isNaN(sumValue) ? '0' : sumValue;
        } else {
            sumDecSpan.textContent = '0';
        }
    }

    function evaluateAddition() {
        if (!interacted) {
            return;
        }

        const values = sumInputs.map(input => clampBit(input.value));
        if (values.some(v => v === '')) {
            resetFeedback(additionFeedback);
            sumDecSpan.textContent = '0';
            cancelAutoAdvance();
            return;
        }

        const answerBits = values.join('');
        const expectedBits = expectedSum.toString(2).padStart(4, '0');
        const sumValue = parseInt(answerBits, 2);
        sumDecSpan.textContent = Number.isNaN(sumValue) ? '0' : sumValue;

        if (answerBits === expectedBits) {
            additionFeedback.textContent = `${addendA.toString(2).padStart(3, '0')} + ${addendB.toString(2).padStart(3, '0')} = ${expectedBits}`;
            additionFeedback.classList.remove('incorrect');
            additionFeedback.classList.add('correct');
            incrementScore();
            startAutoAdvance();
        } else {
            additionFeedback.textContent = `Keep trying! ${addendA.toString(2).padStart(3, '0')} + ${addendB.toString(2).padStart(3, '0')} = ${expectedBits}`;
            additionFeedback.classList.remove('correct');
            additionFeedback.classList.add('incorrect');
            cancelAutoAdvance();
        }
    }

    function updateScoreDisplay() {
        scoreDisplay.textContent = `Score: ${score}/${MAX_BINARY_ADDITION_SCORE}`;
    }

    function sendLmsGrade(grade) {
        const url = window.gradeSubmitUrl || 'grade-submit.php';
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grade=${encodeURIComponent(grade)}`
        }).catch(() => {
            console.warn('Failed to submit grade to LMS');
        });
    }

    function incrementScore() {
        if (score >= MAX_BINARY_ADDITION_SCORE) {
            return;
        }
        score += 1;
        updateScoreDisplay();
        if (score >= MAX_BINARY_ADDITION_SCORE) {
            sendLmsGrade(1.0);
        }
    }

    function cancelAutoAdvance() {
        if (autoAdvanceTimeout) {
            clearTimeout(autoAdvanceTimeout);
            autoAdvanceTimeout = null;
        }
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        countdownSpan.hidden = true;
    }

    function startAutoAdvance() {
        if (autoAdvanceTimeout) {
            return;
        }
        let remaining = 5;
        countdownSpan.textContent = `(${remaining})`;
        countdownSpan.hidden = false;
        countdownInterval = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
                countdownSpan.textContent = '(0)';
                clearInterval(countdownInterval);
                countdownInterval = null;
            } else {
                countdownSpan.textContent = `(${remaining})`;
            }
        }, 1000);
        autoAdvanceTimeout = setTimeout(() => {
            autoAdvanceTimeout = null;
            countdownSpan.hidden = true;
            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
            nextAdditionChallenge();
        }, 5000);
    }

    function resetFeedback(element) {
        element.textContent = '';
        element.classList.remove('correct', 'incorrect');
    }

    function nextAdditionChallenge() {
        const possibleA = [0,1,2,3,4,5,6,7].filter(v => v !== addendA);
        const possibleB = [0,1,2,3,4,5,6,7].filter(v => v !== addendB);
        addendA = possibleA[Math.floor(Math.random() * possibleA.length)];
        addendB = possibleB[Math.floor(Math.random() * possibleB.length)];
        expectedSum = addendA + addendB;

        renderBinaryStrip(operandAContainer, addendA);
        renderBinaryStrip(operandBContainer, addendB);
        updateOperandSummaries();

        sumInputs.forEach(input => {
            input.value = '';
        });
        interacted = false;
        resetFeedback(additionFeedback);
        sumDecSpan.textContent = '0';
        cancelAutoAdvance();
        sumInputs[sumInputs.length - 1].focus();
    }

    function focusNextEmpty(fromIndex) {
        const right = sumInputs.slice(fromIndex + 1).find(input => input.value === '');
        if (right) {
            right.focus();
            right.select();
            return;
        }
        const left = sumInputs.slice(0, fromIndex).reverse().find(input => input.value === '');
        if (left) {
            left.focus();
            left.select();
        }
    }

    sumInputs.forEach(input => {
        input.addEventListener('input', () => {
            input.value = clampBit(input.value);
            interacted = true;
            updateSumSummary();
            evaluateAddition();
            if (input.value !== '') {
                const index = sumInputs.indexOf(input);
                if (index !== -1) {
                    focusNextEmpty(index);
                }
            } else {
                cancelAutoAdvance();
                sumDecSpan.textContent = '0';
            }
        });
        input.addEventListener('focus', () => {
            input.select();
            cancelAutoAdvance();
        });
    });

    nextAdditionBtn.addEventListener('click', () => {
        cancelAutoAdvance();
        nextAdditionChallenge();
    });

    updateScoreDisplay();
    nextAdditionChallenge();
}

document.addEventListener('DOMContentLoaded', () => {
    initTabbedCards();
    const assignment = window.nixieConfig && window.nixieConfig.assignment ? window.nixieConfig.assignment : 'Base2Conversions';

    if (assignment === 'BinaryAddition') {
        initBinaryAddition();
    } else if (assignment === 'HexConversions') {
        initHexConversions();
    } else {
        initBase2Conversions();
    }
});


