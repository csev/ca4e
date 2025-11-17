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
            <p>You will be asked 10 questions about ASCII character values.</p>
            <p>For each question, you need to find the ASCII decimal value of the given character.</p>
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
     * Generate 10 random ASCII questions
     */
    generateQuestions() {
        this.questions = [];
        const usedChars = new Set();
        
        // Generate 10 unique questions from printable ASCII (32-126)
        while (this.questions.length < 10) {
            const asciiValue = Math.floor(Math.random() * (126 - 32 + 1)) + 32;
            const char = String.fromCharCode(asciiValue);
            
            // Skip if we've already used this character
            if (usedChars.has(asciiValue)) continue;
            usedChars.add(asciiValue);
            
            this.questions.push({
                char: char,
                asciiValue: asciiValue,
                answered: false,
                correct: false
            });
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
        html += `<div class="question-text">What is the ASCII decimal value of the character '<strong>${this.escapeHtml(question.char)}</strong>'?</div>`;
        
        // Show input field if not answered yet
        if (!question.answered) {
            html += `<input type="number" id="answerInput" class="answer-input" placeholder="Enter decimal value" min="0" max="255">`;
            html += `<button onclick="currentExercise.checkAnswer()" style="margin-left: 10px; padding: 8px 16px;">Submit Answer</button>`;
        } else {
            // Show feedback
            if (question.correct) {
                html += `<div class="answer-feedback correct">✓ Correct! The ASCII value of '${this.escapeHtml(question.char)}' is ${question.asciiValue}.</div>`;
            } else {
                html += `<div class="answer-feedback incorrect">✗ Incorrect. The ASCII value of '${this.escapeHtml(question.char)}' is ${question.asciiValue}.</div>`;
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

        const userAnswer = parseInt(input.value);
        const question = this.questions[this.currentQuestionIndex];

        if (isNaN(userAnswer)) {
            alert('Please enter a valid number');
            return;
        }

        question.answered = true;
        question.correct = (userAnswer === question.asciiValue);

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

