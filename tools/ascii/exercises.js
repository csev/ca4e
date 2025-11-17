/**
 * Exercise Classes for ASCII Chart Tool
 * 
 * This file contains exercise implementations for practicing ASCII value lookups.
 */

/**
 * ASCII Lookup Practice Exercise
 * Students practice looking up ASCII values by answering 10 questions.
 * Score goes up to 10, and when they get 10 right, a grade of 1.0 is submitted.
 */
class AsciiLookupExercise extends Exercise {
    constructor() {
        const steps = [
            { name: "Question 1", description: "Answer the first ASCII value question" },
            { name: "Question 2", description: "Answer the second ASCII value question" },
            { name: "Question 3", description: "Answer the third ASCII value question" },
            { name: "Question 4", description: "Answer the fourth ASCII value question" },
            { name: "Question 5", description: "Answer the fifth ASCII value question" },
            { name: "Question 6", description: "Answer the sixth ASCII value question" },
            { name: "Question 7", description: "Answer the seventh ASCII value question" },
            { name: "Question 8", description: "Answer the eighth ASCII value question" },
            { name: "Question 9", description: "Answer the ninth ASCII value question" },
            { name: "Question 10", description: "Answer the tenth ASCII value question" }
        ];

        const instructions = `
            <h3>ASCII Lookup Practice</h3>
            <p>You will be asked 10 questions about ASCII character values in different formats.</p>
            <p>Question types include:</p>
            <ul>
                <li><strong>Character → Decimal:</strong> Given a character, find its decimal value</li>
                <li><strong>Character → Hex:</strong> Given a character, find its hexadecimal value</li>
                <li><strong>Decimal → Character:</strong> Given a decimal value, find the character</li>
                <li><strong>Hex → Character:</strong> Given a hexadecimal value, find the character</li>
            </ul>
            <p>You can use the ASCII chart on the main page to look up the values.</p>
            <p><strong>Goal:</strong> Answer all 10 questions correctly to complete the exercise.</p>
            <p>Your score will be displayed as you progress through the questions.</p>
        `;

        super("ASCII Lookup Practice", "Practice looking up ASCII character values", steps, instructions);
        
        // Initialize exercise state
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answeredQuestions = [];
    }

    /**
     * Start the grading process
     */
    startGrading() {
        this.currentStep = 0;
        this.isGrading = true;
        this.score = 0;
        this.currentQuestionIndex = 0;
        this.answeredQuestions = [];
        
        // Generate 10 random questions
        this.generateQuestions();
        
        this.hideInstructions();
        this.showGradingSection();
        this.hideStartGradingButton();
        this.displayCurrentQuestion();
    }

    /**
     * Reset the grading process
     */
    resetGrading() {
        this.currentStep = 0;
        this.isGrading = false;
        this.score = 0;
        this.currentQuestionIndex = 0;
        this.questions = [];
        this.answeredQuestions = [];
        this.steps.forEach(step => {
            step.status = "pending";
        });
        this.showInstructions();
        this.hideGradingSection();
        this.showStartGradingButton();
        this.clearStepDisplay();
        this.resetGradeButton();
    }

    /**
     * Generate 10 random ASCII questions with different types
     */
    generateQuestions() {
        this.questions = [];
        const usedChars = new Set();
        const questionTypes = ['charToDecimal', 'charToHex', 'decimalToChar', 'hexToChar'];
        
        // Easter egg: Always include "What is the decimal value for '*'?" (42 - the answer to everything!)
        const asteriskValue = 42; // ASCII value for '*'
        const asteriskChar = '*';
        usedChars.add(asteriskValue);
        this.questions.push({
            char: asteriskChar,
            asciiValue: asteriskValue,
            questionType: 'charToDecimal', // Always ask for decimal value
            answered: false,
            correct: false
        });
        
        // Generate 9 more unique questions from printable ASCII (32-126)
        while (this.questions.length < 10) {
            const asciiValue = Math.floor(Math.random() * (126 - 32 + 1)) + 32;
            const char = String.fromCharCode(asciiValue);
            
            // Skip if we've already used this character
            if (usedChars.has(asciiValue)) continue;
            usedChars.add(asciiValue);
            
            // Randomly select question type
            const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
            
            this.questions.push({
                char: char,
                asciiValue: asciiValue,
                questionType: questionType,
                answered: false,
                correct: false
            });
        }
        
        // Shuffle the questions so the easter egg doesn't always appear first
        // But keep the asterisk question in the mix
        for (let i = this.questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
        }
    }

    /**
     * Display the current question
     */
    displayCurrentQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.completeGrading();
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        const stepDisplay = document.getElementById('stepDisplay');
        
        if (!stepDisplay) return;

        // Display question number and score
        // Count how many questions have been answered (currentQuestionIndex represents questions we've moved past)
        const questionsAnswered = this.questions.filter(q => q.answered).length;
        let html = '';
        if (questionsAnswered > 0) {
            html = `<div class="score-display">Score: ${this.score} / ${questionsAnswered}</div>`;
        }
        html += `<div class="question">`;
        html += `<div class="question-text">Question ${this.currentQuestionIndex + 1} of 10:</div>`;
        
        // Display question based on type
        let questionText = '';
        let placeholder = '';
        let inputType = 'text';
        
        switch (question.questionType) {
            case 'charToDecimal':
                questionText = `What is the ASCII <strong>decimal</strong> value of the character '<strong>${this.escapeHtml(question.char)}</strong>'?`;
                placeholder = 'Enter decimal value (e.g., 65)';
                inputType = 'number';
                break;
            case 'charToHex':
                questionText = `What is the ASCII <strong>hexadecimal</strong> value of the character '<strong>${this.escapeHtml(question.char)}</strong>'?`;
                placeholder = 'Enter hex value (e.g., 41 or 0x41)';
                inputType = 'text';
                break;
            case 'decimalToChar':
                questionText = `What is the character for ASCII decimal value <strong>${question.asciiValue}</strong>?`;
                placeholder = 'Enter character (e.g., A)';
                inputType = 'text';
                break;
            case 'hexToChar':
                const hexValue = question.asciiValue.toString(16).toUpperCase().padStart(2, '0');
                questionText = `What is the character for ASCII hexadecimal value <strong>0x${hexValue}</strong>?`;
                placeholder = 'Enter character (e.g., A)';
                inputType = 'text';
                break;
        }
        
        html += `<div class="question-text">${questionText}</div>`;
        
        // Show input field if not answered yet
        if (!question.answered) {
            html += `<input type="${inputType}" id="answerInput" class="answer-input" placeholder="${placeholder}" ${inputType === 'number' ? 'min="0" max="255"' : ''}>`;
            html += `<button onclick="currentExercise.checkAnswer()" style="margin-left: 10px; padding: 8px 16px;">Submit Answer</button>`;
        } else {
            // Show feedback
            let correctAnswer = '';
            let feedbackText = '';
            
            switch (question.questionType) {
                case 'charToDecimal':
                    correctAnswer = question.asciiValue.toString();
                    feedbackText = `The ASCII decimal value of '${this.escapeHtml(question.char)}' is ${correctAnswer}.`;
                    break;
                case 'charToHex':
                    correctAnswer = '0x' + question.asciiValue.toString(16).toUpperCase();
                    feedbackText = `The ASCII hexadecimal value of '${this.escapeHtml(question.char)}' is ${correctAnswer}.`;
                    break;
                case 'decimalToChar':
                    correctAnswer = question.char;
                    feedbackText = `The character for ASCII decimal ${question.asciiValue} is '${this.escapeHtml(question.char)}'.`;
                    break;
                case 'hexToChar':
                    const hexVal = question.asciiValue.toString(16).toUpperCase().padStart(2, '0');
                    correctAnswer = question.char;
                    feedbackText = `The character for ASCII hexadecimal 0x${hexVal} is '${this.escapeHtml(question.char)}'.`;
                    break;
            }
            
            if (question.correct) {
                html += `<div class="answer-feedback correct">✓ Correct! ${feedbackText}</div>`;
            } else {
                html += `<div class="answer-feedback incorrect">✗ Incorrect. ${feedbackText}</div>`;
            }
        }
        
        html += `</div>`;

        // Show navigation buttons
        if (question.answered) {
            if (this.currentQuestionIndex < this.questions.length - 1) {
                html += `<button id="gradeBtn" onclick="currentExercise.nextQuestion()" style="margin-top: 15px;">Next Question</button>`;
            } else {
                html += `<button id="gradeBtn" onclick="currentExercise.completeGrading()" style="margin-top: 15px;">Finish</button>`;
            }
        }

        stepDisplay.innerHTML = html;

        // Focus on input if it exists
        const input = document.getElementById('answerInput');
        if (input) {
            input.focus();
            // Allow Enter key to submit
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.checkAnswer();
                }
            });
        }
    }

    /**
     * Check the current answer
     */
    checkAnswer() {
        const input = document.getElementById('answerInput');
        if (!input) return;

        const question = this.questions[this.currentQuestionIndex];
        const userAnswer = input.value.trim();
        let isCorrect = false;

        // Validate and check answer based on question type
        switch (question.questionType) {
            case 'charToDecimal':
                const decimalAnswer = parseInt(userAnswer);
                if (isNaN(decimalAnswer)) {
                    alert('Please enter a valid decimal number');
                    return;
                }
                isCorrect = (decimalAnswer === question.asciiValue);
                break;
                
            case 'charToHex':
                // Accept hex with or without 0x prefix, case insensitive
                let hexValue = userAnswer.replace(/^0x/i, '').toUpperCase();
                const expectedHex = question.asciiValue.toString(16).toUpperCase().padStart(2, '0');
                if (!/^[0-9A-F]+$/.test(hexValue)) {
                    alert('Please enter a valid hexadecimal value (e.g., 41 or 0x41)');
                    return;
                }
                // Normalize to 2 digits for comparison (pad with leading zero)
                hexValue = hexValue.padStart(2, '0');
                isCorrect = (hexValue === expectedHex);
                break;
                
            case 'decimalToChar':
                if (userAnswer.length === 0) {
                    alert('Please enter a character');
                    return;
                }
                // Accept single character, case sensitive
                isCorrect = (userAnswer === question.char);
                break;
                
            case 'hexToChar':
                if (userAnswer.length === 0) {
                    alert('Please enter a character');
                    return;
                }
                // Accept single character, case sensitive
                isCorrect = (userAnswer === question.char);
                break;
        }

        question.answered = true;
        question.correct = isCorrect;

        if (question.correct) {
            this.score++;
            this.steps[this.currentQuestionIndex].status = "passed";
        } else {
            this.steps[this.currentQuestionIndex].status = "failed";
        }

        this.displayCurrentQuestion();
    }

    /**
     * Move to the next question
     */
    nextQuestion() {
        this.currentQuestionIndex++;
        this.currentStep = this.currentQuestionIndex;
        this.displayCurrentQuestion();
    }

    /**
     * Complete the grading process
     */
    completeGrading() {
        const stepDisplay = document.getElementById('stepDisplay');
        if (!stepDisplay) return;

        const finalScore = this.score;
        const totalQuestions = this.questions.length;
        const percentage = (finalScore / totalQuestions) * 100;

        let html = `<h3>Exercise Complete!</h3>`;
        html += `<div class="score-display">Final Score: ${finalScore} / ${totalQuestions} (${percentage.toFixed(0)}%)</div>`;

        if (finalScore === totalQuestions) {
            html += `<p class="success">🎉 Perfect! You answered all questions correctly!</p>`;
            html += `<p>Submitting grade to LMS...</p>`;
            stepDisplay.innerHTML = html;
            
            // Submit perfect grade (1.0) when all 10 are correct
            setTimeout(() => {
                this.submitGradeToLMS(1.0);
            }, 500);
        } else {
            html += `<p class="error">You answered ${finalScore} out of ${totalQuestions} questions correctly.</p>`;
            html += `<p>To complete this exercise, you need to answer all 10 questions correctly.</p>`;
            html += `<p>Click "Reset" to try again.</p>`;
            html += `<button onclick="currentExercise.resetGrading()" style="margin-top: 15px;">Reset and Try Again</button>`;
            stepDisplay.innerHTML = html;
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Override checkStep - not used in this exercise type
     */
    checkStep(stepIndex) {
        // This method is not used in the interactive question format
        return { passed: false, message: "Not used" };
    }

    /**
     * Override executeStep - not used in this exercise type
     */
    async executeStep(stepIndex) {
        // This method is not used in the interactive question format
    }
}

