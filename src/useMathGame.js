/**
 * useMathGame — Vue composable holding all reactive game state and the
 * timer-driven auto-advance logic. It performs NO direct DOM manipulation;
 * the component only renders the state it exposes here. This lets the
 * entire game logic (including the timer crash-regression behavior) be
 * unit-tested outside a real browser.
 */
import { ref, computed, onScopeDispose, getCurrentScope } from 'vue';
import {
    generateAddition,
    generateSubtraction,
    pickRandomField,
    evaluateAnswer
} from './mathEngine';

const AUTO_ADVANCE_DELAY = 2000;
const RETRY_HOLD_DELAY = 1500;
const REVEAL_DELAY = 2500;

// Message pools for variety
const CORRECT_MESSAGES = ['Correct! 🎉', 'Great job! ⭐', 'Awesome! 🌟', 'You did it! 💪', 'Super! 🎈'];
export const ENCOURAGEMENT_MESSAGES = [
    'Not quite 😊 Look again!',
    'So close! You’ve got this!',
    'No worries, take another look!',
    'Almost there! Keep going!'
];

export function useMathGame() {
    // Problem state
    const num1 = ref('');
    const num2 = ref('');
    const answer = ref('');
    const operator = ref('+');
    const maxLimit = ref(10);

    // Progress state
    const problemsSolved = ref(0);
    const totalProblems = ref(0);

    // UI state
    const feedback = ref('');
    const feedbackColor = ref('#ff6b6b');
    
    // Streak state
    const streak = ref(0);
    const bestStreak = ref(0);
    const lastResult = ref(''); // 'correct' | 'incorrect' (for audio feedback)

    // Wrong-answer state and the per-item outcome log
    const blankField = ref(null); // 0 = num1, 1 = num2, 2 = answer
    const isRevealing = ref(false);
    const itemLog = ref([]);
    let phase = 'IDLE'; // IDLE | HOLD | RETRY | REVEAL | CORRECT
    let currentSolution = { num1: 0, num2: 0, answer: 0 };

    // Internal timer / generation guard (mirrors the crash fix in the original)
    let touchpadTimer = null;
    let isGenerating = false;
    let isLocked = ref(false);
    let lastProblem = null;

    // Optional callback fired whenever progress updates
    let progressCallback = null;

    const progressPercent = computed(() => {
        if (totalProblems.value > 0) {
            return Math.round((problemsSolved.value / totalProblems.value) * 100);
        }
        return 0;
    });

    const isAdd = computed(() => operator.value === '+');

    const clearTimer = () => {
        if (touchpadTimer) {
            clearTimeout(touchpadTimer);
            touchpadTimer = null;
        }
    };

    if (getCurrentScope()) {
        onScopeDispose(clearTimer);
    }

    const updateProgress = () => {
        if (progressCallback) {
            progressCallback(problemsSolved.value, totalProblems.value);
        }
    };

    const logItem = (outcome, firstTry) => {
        itemLog.value.push({ outcome, firstTry });
    };

    const enterRetry = () => {
        touchpadTimer = null;
        phase = 'RETRY';
        feedback.value = '';
        lastResult.value = '';
        if (blankField.value === 0) {
            num1.value = '';
        } else if (blankField.value === 1) {
            num2.value = '';
        } else {
            answer.value = '';
        }
        isLocked.value = false;
    };

    const enterReveal = () => {
        phase = 'REVEAL';
        isRevealing.value = true;
        isLocked.value = true;
        num1.value = String(currentSolution.num1);
        num2.value = String(currentSolution.num2);
        answer.value = String(currentSolution.answer);
        feedbackColor.value = '#4ecdc4';
        feedback.value = operator.value === '+'
            ? `${currentSolution.num1} and ${currentSolution.num2} make ${currentSolution.answer}`
            : `${currentSolution.num1} take away ${currentSolution.num2} makes ${currentSolution.answer}`;
        logItem('missed', false);
        clearTimer();
        touchpadTimer = setTimeout(() => {
            touchpadTimer = null;
            generateNewProblem();
        }, REVEAL_DELAY);
    };

    const startTimer = () => {
        if (isGenerating) return;
        clearTimer();
        if (touchpadTimer) return;
        touchpadTimer = setTimeout(() => {
            touchpadTimer = null;
            generateNewProblem();
        }, AUTO_ADVANCE_DELAY);
    };

    function generateNewProblem() {
        if (isGenerating) return;
        isGenerating = true;

        clearTimer();
        feedback.value = '';
        lastResult.value = ''; // Reset result for audio re-arming
        isLocked.value = false;
        isRevealing.value = false;
        blankField.value = null;
        phase = 'IDLE';

        let problem;
        let currentProblem;
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
            problem =
                operator.value === '+' ? generateAddition(maxLimit.value) : generateSubtraction(maxLimit.value);
            
            currentProblem = {
                num1: operator.value === '+' ? problem.num1 : problem.num1,
                num2: operator.value === '+' ? problem.num2 : problem.num2,
                answer: operator.value === '+' ? problem.answer : problem.num1 - problem.num2
            };
            
            attempts++;
        } while (lastProblem !== null && 
                 currentProblem.num1 === lastProblem.num1 && 
                 currentProblem.num2 === lastProblem.num2 && 
                 currentProblem.answer === lastProblem.answer &&
                 attempts < maxAttempts);

        lastProblem = currentProblem;

        const emptyField = pickRandomField();
        const answerText = String(
            operator.value === '+'
                ? problem.num1 + problem.num2
                : problem.num1 - problem.num2
        );

        currentSolution = {
            num1: problem.num1,
            num2: problem.num2,
            answer: Number(answerText)
        };
        blankField.value = emptyField;

        if (emptyField === 0) {
            num1.value = '';
            num2.value = String(problem.num2);
            answer.value = answerText;
        } else if (emptyField === 1) {
            num1.value = String(problem.num1);
            num2.value = '';
            answer.value = answerText;
        } else {
            num1.value = String(problem.num1);
            num2.value = String(problem.num2);
            answer.value = '';
        }

        updateProgress();
        isGenerating = false;
    }

    function fillValue(value) {
        // populate the first empty field, then auto-check
        if (isLocked.value) return;
        if (num1.value === '') {
            num1.value = String(value);
        } else if (num2.value === '') {
            num2.value = String(value);
        } else {
            answer.value = String(value);
        }
        checkAnswer();
    }

    function checkAnswer() {
        if (phase !== 'IDLE' && phase !== 'RETRY') return;

        clearTimer();
        const val1 = parseInt(num1.value, 10);
        const val2 = parseInt(num2.value, 10);
        const answerVal = parseInt(answer.value, 10);
        const wasRetry = phase === 'RETRY';

        const isCorrect = evaluateAnswer(val1, val2, answerVal, operator.value);

        if (isCorrect === null) {
            feedback.value = 'Please fill in all fields!';
            feedbackColor.value = '#ff6b6b';
            return;
        }

        if (isCorrect) {
            feedbackColor.value = '#4ecdc4';
            // Use rotating correct message
            feedback.value = CORRECT_MESSAGES[problemsSolved.value % CORRECT_MESSAGES.length];
            problemsSolved.value++;
            if (!wasRetry) totalProblems.value++;
            
            // Update streak
            streak.value++;
            if (streak.value > bestStreak.value) {
                bestStreak.value = streak.value;
            }
            lastResult.value = 'correct';
            logItem('correct', !wasRetry);
            
            updateProgress();
            isLocked.value = true;
            phase = 'CORRECT';
            startTimer();
        } else {
            feedbackColor.value = '#ff6b6b';
            // Use rotating encouragement message
            feedback.value = ENCOURAGEMENT_MESSAGES[totalProblems.value % ENCOURAGEMENT_MESSAGES.length];
            if (!wasRetry) totalProblems.value++;
            
            // Reset streak on incorrect
            streak.value = 0;
            lastResult.value = 'incorrect';
            
            updateProgress();
            clearTimer();
            isLocked.value = true;

            if (wasRetry) {
                enterReveal();
            } else {
                phase = 'HOLD';
                touchpadTimer = setTimeout(enterRetry, RETRY_HOLD_DELAY);
            }
        }
    }

    function setOperator(op) {
        operator.value = op;
        generateNewProblem();
    }

    function setMaxLimit(limit) {
        maxLimit.value = limit;
        generateNewProblem();
    }

    function resetProgress() {
        problemsSolved.value = 0;
        totalProblems.value = 0;
        streak.value = 0;
        lastResult.value = '';
    }

    function setProgressCallback(cb) {
        progressCallback = cb;
    }

    function cancelPendingAdvance() {
        clearTimer();
    }

    return {
        // state
        num1,
        num2,
        answer,
        operator,
        feedback,
        feedbackColor,
        problemsSolved,
        totalProblems,
        progressPercent,
        isAdd,
        maxLimit,
        streak,
        bestStreak,
        lastResult,
        isLocked,
        isRevealing,
        blankField,
        itemLog,
        // actions
        generateNewProblem,
        checkAnswer,
        fillValue,
        setOperator,
        setMaxLimit,
        resetProgress,
        setProgressCallback,
        cancelPendingAdvance
    };
}