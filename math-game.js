// Math Game Logic Module
const MathGame = (function() {
    // State variables
    let currentNum1 = 0;
    let currentNum2 = 0;
    let currentOperator = '+';
    let correctAnswer = 0;
    let problemsSolved = 0;
    let totalProblems = 0;
    let touchpadTimer = null;
    let maxLimit = 10;

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
        touchpad.innerHTML = '';
        console.log('initTouchpad called with maxLimit:', maxLimit);
        for (let i = 1; i <= maxLimit; i++) {
            const btn = document.createElement('button');
            btn.className = 'touchpad-btn';
            btn.setAttribute('data-num', i);
            btn.textContent = i;
            btn.addEventListener('click', function() {
                const num = parseInt(this.getAttribute('data-num'));
                if (num1Input.value === '') {
                    num1Input.value = num;
                    num1Input.focus();
                } else if (num2Input.value === '') {
                    num2Input.value = num;
                    num2Input.focus();
                } else {
                    answerInput.value = num;
                    answerInput.focus();
                }
                checkAnswer();
            });
            touchpad.appendChild(btn);
        }
    }

    function setOperator(operator, operatorSpan) {
        currentOperator = operator;
        if (operatorSpan) {
            operatorSpan.textContent = operator === '+' ? '+' : '−';
        }
        generateNewProblem();
    }

    function setMaxLimit(limit) {
        maxLimit = limit;
        initTouchpad();
        generateNewProblem();
    }

    function generateNewProblem() {
        feedbackDiv.textContent = '';
        currentNum1 = Math.floor(Math.random() * maxLimit) + 1;
        currentNum2 = Math.floor(Math.random() * maxLimit) + 1;
        
        if (currentOperator === '+') {
            while (currentNum1 + currentNum2 > maxLimit) {
                currentNum2 = Math.floor(Math.random() * maxLimit) + 1;
            }
        }
        
        if (currentOperator === '-' && currentNum1 < currentNum2) {
            [currentNum1, currentNum2] = [currentNum2, currentNum1];
        }
        
        if (currentOperator === '+') {
            correctAnswer = currentNum1 + currentNum2;
        } else {
            correctAnswer = currentNum1 - currentNum2;
        }
        
        const emptyField = Math.floor(Math.random() * 3);
        
        if (emptyField === 0) {
            num1Input.value = '';
            num2Input.value = currentNum2;
            answerInput.value = correctAnswer;
            num1Input.focus();
        } else if (emptyField === 1) {
            num1Input.value = currentNum1;
            num2Input.value = '';
            answerInput.value = correctAnswer;
            num2Input.focus();
        } else {
            num1Input.value = currentNum1;
            num2Input.value = currentNum2;
            answerInput.value = '';
            answerInput.focus();
        }
        
        clearTimer();
        totalProblems++;
        updateProgress();
    }

    function checkAnswer() {
        const userAnswer = parseInt(answerInput.value);
        
        if (isNaN(userAnswer) || answerInput.value === '') {
            feedbackDiv.textContent = 'Please enter a number!';
            feedbackDiv.style.color = '#ff6b6b';
            clearTimer();
            return;
        }
        
        if (userAnswer === correctAnswer) {
            feedbackDiv.textContent = 'Correct! 🎉';
            feedbackDiv.style.color = '#4ecdc4';
            problemsSolved++;
            updateProgress();
            playSound('correct');
            startTimer();
        } else {
            feedbackDiv.textContent = 'Incorrect 😊';
            feedbackDiv.style.color = '#ff6b6b';
            playSound('incorrect');
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
        clearTimer();
        touchpadTimer = setTimeout(function() {
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
        if (type === 'correct') {
            console.log('Beep - Correct answer!');
        } else {
            console.log('Beep - Incorrect answer!');
        }
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

        initTouchpad();
        
        limitToggle.checked = maxLimit === 20;
        
        limitToggle.addEventListener('change', function() {
            console.log('Checkbox changed, checked:', this.checked);
            maxLimit = this.checked ? 20 : 10;
            console.log('maxLimit set to:', maxLimit);
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