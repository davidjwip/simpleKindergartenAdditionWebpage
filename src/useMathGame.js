/**
 * useMathGame — Vue composable holding all reactive game state and the
 * timer-driven auto-advance logic. It performs NO direct DOM manipulation;
 * the component only renders the state it exposes here. This lets the
 * entire game logic (including the timer crash-regression behavior) be
 * unit-tested outside a real browser.
 */
import { ref, computed } from 'vue';
import {
    generateAddition,
    generateSubtraction,
    pickRandomField,
    evaluateAnswer
} from './mathEngine';

const AUTO_ADVANCE_DELAY = 2000;
const INCORRECT_RETRY_DELAY = 1500;

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

    // Message pools for variety
    const CORRECT_MESSAGES = ['Correct! 🎉', 'Great job! ⭐', 'Awesome! 🌟', 'You did it! 💪', 'Super! 🎈'];
    const ENCOURAGEMENT_MESSAGES = ['Incorrect 😊 Try again!', 'So close! You’ve got this!', 'No worries, have another go!', 'Almost there! Keep going!'];

    // Internal timer / generation guard (mirrors the crash fix in the original)
    let touchpadTimer = null;
    let isGenerating = false;

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

    const updateProgress = () => {
        if (progressCallback) {
            progressCallback(problemsSolved.value, totalProblems.value);
        }
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

        const problem =
            operator.value === '+' ? generateAddition(maxLimit.value) : generateSubtraction(maxLimit.value);

        const emptyField = pickRandomField();
        const answerText = String(
            operator.value === '+'
                ? problem.num1 + problem.num2
                : problem.num1 - problem.num2
        );

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
        clearTimer();
        const val1 = parseInt(num1.value, 10);
        const val2 = parseInt(num2.value, 10);
        const answerVal = parseInt(answer.value, 10);

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
            totalProblems.value++;
            
            // Update streak
            streak.value++;
            if (streak.value > bestStreak.value) {
                bestStreak.value = streak.value;
            }
            lastResult.value = 'correct';
            
            updateProgress();
            startTimer();
        } else {
            feedbackColor.value = '#ff6b6b';
            // Use rotating encouragement message
            feedback.value = ENCOURAGEMENT_MESSAGES[totalProblems.value % ENCOURAGEMENT_MESSAGES.length];
            totalProblems.value++;
            
            // Reset streak on incorrect
            streak.value = 0;
            lastResult.value = 'incorrect';
            
            updateProgress();
            clearTimer();
            touchpadTimer = setTimeout(() => {
                generateNewProblem();
            }, INCORRECT_RETRY_DELAY);
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
        // actions
        generateNewProblem,
        checkAnswer,
        fillValue,
        setOperator,
        setMaxLimit,
        resetProgress,
        setProgressCallback
    };
}