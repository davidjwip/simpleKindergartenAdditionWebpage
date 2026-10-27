/**
 * useMathGame — Vue composable holding all reactive game state and the
 * timer-driven auto-advance logic. It performs NO direct DOM manipulation;
 * the component only renders the state it exposes here. This lets the
 * entire game logic (including the timer crash-regression behavior) be
 * unit-tested outside a real browser.
 */
import { ref, computed, onScopeDispose, getCurrentScope } from 'vue';
import { generateProblem, evaluateAnswer, STEPS } from './mathEngine';
import { buildPass, makeRng, roundLengthForTotal } from './anchorEngine';

const AUTO_ADVANCE_DELAY = 2000;
const RETRY_HOLD_DELAY = 1500;
const REVEAL_DELAY = 2500;
const DEFAULT_MODE = 'result';
const DEFAULT_STEP = 'any';
const ANCHOR_MODE = 'anchor';
const DEFAULT_ANCHOR_TOTAL = 10;
const ORDINARY_ROUND_LENGTH = 10;
const START_LIMIT_CAP = 10;

function firstTapBucket(elapsedMs) {
    if (elapsedMs < 2000) return '<2s';
    if (elapsedMs <= 5000) return '2-5s';
    return '>5s';
}

// Message pools for variety
const CORRECT_MESSAGES = ['Correct! 🎉', 'Great job! ⭐', 'Awesome! 🌟', 'You did it! 💪', 'Super! 🎈'];
export const ENCOURAGEMENT_MESSAGES = [
    'Not quite 😊 Look again!',
    'So close! You’ve got this!',
    'No worries, take another look!',
    'Almost there! Keep going!'
];
const START_ADD_ADVISORY = 'This one is take-away only. Choose another task to add.';

export function useMathGame() {
    // Problem state
    const num1 = ref('');
    const num2 = ref('');
    const answer = ref('');
    const operator = ref('+');
    const maxLimit = ref(10);
    const mode = ref(DEFAULT_MODE);
    const step = ref(DEFAULT_STEP);
    const anchorTotal = ref(DEFAULT_ANCHOR_TOTAL);

    // Progress state
    const problemsSolved = ref(0);
    const totalProblems = ref(0);
    const anchorRoundProgress = ref(0);

    // UI state
    const feedback = ref('');
    const feedbackColor = ref('#ff6b6b');
    
    // Streak state
    const streak = ref(0);
    const bestStreak = ref(0);
    const lastResult = ref(''); // 'correct' | 'incorrect' (for audio feedback)

    // Wrong-answer state and the per-item outcome log
    const blankField = ref(null); // 'num1' | 'num2' | 'answer'
    const isRevealing = ref(false);
    const putBackDone = ref(false);
    const putBackUsed = ref(false);
    const itemLog = ref([]);
    let phase = 'IDLE'; // IDLE | HOLD | RETRY | REVEAL | CORRECT
    let currentSolution = { num1: 0, num2: 0, answer: 0 };
    let currentAnchorKind = null;
    let currentAnchorTotal = null;
    let anchorPass = [];
    let anchorPassIndex = 0;
    let anchorRng = null;
    let itemStartedAt = 0;
    let firstTapBucketForItem = null;

    // Internal timer / generation guard (mirrors the crash fix in the original)
    let touchpadTimer = null;
    let isGenerating = false;
    let isLocked = ref(false);
    let lastProblem = null;

    // Optional callback fired whenever progress updates
    let progressCallback = null;

    const isAnchor = computed(() => mode.value === ANCHOR_MODE);
    const isStart = computed(() => mode.value === 'start');

    const effectiveMaxLimit = computed(() => (
        isStart.value ? Math.min(maxLimit.value, START_LIMIT_CAP) : maxLimit.value
    ));

    const keypadLength = computed(() => (
        isAnchor.value ? anchorTotal.value : effectiveMaxLimit.value
    ));

    const roundLength = computed(() => (
        isAnchor.value ? roundLengthForTotal(anchorTotal.value) : ORDINARY_ROUND_LENGTH
    ));

    const roundProgress = computed(() => {
        if (isAnchor.value) return anchorRoundProgress.value;
        if (problemsSolved.value <= 0) return 0;
        return ((problemsSolved.value - 1) % ORDINARY_ROUND_LENGTH) + 1;
    });

    const progressPercent = computed(() => {
        if (totalProblems.value > 0) {
            return Math.round((problemsSolved.value / totalProblems.value) * 100);
        }
        return 0;
    });

    const isAdd = computed(() => operator.value === '+');

    const partWhole = computed(() => {
        if (mode.value !== 'part') return null;

        const total = Number(operator.value === '+' ? answer.value : num1.value);
        const known = Number(
            operator.value === '+' && blankField.value === 'num1' ? num2.value
                : operator.value === '+' ? num1.value
                    : answer.value
        );
        const safeTotal = Number.isFinite(total) ? Math.max(0, total) : 0;
        const safeKnown = Number.isFinite(known)
            ? Math.min(Math.max(0, known), safeTotal)
            : 0;

        return {
            total: safeTotal,
            known: safeKnown,
            missing: safeTotal - safeKnown
        };
    });

    const startBar = computed(() => {
        if (!isStart.value) return null;

        const total = Number(currentSolution.num1);
        const known = Number(answer.value);
        const takenAway = Number(num2.value);

        return {
            total: Number.isFinite(total) ? total : 0,
            known: Number.isFinite(known) ? known : 0,
            takenAway: Number.isFinite(takenAway) ? takenAway : 0
        };
    });

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
        const entry = { outcome, firstTry, step: step.value };
        if (isAnchor.value) {
            entry.mode = ANCHOR_MODE;
            entry.kind = currentAnchorKind;
            entry.total = currentAnchorTotal;
            entry.blankField = blankField.value;
            entry.firstTapBucket = firstTapBucketForItem;
        } else if (isStart.value) {
            entry.mode = mode.value;
            entry.operator = operator.value;
            entry.limit = effectiveMaxLimit.value;
            entry.blankField = blankField.value;
            entry.putBackUsed = putBackUsed.value;
        }
        itemLog.value.push(entry);
    };

    const resetAnchorPass = () => {
        anchorPass = [];
        anchorPassIndex = 0;
        anchorRoundProgress.value = 0;
    };

    const startAnchorPass = () => {
        if (!anchorRng) anchorRng = makeRng(Date.now());
        anchorPass = buildPass(anchorTotal.value, anchorRng);
        anchorPassIndex = 0;
    };

    const nextAnchorProblem = () => {
        if (anchorPassIndex >= anchorPass.length) {
            startAnchorPass();
            anchorRoundProgress.value = 0;
            if (lastProblem !== null && anchorPass.length > 1 &&
                anchorPass[0].num1 === lastProblem.num1 &&
                anchorPass[0].num2 === lastProblem.num2 &&
                anchorPass[0].answer === lastProblem.answer) {
                [anchorPass[0], anchorPass[1]] = [anchorPass[1], anchorPass[0]];
            }
        }
        return anchorPass[anchorPassIndex++];
    };

    const completeAnchorItem = () => {
        if (!isAnchor.value) return;
        if (anchorRoundProgress.value < roundLength.value) {
            anchorRoundProgress.value++;
        }
    };

    const enterRetry = () => {
        touchpadTimer = null;
        phase = 'RETRY';
        feedback.value = '';
        lastResult.value = '';
        if (blankField.value === 'num1') {
            num1.value = '';
        } else if (blankField.value === 'num2') {
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
        if (isStart.value) {
            putBackDone.value = true;
        }
        num1.value = String(currentSolution.num1);
        num2.value = String(currentSolution.num2);
        answer.value = String(currentSolution.answer);
        feedbackColor.value = '#4ecdc4';
        if (isStart.value) {
            feedback.value = `We started with ${currentSolution.num1}. Take away ${currentSolution.num2}, ${currentSolution.answer} are left.`;
        } else {
            feedback.value = (isAnchor.value || operator.value === '+')
                ? `${currentSolution.num1} and ${currentSolution.num2} make ${currentSolution.answer}`
                : `${currentSolution.num1} take away ${currentSolution.num2} makes ${currentSolution.answer}`;
        }
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
        putBackDone.value = false;
        putBackUsed.value = false;
        blankField.value = null;
        phase = 'IDLE';

        let problem;
        let currentProblem;

        if (isAnchor.value) {
            problem = nextAnchorProblem();
            currentAnchorKind = problem.kind;
            currentAnchorTotal = problem.answer;
            currentProblem = {
                num1: problem.num1,
                num2: problem.num2,
                answer: problem.answer
            };
        } else {
            let attempts = 0;
            const maxAttempts = 10;

            do {
                problem = generateProblem(operator.value, effectiveMaxLimit.value, mode.value, step.value);

                currentProblem = {
                    num1: problem.num1,
                    num2: problem.num2,
                    answer: problem.answer
                };

                attempts++;
            } while (lastProblem !== null &&
                     currentProblem.num1 === lastProblem.num1 &&
                     currentProblem.num2 === lastProblem.num2 &&
                     currentProblem.answer === lastProblem.answer &&
                     attempts < maxAttempts);

            currentAnchorKind = null;
            currentAnchorTotal = null;
        }

        lastProblem = currentProblem;

        currentSolution = {
            num1: problem.num1,
            num2: problem.num2,
            answer: problem.answer
        };
        blankField.value = problem.blankField;
        itemStartedAt = Date.now();
        firstTapBucketForItem = null;

        if (problem.blankField === 'num1') {
            num1.value = '';
            num2.value = String(problem.num2);
            answer.value = String(problem.answer);
        } else if (problem.blankField === 'num2') {
            num1.value = String(problem.num1);
            num2.value = '';
            answer.value = String(problem.answer);
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

    function putBack() {
        if (!isStart.value || isRevealing.value || isLocked.value) return;
        putBackDone.value = true;
        if (phase === 'IDLE') {
            putBackUsed.value = true;
        }
    }

    function checkAnswer() {
        if (phase !== 'IDLE' && phase !== 'RETRY') return;

        clearTimer();
        const val1 = parseInt(num1.value, 10);
        const val2 = parseInt(num2.value, 10);
        const answerVal = parseInt(answer.value, 10);
        const wasRetry = phase === 'RETRY';
        const activeOperator = isAnchor.value ? '+' : operator.value;

        const isCorrect = evaluateAnswer(val1, val2, answerVal, activeOperator);

        if (isCorrect === null) {
            feedback.value = 'Please fill in all fields!';
            feedbackColor.value = '#ff6b6b';
            return;
        }

        if (isAnchor.value && firstTapBucketForItem === null) {
            firstTapBucketForItem = firstTapBucket(Date.now() - itemStartedAt);
        }

        if (isCorrect) {
            feedbackColor.value = '#4ecdc4';
            // Use rotating correct message
            feedback.value = CORRECT_MESSAGES[problemsSolved.value % CORRECT_MESSAGES.length];
            problemsSolved.value++;
            if (!wasRetry) totalProblems.value++;
            completeAnchorItem();
            
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
        if (op === '+' && isStart.value) {
            if (phase === 'IDLE' || phase === 'RETRY') {
                feedback.value = START_ADD_ADVISORY;
                feedbackColor.value = '#555';
            }
            // Leave the current item and any pending timer untouched; the task picker is the way out.
            return;
        }
        operator.value = op;
        if (!isAnchor.value) generateNewProblem();
    }

    function setMaxLimit(limit) {
        maxLimit.value = limit;
        if (!isAnchor.value) generateNewProblem();
    }

    function setMode(nextMode) {
        if (mode.value !== nextMode) {
            resetAnchorPass();
        }
        if (nextMode === 'start' && operator.value === '+') {
            operator.value = '-';
        }
        mode.value = nextMode;
        generateNewProblem();
    }

    function setStep(nextStep) {
        if (!STEPS.includes(nextStep)) return;
        step.value = nextStep;
        if (!isAnchor.value) generateNewProblem();
    }

    function setAnchorTotal(total) {
        const numeric = Number(total);
        const nextTotal = [5, 10].includes(numeric) ? numeric : DEFAULT_ANCHOR_TOTAL;
        const changed = anchorTotal.value !== nextTotal;
        anchorTotal.value = nextTotal;
        if (isAnchor.value && changed) {
            resetAnchorPass();
            generateNewProblem();
        }
    }

    function resetProgress() {
        problemsSolved.value = 0;
        totalProblems.value = 0;
        streak.value = 0;
        lastResult.value = '';
        resetAnchorPass();
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
        partWhole,
        startBar,
        maxLimit,
        effectiveMaxLimit,
        mode,
        step,
        anchorTotal,
        keypadLength,
        roundLength,
        roundProgress,
        streak,
        bestStreak,
        lastResult,
        isLocked,
        isRevealing,
        isAnchor,
        isStart,
        putBackDone,
        putBackUsed,
        blankField,
        itemLog,
        // actions
        generateNewProblem,
        checkAnswer,
        fillValue,
        putBack,
        setOperator,
        setMaxLimit,
        setMode,
        setStep,
        setAnchorTotal,
        resetProgress,
        setProgressCallback,
        cancelPendingAdvance
    };
}