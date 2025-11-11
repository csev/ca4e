(function () {
    const container = document.querySelector('.logic-container');
    if (!container) {
        return;
    }

    const config = window.logicConfig || {};
    const MAX_SCORE = Number(config.maxScore) || 10;
    const SCORE_MESSAGE = `Score: {score}/${MAX_SCORE}`;

    const elements = {
        gateDiagram: document.getElementById('gateDiagram'),
        gateName: document.getElementById('gateName'),
        gateDescription: document.getElementById('gateDescription'),
        truthTable: document.getElementById('truthTable'),
        truthTableHeaderRow: document.getElementById('truthTableHeaderRow'),
        truthTableBody: document.getElementById('truthTableBody'),
        truthTableCaption: document.getElementById('truthTableCaption'),
        feedback: document.getElementById('challengeFeedback'),
        scoreDisplay: document.getElementById('scoreDisplay'),
        autoAdvanceToggle: document.getElementById('autoAdvanceToggle'),
        nextButton: document.getElementById('nextTableBtn'),
        countdown: document.getElementById('nextCountdown'),
    };

    const state = {
        score: 0,
        gradeSent: false,
        countdownTimer: null,
        countdownRemaining: 0,
        awaitingAdvance: false,
        currentGate: null,
        lastGateId: null,
        missingCells: [],
    };

    const gateDefinitions = [
        {
            id: 'NOT',
            name: 'NOT',
            alias: 'Inverter',
            arity: 1,
            inputs: ['A'],
            description: 'Outputs the opposite value of the single input.',
            logic: (inputs) => (inputs[0] === 0 ? 1 : 0),
            diagram: () => `
                <svg viewBox="0 0 320 200" role="img" aria-labelledby="notGateTitle">
                    <title id="notGateTitle">NOT gate schematic</title>
                    <line x1="30" y1="70" x2="120" y2="70" stroke="#f97316" stroke-width="10" stroke-linecap="round"/>
                    <line x1="30" y1="130" x2="120" y2="130" stroke="#f97316" stroke-width="10" stroke-linecap="round"/>
                    <path d="M120 40 L220 100 L120 160 Z" fill="#0f172a" stroke="#f97316" stroke-width="10"/>
                    <circle cx="240" cy="100" r="16" fill="#0f172a" stroke="#f97316" stroke-width="10"/>
                    <line x1="256" y1="100" x2="290" y2="100" stroke="#f97316" stroke-width="10" stroke-linecap="round"/>
                </svg>
            `,
        },
        {
            id: 'AND',
            name: 'AND',
            alias: 'Conjunction',
            arity: 2,
            inputs: ['A', 'B'],
            description: 'Outputs 1 only when both inputs are 1.',
            logic: (inputs) => (inputs[0] === 1 && inputs[1] === 1 ? 1 : 0),
            diagram: () => `
                <svg viewBox="0 0 320 200" role="img" aria-labelledby="andGateTitle">
                    <title id="andGateTitle">AND gate schematic</title>
                    <line x1="30" y1="70" x2="110" y2="70" stroke="#f97316" stroke-width="10" stroke-linecap="round"/>
                    <line x1="30" y1="130" x2="110" y2="130" stroke="#f97316" stroke-width="10" stroke-linecap="round"/>
                    <path d="M110 30 H190 A70 70 0 0 1 190 170 H110 Z" fill="#0f172a" stroke="#f97316" stroke-width="10"/>
                    <line x1="260" y1="100" x2="290" y2="100" stroke="#f97316" stroke-width="10" stroke-linecap="round"/>
                </svg>
            `,
        },
        {
            id: 'OR',
            name: 'OR',
            alias: 'Disjunction',
            arity: 2,
            inputs: ['A', 'B'],
            description: 'Outputs 1 when either input is 1.',
            logic: (inputs) => (inputs[0] === 1 || inputs[1] === 1 ? 1 : 0),
            diagram: () => `
                <svg viewBox="0 0 320 200" role="img" aria-labelledby="orGateTitle">
                    <title id="orGateTitle">OR gate schematic</title>
                    <line x1="30" y1="70" x2="110" y2="70" stroke="#f97316" stroke-width="10" stroke-linecap="round"/>
                    <line x1="30" y1="130" x2="110" y2="130" stroke="#f97316" stroke-width="10" stroke-linecap="round"/>
                    <path d="M110 30 Q190 30 250 100 Q190 170 110 170 Q140 100 110 30 Z" fill="#0f172a" stroke="#f97316" stroke-width="10"/>
                    <line x1="250" y1="100" x2="290" y2="100" stroke="#f97316" stroke-width="10" stroke-linecap="round"/>
                </svg>
            `,
        },
        {
            id: 'XOR',
            name: 'XOR',
            alias: 'Exclusive OR',
            arity: 2,
            inputs: ['A', 'B'],
            description: 'Outputs 1 when exactly one input is 1.',
            logic: (inputs) => (inputs[0] ^ inputs[1]),
            diagram: () => `
                <svg viewBox="0 0 320 200" role="img" aria-labelledby="xorGateTitle">
                    <title id="xorGateTitle">XOR gate schematic</title>
                    <line x1="30" y1="70" x2="110" y2="70" stroke="#f97316" stroke-width="10" stroke-linecap="round"/>
                    <line x1="30" y1="130" x2="110" y2="130" stroke="#f97316" stroke-width="10" stroke-linecap="round"/>
                    <path d="M110 30 Q190 30 250 100 Q190 170 110 170 Q140 100 110 30 Z" fill="#0f172a" stroke="#f97316" stroke-width="10"/>
                    <path d="M90 30 Q120 100 90 170" fill="none" stroke="#f97316" stroke-width="10" stroke-linecap="round"/>
                    <line x1="250" y1="100" x2="290" y2="100" stroke="#f97316" stroke-width="10" stroke-linecap="round"/>
                </svg>
            `,
        },
        {
            id: 'NAND',
            name: 'NAND',
            alias: 'Not AND',
            arity: 2,
            inputs: ['A', 'B'],
            description: 'Outputs 0 only when both inputs are 1.',
            logic: (inputs) => (inputs[0] === 1 && inputs[1] === 1 ? 0 : 1),
            diagram: () => `
                <svg viewBox="0 0 320 200" role="img" aria-labelledby="nandGateTitle">
                    <title id="nandGateTitle">NAND gate schematic</title>
                    <line x1="30" y1="70" x2="110" y2="70" stroke="#f97316" stroke-width="10" stroke-linecap="round"/>
                    <line x1="30" y1="130" x2="110" y2="130" stroke="#f97316" stroke-width="10" stroke-linecap="round"/>
                    <path d="M110 30 H190 A70 70 0 0 1 190 170 H110 Z" fill="#0f172a" stroke="#f97316" stroke-width="10"/>
                    <circle cx="276" cy="100" r="16" fill="#0f172a" stroke="#f97316" stroke-width="10"/>
                    <line x1="292" y1="100" x2="340" y2="100" stroke="#f97316" stroke-width="10" stroke-linecap="butt"/>
                </svg>
            `,
        },
        {
            id: 'NOR',
            name: 'NOR',
            alias: 'Not OR',
            arity: 2,
            inputs: ['A', 'B'],
            description: 'Outputs 1 only when both inputs are 0.',
            logic: (inputs) => (inputs[0] === 0 && inputs[1] === 0 ? 1 : 0),
            diagram: () => `
                <svg viewBox="0 0 320 200" role="img" aria-labelledby="norGateTitle">
                    <title id="norGateTitle">NOR gate schematic</title>
                    <line x1="30" y1="70" x2="110" y2="70" stroke="#f97316" stroke-width="10" stroke-linecap="round"/>
                    <line x1="30" y1="130" x2="110" y2="130" stroke="#f97316" stroke-width="10" stroke-linecap="round"/>
                    <path d="M110 30 Q190 30 250 100 Q190 170 110 170 Q140 100 110 30 Z" fill="#0f172a" stroke="#f97316" stroke-width="10"/>
                    <circle cx="260" cy="100" r="16" fill="#0f172a" stroke="#f97316" stroke-width="10"/>
                    <line x1="276" y1="100" x2="300" y2="100" stroke="#f97316" stroke-width="10" stroke-linecap="round"/>
                </svg>
            `,
        },
    ];

    function updateScoreDisplay() {
        if (elements.scoreDisplay) {
            elements.scoreDisplay.textContent = SCORE_MESSAGE.replace('{score}', state.score);
        }
    }

    function setFeedback(message, tone = null) {
        if (!elements.feedback) {
            return;
        }
        elements.feedback.textContent = message;
        elements.feedback.classList.remove('success', 'error');
        if (tone) {
            elements.feedback.classList.add(tone);
        }
    }

    function clearCountdown() {
        if (state.countdownTimer) {
            clearInterval(state.countdownTimer);
            state.countdownTimer = null;
        }
        state.countdownRemaining = 0;
        if (elements.countdown) {
            elements.countdown.hidden = true;
            elements.countdown.textContent = '';
        }
    }

    function updateCountdownDisplay() {
        if (!elements.countdown) {
            return;
        }
        if (state.countdownRemaining > 0) {
            elements.countdown.hidden = false;
            elements.countdown.textContent = `(${state.countdownRemaining})`;
        } else {
            elements.countdown.hidden = true;
            elements.countdown.textContent = '';
        }
    }

    function startCountdown(seconds) {
        clearCountdown();
        state.countdownRemaining = seconds;
        updateCountdownDisplay();

        state.countdownTimer = window.setInterval(() => {
            state.countdownRemaining -= 1;
            if (state.countdownRemaining <= 0) {
                clearCountdown();
                state.awaitingAdvance = false;
                buildChallenge();
                return;
            }
            updateCountdownDisplay();
        }, 1000);
    }

    function submitGradeToLms(grade, message) {
        const url = config.gradeSubmitUrl || 'grade-submit.php';
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `grade=${encodeURIComponent(grade)}`,
        })
            .then((response) => response.json().catch(() => ({})))
            .then(() => {
                if (message) {
                    alert(message);
                }
            })
            .catch(() => {
                console.warn('Unable to submit grade to the LMS at this time.');
            });
    }

    function pickGate() {
        const candidates = gateDefinitions.filter((gate) => gate.id !== state.lastGateId);
        const pool = candidates.length > 0 ? candidates : gateDefinitions;
        const choice = pool[Math.floor(Math.random() * pool.length)];
        state.lastGateId = choice.id;
        return choice;
    }

    function buildTruthTableRows(gate) {
        const rows = [];
        const totalRows = Math.pow(2, gate.arity);
        for (let i = 0; i < totalRows; i++) {
            const binary = i.toString(2).padStart(gate.arity, '0').split('').map((digit) => parseInt(digit, 10));
            rows.push({
                inputs: binary,
                output: gate.logic(binary),
            });
        }
        return rows;
    }

    function chooseMissingIndices(rowCount, gate) {
        const required = gate.arity === 1 ? 1 : Math.min(3, Math.max(2, Math.round(Math.random()) + 2));
        const missing = new Set();
        const indices = Array.from({ length: rowCount }, (_, index) => index);
        while (missing.size < required && indices.length > 0) {
            const idx = Math.floor(Math.random() * indices.length);
            const value = indices.splice(idx, 1)[0];
            missing.add(value);
        }
        if (missing.size === 0) {
            missing.add(0);
        }
        return missing;
    }

    function renderGateDiagram(gate) {
        if (!elements.gateDiagram) {
            return;
        }
        elements.gateDiagram.setAttribute('aria-label', `${gate.name} gate schematic`);
        elements.gateDiagram.innerHTML = gate.diagram();
    }

    function resetInputs() {
        state.missingCells.forEach((cell) => {
            cell.input.removeEventListener('input', cell.onInput);
            cell.input.removeEventListener('keydown', cell.onKeydown);
        });
        state.missingCells = [];
    }

    function focusNextEmpty(fromIndex, direction = 1) {
        const total = state.missingCells.length;
        if (total === 0) {
            return;
        }

        const scanForward = (startIndex, endIndex, step) => {
            for (let idx = startIndex; idx !== endIndex; idx += step) {
                const cell = state.missingCells[idx];
                if (cell && cell.input.value.trim() === '') {
                    cell.input.focus();
                    return true;
                }
            }
            return false;
        };

        if (direction === -1) {
            if (scanForward(fromIndex - 1, -1, -1)) {
                return;
            }
            scanForward(total - 1, fromIndex - 1, -1);
        } else {
            if (scanForward(fromIndex + 1, total, 1)) {
                return;
            }
            scanForward(0, fromIndex, 1);
        }
    }

    function checkAnswers() {
        if (state.missingCells.length === 0) {
            return;
        }

        let allFilled = true;
        let allCorrect = true;

        state.missingCells.forEach((cell) => {
            const value = cell.input.value.trim();
            if (value.length === 0) {
                allFilled = false;
                cell.input.removeAttribute('aria-invalid');
                cell.input.classList.remove('correct');
            } else if (value !== cell.expected) {
                allCorrect = false;
                cell.input.setAttribute('aria-invalid', 'true');
                cell.input.classList.remove('correct');
            } else {
                cell.input.setAttribute('aria-invalid', 'false');
                cell.input.classList.add('correct');
            }
        });

        if (!allFilled) {
            state.awaitingAdvance = false;
            setFeedback('Fill in each missing output with 0 or 1.');
            return;
        }

        if (!allCorrect) {
            state.awaitingAdvance = false;
            setFeedback('One or more values are incorrect. Adjust and try again.', 'error');
            return;
        }

        handleCorrectResponse();
    }

    function handleCorrectResponse() {
        state.missingCells.forEach((cell) => {
            cell.input.setAttribute('readonly', 'true');
            cell.input.classList.add('correct');
            cell.input.setAttribute('aria-invalid', 'false');
        });

        if (!state.awaitingAdvance) {
            state.score = Math.min(MAX_SCORE, state.score + 1);
            updateScoreDisplay();
        }

        state.awaitingAdvance = true;
        setFeedback('Excellent! You completed this truth table.', 'success');

        if (state.score >= MAX_SCORE && !state.gradeSent) {
            state.gradeSent = true;
            submitGradeToLms(1.0, 'Great job! A score of 1.0 has been sent to the LMS.');
        }

        if (elements.autoAdvanceToggle && elements.autoAdvanceToggle.checked) {
            startCountdown(5);
        } else {
            setFeedback('Excellent! Click “Next table” when you are ready for another challenge.', 'success');
        }
    }

    function handleInputEvent(cell, index, event) {
        const input = event.target;
        const sanitized = input.value.replace(/[^01]/g, '').slice(0, 1);
        input.value = sanitized;

        if (sanitized.length === 1) {
            input.setAttribute('aria-invalid', sanitized === cell.expected ? 'false' : 'true');
            if (sanitized === cell.expected) {
                input.classList.add('correct');
                focusNextEmpty(index, 1);
            }
        } else {
            input.removeAttribute('aria-invalid');
            input.classList.remove('correct');
        }

        checkAnswers();
    }

    function handleKeydownEvent(index, event) {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            focusNextEmpty(index, -1);
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            focusNextEmpty(index, 1);
        }
    }

    function buildChallenge() {
        clearCountdown();
        resetInputs();
        state.awaitingAdvance = false;

        const gate = pickGate();
        state.currentGate = gate;

        if (elements.gateName) {
            elements.gateName.textContent = gate.name;
        }
        if (elements.gateDescription) {
            elements.gateDescription.textContent = gate.description;
        }
        if (elements.truthTableCaption) {
            elements.truthTableCaption.textContent = `Truth table for the ${gate.name} gate.`;
        }

        renderGateDiagram(gate);

        if (elements.truthTableHeaderRow) {
            elements.truthTableHeaderRow.innerHTML = '';
            gate.inputs.forEach((label) => {
                const th = document.createElement('th');
                th.scope = 'col';
                th.textContent = label;
                elements.truthTableHeaderRow.appendChild(th);
            });

            const outputTh = document.createElement('th');
            outputTh.scope = 'col';
            outputTh.textContent = 'Output';
            elements.truthTableHeaderRow.appendChild(outputTh);
        }

        const rows = buildTruthTableRows(gate);
        const missing = chooseMissingIndices(rows.length, gate);

        if (elements.truthTableBody) {
            elements.truthTableBody.innerHTML = '';
            rows.forEach((row, rowIndex) => {
                const tr = document.createElement('tr');

                row.inputs.forEach((bit, idx) => {
                    const td = document.createElement('td');
                    td.textContent = bit.toString();
                    td.dataset.column = gate.inputs[idx];
                    tr.appendChild(td);
                });

                const outputCell = document.createElement('td');
                outputCell.classList.add('output-cell');

                if (missing.has(rowIndex)) {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.inputMode = 'numeric';
                    input.pattern = '[01]';
                    input.maxLength = 1;
                    input.setAttribute('aria-label', `Output for inputs ${row.inputs.join(', ')}`);
                    const cell = {
                        input,
                        expected: row.output.toString(),
                        onInput: null,
                        onKeydown: null,
                    };
                    cell.onInput = handleInputEvent.bind(null, cell, state.missingCells.length);
                    cell.onKeydown = handleKeydownEvent.bind(null, state.missingCells.length);

                    input.addEventListener('input', cell.onInput);
                    input.addEventListener('keydown', cell.onKeydown);

                    state.missingCells.push(cell);
                    outputCell.appendChild(input);
                } else {
                    outputCell.textContent = row.output.toString();
                    outputCell.classList.add('given-output');
                }

                tr.appendChild(outputCell);
                elements.truthTableBody.appendChild(tr);
            });
        }

        if (state.missingCells.length > 0) {
            window.requestAnimationFrame(() => {
                state.missingCells[0].input.focus();
            });
        }

        setFeedback('');
    }

    if (elements.nextButton) {
        elements.nextButton.addEventListener('click', () => {
            state.awaitingAdvance = false;
            buildChallenge();
        });
    }

    if (elements.autoAdvanceToggle) {
        elements.autoAdvanceToggle.addEventListener('change', () => {
            if (!elements.autoAdvanceToggle.checked) {
                clearCountdown();
            } else if (state.awaitingAdvance) {
                startCountdown(5);
            }
        });
    }

    updateScoreDisplay();
    buildChallenge();
})();


