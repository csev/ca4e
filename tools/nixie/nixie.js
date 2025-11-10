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

function initBase2Conversions() {
    if (!document.querySelector('.binary-input-grid')) {
        return;
    }

    const decimalNixie = new SimpleNixieDisplay('decimalNixie');
    const binaryNixie = new SimpleNixieDisplay('binaryNixie');

    const decimalValueSpan = document.getElementById('decimalValue');
    const decimalFeedback = document.getElementById('decimalFeedback');
    const conversionInputs = Array.from(document.querySelectorAll('.conversion-bit'));
    const nextDecimalBtn = document.getElementById('nextDecimalChallenge');

    const binaryBits = {
        4: document.getElementById('binaryBit4'),
        2: document.getElementById('binaryBit2'),
        1: document.getElementById('binaryBit1'),
    };
    const decimalAnswerInput = document.getElementById('decimalAnswerInput');
    const binaryFeedback = document.getElementById('binaryFeedback');
    const nextBinaryBtn = document.getElementById('nextBinaryChallenge');

    if (!decimalValueSpan || !decimalFeedback || conversionInputs.length === 0 || !nextDecimalBtn || !decimalAnswerInput || !binaryFeedback || !nextBinaryBtn) {
        return;
    }

    let decimalChallengeValue = 0;
    let binaryChallengeValue = 0;
    let decimalInteracted = false;
    let binaryInteracted = false;

    function randomValue(allowZero = true) {
        const min = allowZero ? 0 : 1;
        return Math.floor(Math.random() * (8 - min)) + min;
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

    function updateBinaryDisplay(value) {
        binaryBits[4].textContent = (value & 4) ? '1' : '0';
        binaryBits[2].textContent = (value & 2) ? '1' : '0';
        binaryBits[1].textContent = (value & 1) ? '1' : '0';
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
        } else {
            const expected = decimalChallengeValue.toString(2).padStart(3, '0');
            decimalFeedback.textContent = `Almost! ${decimalChallengeValue} in binary is ${expected}.`;
            decimalFeedback.classList.remove('correct');
            decimalFeedback.classList.add('incorrect');
        }
    }

    function evaluateBinaryToDecimal() {
        if (!binaryInteracted) {
            return;
        }

        const rawValue = decimalAnswerInput.value.trim();
        if (rawValue === '') {
            resetFeedback(binaryFeedback);
            binaryNixie.clear();
            return;
        }

        const numeric = Number(rawValue);
        if (Number.isNaN(numeric)) {
            binaryFeedback.textContent = 'Enter a decimal value between 0 and 7.';
            binaryFeedback.classList.remove('correct');
            binaryFeedback.classList.add('incorrect');
            binaryNixie.clear();
            return;
        }

        const sanitized = Math.round(numeric);
        if (sanitized < 0 || sanitized > 7) {
            binaryFeedback.textContent = 'Keep it between 0 and 7.';
            binaryFeedback.classList.remove('correct');
            binaryFeedback.classList.add('incorrect');
            binaryNixie.clear();
            return;
        }

        if (sanitized === binaryChallengeValue) {
            binaryFeedback.textContent = `Correct! ${binaryChallengeValue.toString(2).padStart(3, '0')} equals ${binaryChallengeValue}.`;
            binaryFeedback.classList.remove('incorrect');
            binaryFeedback.classList.add('correct');
            binaryNixie.setValue(binaryChallengeValue);
        } else {
            binaryFeedback.textContent = `Not quite. ${binaryChallengeValue.toString(2).padStart(3, '0')} equals ${binaryChallengeValue}.`;
            binaryFeedback.classList.remove('correct');
            binaryFeedback.classList.add('incorrect');
            binaryNixie.clear();
        }
    }

    function nextDecimalChallenge() {
        decimalChallengeValue = randomValue(false);
        decimalValueSpan.textContent = decimalChallengeValue;
        decimalNixie.setValue(decimalChallengeValue);
        setBitsFromValue(0);
        resetFeedback(decimalFeedback);
        decimalInteracted = false;
        conversionInputs[conversionInputs.length - 1].focus();
    }

    function nextBinaryChallenge() {
        binaryChallengeValue = randomValue();
        updateBinaryDisplay(binaryChallengeValue);
        binaryNixie.clear();
        decimalAnswerInput.value = '';
        resetFeedback(binaryFeedback);
        binaryInteracted = false;
    }

    nextDecimalBtn.addEventListener('click', nextDecimalChallenge);
    nextBinaryBtn.addEventListener('click', nextBinaryChallenge);

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

    nextDecimalChallenge();
    nextBinaryChallenge();
}

function initBinaryAddition() {
    const operandAContainer = document.getElementById('additionOperandA');
    const operandBContainer = document.getElementById('additionOperandB');
    const sumInputs = Array.from(document.querySelectorAll('.sum-input'));
    const additionFeedback = document.getElementById('additionFeedback');
    const nextAdditionBtn = document.getElementById('nextAdditionChallenge');

    if (!operandAContainer || !operandBContainer || sumInputs.length === 0 || !additionFeedback || !nextAdditionBtn) {
        return;
    }

    let addendA = 0;
    let addendB = 0;
    let expectedSum = 0;
    let interacted = false;

    function renderBits(container, value, bits, includeLeadingBlank = false) {
        container.innerHTML = '';
        if (includeLeadingBlank) {
            const blank = document.createElement('span');
            blank.className = 'bit-display blank';
            blank.textContent = '';
            container.appendChild(blank);
        }
        const padded = value.toString(2).padStart(bits, '0');
        padded.split('').forEach(bit => {
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

    function evaluateAddition() {
        if (!interacted) {
            return;
        }

        const values = sumInputs.map(input => clampBit(input.value));
        if (values.some(v => v === '')) {
            resetFeedback(additionFeedback);
            return;
        }

        const answerBits = values.join('');
        const expectedBits = expectedSum.toString(2).padStart(4, '0');
        if (answerBits === expectedBits) {
            additionFeedback.textContent = `${addendA.toString(2).padStart(3, '0')} + ${addendB.toString(2).padStart(3, '0')} = ${expectedBits}`;
            additionFeedback.classList.remove('incorrect');
            additionFeedback.classList.add('correct');
        } else {
            additionFeedback.textContent = `Keep trying! ${addendA.toString(2).padStart(3, '0')} + ${addendB.toString(2).padStart(3, '0')} = ${expectedBits}`;
            additionFeedback.classList.remove('correct');
            additionFeedback.classList.add('incorrect');
        }
    }

    function resetFeedback(element) {
        element.textContent = '';
        element.classList.remove('correct', 'incorrect');
    }

    function nextAdditionChallenge() {
        addendA = Math.floor(Math.random() * 8);
        addendB = Math.floor(Math.random() * 8);
        expectedSum = addendA + addendB;

        renderBits(operandAContainer, addendA, 3, true);
        renderBits(operandBContainer, addendB, 3, true);

        sumInputs.forEach(input => {
            input.value = '';
        });
        interacted = false;
        resetFeedback(additionFeedback);
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
            evaluateAddition();
            if (input.value !== '') {
                const index = sumInputs.indexOf(input);
                if (index !== -1) {
                    focusNextEmpty(index);
                }
            }
        });
        input.addEventListener('focus', () => {
            input.select();
        });
    });

    nextAdditionBtn.addEventListener('click', nextAdditionChallenge);

    nextAdditionChallenge();
}

document.addEventListener('DOMContentLoaded', () => {
    const assignment = window.nixieConfig && window.nixieConfig.assignment ? window.nixieConfig.assignment : 'Base2Conversions';

    if (assignment === 'BinaryAddition') {
        initBinaryAddition();
    } else {
        initBase2Conversions();
    }
});


