// Math Game Logic Module
const MathGame = (function() {
    // State variables
    let currentNum1 = 0;
    let currentNum2 = 0;
    let currentOperator = '+';
    let problemsSolved = 0;
    let totalProblems = 0;
    let touchpadTimer = null;
    let maxLimit = 10;
    let isGenerating = false;

    // DOM elements (will be set by init)
    let num1Input;
    let num2Input;
    let answerInput;
    let feedbackDiv;
    let touchpad;
    let limitToggle;
    let operatorSpan;
    let problemsSolvedSpan;
    let totalProblemsSpan;
    let progressFill;
    let addBtn;
    let subtractBtn;

    function generateNumbers(maxLimit) {
        const num1 = Math.floor(Math.random() * maxLimit) + 1;
        const num2 = Math.floor(Math.random() * maxLimit) + 1;
        return { num1, num2 };
    }

    function generateAddition(maxLimit) {
        let num1, num2;
        do {
            num1 = Math.floor(Math.random() * maxLimit) + 1;
            num2 = Math.floor(Math.random() * maxLimit) + 1;
        } while (num1 + num2 > maxLimit);
        return { num1, num2, answer: num1 + num2 };
    }

    function generateSubtraction(maxLimit) {
        let num1 = Math.floor(Math.random() * maxLimit) + 1;
        let num2 = Math.floor(Math.random() * num1) + 1;
        return { num1, num2, answer: num1 - num2 };
    }

    function testAddition(maxLimit, iterations = 100) {
        const results = [];
        let allPassed = true;
        for (let i = 0; i < iterations; i++) {
            const problem = generateAddition(maxLimit);
            const passed = problem.num1 >= 1 && problem.num2 >= 1 && problem.num1 <= maxLimit && problem.num2 <= maxLimit && problem.answer === problem.num1 + problem.num2 && problem.answer <= maxLimit;
            results.push({ num1: problem.num1, num2: problem.num2, answer: problem.answer, passed: passed });
            if (!passed) allPassed = false;
        }
        return { allPassed, results };
    }

    function testSubtraction(maxLimit, iterations = 100) {
        const results = [];
        let allPassed = true;
        for (let i = 0; i < iterations; i++) {
            const problem = generateSubtraction(maxLimit);
            const passed = problem.num1 >= 1 && problem.num2 >= 1 && problem.num1 <= maxLimit && problem.num2 <= maxLimit && problem.num1 >= problem.num2 && problem.answer >= 0;
            results.push({ num1: problem.num1, num2: problem.num2, answer: problem.answer, passed: passed });
            if (!passed) allPassed = false;
        }
        return { allPassed, results };
    }

    function testRandomField(iterations = 1000) {
        const fieldCounts = { num1: 0, num2: 0, answer: 0 };
        for (let i = 0; i < iterations; i++) {
            const field = Math.floor(Math.random() * 3);
            if (field === 0) fieldCounts.num1++;
            else if (field === 1) fieldCounts.num2++;
            else fieldCounts.answer++;
        }
        const expected = iterations / 3;
        const tolerance = expected * 0.2;
        const passed = Math.abs(fieldCounts.num1 - expected) < tolerance && Math.abs(fieldCounts.num2 - expected) < tolerance && Math.abs(fieldCounts.answer - expected) < tolerance;
        return { passed, fieldCounts, expected, tolerance };
    }

    function initTouchpad() {
        while (touchpad.firstChild) {
            touchpad.removeChild(touchpad.firstChild);
        }
        for (let i = 1; i <= maxLimit; i++) {
            const btn = document.createElement('button');
            btn.className = 'touchpad-btn';
            btn.setAttribute('data-num', i);
            btn.textContent = i;
            btn.onclick = function() {
                const num = parseInt(this.getAttribute('data-num'));
                if (num1Input.value === '') {
                    num1Input.value = num;
                } else if (num2Input.value === '') {
                    num2Input.value = num;
                } else {
                    answerInput.value = num;
                }
                checkAnswer();
            };
            touchpad.appendChild(btn);
        }
    }

    function setOperator(operator, operatorSpan) {
        currentOperator = operator;
        if (operatorSpan) {
            operatorSpan.textContent = operator === '+' ? '+' : '−';
        }
        if (addBtn) {
            addBtn.classList.toggle('active', operator === '+');
        }
        if (subtractBtn) {
            subtractBtn.classList.toggle('active', operator === '-');
        }
        generateNewProblem();
    }

    function setMaxLimit(limit) {
        maxLimit = limit;
        initTouchpad();
        generateNewProblem();
    }

    function generateNewProblem() {
        if (isGenerating) return;
        isGenerating = true;
        
        if (touchpadTimer) {
            clearTimeout(touchpadTimer);
            touchpadTimer = null;
        }
        feedbackDiv.textContent = '';

        const problem = currentOperator === '+'
            ? generateAddition(maxLimit)
            : generateSubtraction(maxLimit);
        currentNum1 = problem.num1;
        currentNum2 = problem.num2;

        const emptyField = Math.floor(Math.random() * 3);
        
        if (emptyField === 0) {
            num1Input.value = '';
            num2Input.value = currentNum2;
            answerInput.value = currentOperator === '+' ? currentNum1 + currentNum2 : currentNum1 - currentNum2;
        } else if (emptyField === 1) {
            num1Input.value = currentNum1;
            num2Input.value = '';
            answerInput.value = currentOperator === '+' ? currentNum1 + currentNum2 : currentNum1 - currentNum2;
        } else {
            num1Input.value = currentNum1;
            num2Input.value = currentNum2;
            answerInput.value = '';
        }
        
        clearTimer();
        updateProgress();
        isGenerating = false;
    }

    // Pure helper: returns true/false/null (null = incomplete/invalid input)
    function evaluateAnswer(val1, val2, answerVal, operator) {
        if (isNaN(val1) || isNaN(val2) || isNaN(answerVal)) {
            return null;
        }
        if (operator === '+') {
            return val1 + val2 === answerVal;
        }
        return val1 - val2 === answerVal;
    }

    function checkAnswer() {
        clearTimer();
        const val1 = parseInt(num1Input.value);
        const val2 = parseInt(num2Input.value);
        const answerVal = parseInt(answerInput.value);

        const isCorrect = evaluateAnswer(val1, val2, answerVal, currentOperator);

        if (isCorrect === null) {
            feedbackDiv.textContent = 'Please fill in all fields!';
            feedbackDiv.style.color = '#ff6b6b';
            return;
        }
        
        if (isCorrect) {
            feedbackDiv.textContent = 'Correct! 🎉';
            feedbackDiv.style.color = '#4ecdc4';
            problemsSolved++;
            totalProblems++;
            updateProgress();
            playSound('correct');
            startTimer();
        } else {
            feedbackDiv.textContent = 'Incorrect 😊';
            feedbackDiv.style.color = '#ff6b6b';
            totalProblems++;
            updateProgress();
            clearTimer();
            playSound('incorrect');
            touchpadTimer = setTimeout(function() {
                generateNewProblem();
            }, 1500);
        }
    }

    function updateProgress() {
        problemsSolvedSpan.textContent = problemsSolved;
        totalProblemsSpan.textContent = totalProblems;
        
        if (totalProblems > 0) {
            const progressPercentage = (problemsSolved / totalProblems) * 100;
            progressFill.style.width = `${progressPercentage}%`;
        }
    }

    function startTimer() {
        if (isGenerating) return;
        clearTimer();
        if (touchpadTimer) return;
        touchpadTimer = setTimeout(function() {
            touchpadTimer = null;
            generateNewProblem();
        }, 2000);
    }

    function clearTimer() {
        if (touchpadTimer) {
            clearTimeout(touchpadTimer);
            touchpadTimer = null;
        }
    }

    function playSound(type) {
        // Placeholder for future sound support
    }

    function init(domElements) {
        num1Input = domElements.num1Input;
        num2Input = domElements.num2Input;
        answerInput = domElements.answerInput;
        feedbackDiv = domElements.feedbackDiv;
        touchpad = domElements.touchpad;
        limitToggle = domElements.limitToggle;
        problemsSolvedSpan = domElements.problemsSolvedSpan;
        totalProblemsSpan = domElements.totalProblemsSpan;
        progressFill = domElements.progressFill;
        operatorSpan = domElements.operatorSpan;
        addBtn = domElements.addBtn;
        subtractBtn = domElements.subtractBtn;

        initTouchpad();
        
        limitToggle.checked = maxLimit === 20;
        
        limitToggle.addEventListener('change', function() {
            maxLimit = this.checked ? 20 : 10;
            initTouchpad();
            generateNewProblem();
        });
    }

    return {
        init,
        setOperator,
        setMaxLimit,
        generateNewProblem,
        checkAnswer,
        generateAddition,
        generateSubtraction,
        evaluateAnswer,
        testAddition,
        testSubtraction,
        testRandomField,
        getMaxLimit: () => maxLimit,
        getProblemsSolved: () => problemsSolved,
        getTotalProblems: () => totalProblems
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MathGame;
}