<script setup>
import { ref, computed, watch } from 'vue';
import { useMathGame } from './useMathGame';
import { useAudioFeedback } from './useAudioFeedback';
import { usePreferences } from './usePreferences';
import { STEPS } from './mathEngine';
import NumberFrame from './components/NumberFrame.vue';

const {
    num1,
    num2,
    answer,
    operator,
    feedback,
    feedbackColor,
    problemsSolved,
    totalProblems,
    maxLimit,
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
    blankField,
    generateNewProblem,
    fillValue,
    setOperator,
    setMaxLimit: setGameMaxLimit,
    setMode: setGameMode,
    setStep: setGameStep,
    setAnchorTotal: setGameAnchorTotal,
    resetProgress,
    setProgressCallback,
    cancelPendingAdvance
} = useMathGame();

const { isMuted, toggleMuted, playCorrect, playIncorrect, playCelebration } = useAudioFeedback();

// Play sounds when results change (any transition to correct or incorrect)
watch(lastResult, (newVal) => {
    if (newVal === 'correct') {
        playCorrect();
    } else if (newVal === 'incorrect') {
        playIncorrect();
    }
});

// Preferences for personalization
const { playerName, mascot, maxLimit: prefsMaxLimit, mode: prefsMode, step: prefsStep, anchorTotal: prefsAnchorTotal, setPlayerName, setMascot, setMaxLimit: setPrefsMaxLimit, setMode: setPrefsMode, setStep: setPrefsStep, setAnchorTotal: setPrefsAnchorTotal, MASCOTS } = usePreferences();

const MODE_OPTIONS = [
    { id: 'result', label: 'Find the total' },
    { id: 'anchor', label: 'Make 10' }
];

// Sync maxLimit between preferences and game
watch(prefsMaxLimit, (newVal) => {
    setGameMaxLimit(newVal);
});

// Sync the stored task mode into the game. Result-unknown is the default.
watch(prefsMode, (newVal) => {
    setGameMode(newVal);
});

// Sync the stored step into the game. Any step is the default.
watch(prefsStep, (newVal) => {
    setGameStep(newVal);
});

// Sync the anchor family total into the game.
watch(prefsAnchorTotal, (newVal) => {
    setGameAnchorTotal(newVal);
});

// Initialize game maxLimit from stored pref
if (prefsMaxLimit.value !== 10) {
    setGameMaxLimit(prefsMaxLimit.value);
}

if (prefsAnchorTotal.value !== 10) {
    setGameAnchorTotal(prefsAnchorTotal.value);
}

// Settings panel state
const showSettings = ref(false);
const tempName = ref(playerName.value);

// Initialize tempName from stored player name
tempName.value = playerName.value;

// Save name when closing settings
function saveName() {
    setPlayerName(tempName.value.trim());
    showSettings.value = false;
}

// Update mascot
function selectMascot(m) {
    setMascot(m);
    showSettings.value = false;
}

// Operator glyph shown in the equation (use a proper minus sign)
const opSymbol = computed(() => (isAnchor.value || operator.value === '+' ? '+' : '−'));

const trackRows = computed(() => {
    const rows = [];
    for (let start = 1; start <= roundLength.value; start += 5) {
        const row = [];
        const end = Math.min(start + 5, roundLength.value + 1);
        for (let i = start; i < end; i++) {
            row.push(i);
        }
        rows.push(row);
    }
    return rows;
});

const frameFilled = computed(() => {
    if (blankField.value === 'num1') return Number(num2.value) || 0;
    if (blankField.value === 'num2') return Number(num1.value) || 0;
    return (Number(num1.value) || 0) + (Number(num2.value) || 0);
});

// "How to Use" instructions panel
const showInstructions = ref(false);

// Limit popup state
const showLimitPopup = ref(false);
const tempLimit = ref(maxLimit.value);

// Operator toggle in header (instead of big buttons)
const headerOperator = computed({
    get: () => operator.value,
    set: (val) => setOperator(val)
});

// Open limit popup
function openLimitPopup() {
    tempLimit.value = maxLimit.value;
    showLimitPopup.value = true;
}

// Save limit from popup
function saveLimit() {
    const numeric = Number(tempLimit.value);
    const val = Number.isFinite(numeric)
        ? Math.min(Math.max(numeric, 5), 20)
        : 10;
    if (val === maxLimit.value) {
        setGameMaxLimit(val);
    }
    setPrefsMaxLimit(val);
    showLimitPopup.value = false;
}

// Cancel limit change
function cancelLimit() {
    showLimitPopup.value = false;
}

// Celebration overlay — shows once per 10 solved problems
const celebrationShown = ref(false);
const celebrationVisible = ref(false);

// Play celebration fanfare when the reward screen appears
watch(celebrationVisible, (visible) => {
    if (visible) {
        cancelPendingAdvance();
        playCelebration();
    }
});

setProgressCallback(() => {
    if (roundProgress.value >= roundLength.value && !celebrationShown.value) {
        celebrationShown.value = true;
        celebrationVisible.value = true;
    }
});

// Generate the very first problem on load (mirrors the old DOMContentLoaded init)
generateNewProblem();

function closeCelebration() {
    celebrationVisible.value = false;
    // Reset the score after a short delay so the new round starts at 0.
    setTimeout(() => {
        resetProgress();
        celebrationShown.value = false;
        generateNewProblem();
    }, 500);
}
</script>

<template>
    <div class="container">
        <header>
            <h1>
                <span v-if="playerName">{{ playerName }}, </span>
                Fun Math for Kids!
            </h1>
            <p class="instructions">Learn Addition &amp; Subtraction</p>
            <div class="header-actions">
                <button class="action-btn small" @click="showInstructions = !showInstructions">
                    {{ showInstructions ? 'Close' : 'How to Use' }}
                </button>
                <!-- Operator toggle in header -->
                <div class="operator-toggle">
                    <button
                        class="action-btn small"
                        :class="{ 'operator-active': operator === '+' }"
                        @click="setOperator('+')"
                    >+</button>
                    <button
                        class="action-btn small"
                        :class="{ 'operator-active': operator === '-' }"
                        @click="setOperator('-')"
                    >−</button>
                </div>
                <!-- Limit button -->
                <button class="action-btn small" @click="openLimitPopup">
                    🔢 Limit: {{ maxLimit }}
                </button>
                <button class="action-btn small mute-btn" @click="toggleMuted" :title="isMuted ? 'Unmute sounds' : 'Mute sounds'">
                    {{ isMuted ? '🔇' : '🔊' }}
                </button>
                <button class="action-btn small" @click="showSettings = !showSettings" :title="playerName ? 'Edit profile' : 'Set your name'">
                    👤
                </button>
            </div>
        </header>

        <!-- Settings Panel -->
        <div v-if="showSettings" class="settings-panel">
            <h3>Your Profile</h3>
            <div class="settings-content">
                <div class="name-input">
                    <label for="playerName">Your Name:</label>
                    <input
                        id="playerName"
                        type="text"
                        v-model="tempName"
                        placeholder="Type your name..."
                        maxlength="20"
                    />
                    <button class="action-btn small" @click="saveName">Save</button>
                </div>
                <div class="mode-picker">
                    <label>Task:</label>
                    <div class="mode-options">
                        <button
                            v-for="option in MODE_OPTIONS"
                            :key="option.id"
                            class="mode-btn"
                            :class="{ selected: prefsMode === option.id }"
                            @click="setPrefsMode(option.id)"
                        >
                            {{ option.label }}
                        </button>
                    </div>
                </div>
                <div class="mascot-picker">
                    <label>Pick Your Mascot:</label>
                    <div class="mascot-options">
                        <button
                            v-for="m in MASCOTS"
                            :key="m"
                            class="mascot-btn"
                            :class="{ selected: mascot === m }"
                            @click="selectMascot(m)"
                        >
                            {{ m }}
                        </button>
                    </div>
                </div>
                <div class="step-picker">
                    <label>Step Size:</label>
                    <div class="step-options">
                        <button
                            v-for="s in STEPS"
                            :key="s"
                            class="step-btn"
                            :class="{ selected: prefsStep === s }"
                            @click="setPrefsStep(s)"
                        >
                            {{ s === 'any' ? 'Any' : s }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Limit Popup -->
        <div class="limit-popup" v-if="showLimitPopup">
            <div class="limit-popup-content">
                <h3>Set Number Limit</h3>
                <p>Choose a number between 5 and 20</p>
                <div class="limit-input-group">
                    <input
                        type="number"
                        v-model="tempLimit"
                        min="5"
                        max="20"
                    />
                </div>
                <div class="limit-presets">
                    <button class="limit-preset-btn" @click="tempLimit = 5">5</button>
                    <button class="limit-preset-btn" @click="tempLimit = 10">10</button>
                    <button class="limit-preset-btn" @click="tempLimit = 15">15</button>
                    <button class="limit-preset-btn" @click="tempLimit = 20">20</button>
                </div>
                <div class="limit-actions">
                    <button class="action-btn small" @click="cancelLimit">Cancel</button>
                    <button class="action-btn small" style="background-color: #4ecdc4;" @click="saveLimit">Save</button>
                </div>
            </div>
        </div>

        <main>
            <!-- Instructions Panel -->
            <div
                v-if="showInstructions"
                class="instructions-panel"
                style="background-color: #fff; border-radius: 15px; padding: 15px; margin-bottom: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);"
            >
                <h2>How to Use This Math Game</h2>
                <p><strong>1. Choose an operation:</strong> Use the + or − buttons in the header to select addition or subtraction.</p>
                <p><strong>2. Set the number limit:</strong> Click the 🔢 Limit button to open a popup and set your number range (5 to 20). The keypad will adjust to fit.</p>
                <p><strong>3. Solve the problem:</strong> Fill in the missing number in the equation using the number buttons below.</p>
                <p><strong>4. Check your answer:</strong> The game will automatically check if your answer is correct.</p>
                <p><strong>5. Track your progress:</strong> See your progress in the progress tracker at the bottom.</p>
                <p><strong>6. Build your streak:</strong> Get problems right to build a streak! You can also see your best streak.</p>
            </div>

            <div class="problem-area">
                <div class="problem">
                    <input type="text" :value="num1" :class="{ 'reveal-highlight': isRevealing && blankField === 'num1' }" readonly placeholder="?" />
                    <span class="operator">{{ opSymbol }}</span>
                    <input type="text" :value="num2" :class="{ 'reveal-highlight': isRevealing && blankField === 'num2' }" readonly placeholder="?" />
                    <span class="equal-sign">=</span>
                    <input type="text" :value="answer" :class="{ 'reveal-highlight': isRevealing && blankField === 'answer' }" readonly placeholder="?" />
                </div>

                <NumberFrame
                    v-if="isAnchor"
                    :total="anchorTotal"
                    :filled="frameFilled"
                    :revealed="isRevealing"
                />

                <div class="feedback-area">
                    <div id="feedback" :style="{ color: feedbackColor }">{{ feedback }}</div>
                </div>
            </div>

            <div class="touchpad-container">
                <div class="touchpad" :style="{ gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(keypadLength))}, 1fr)` }">
                    <button
                        v-for="n in keypadLength"
                        :key="n"
                        class="touchpad-btn"
                        :disabled="isLocked"
                        @click="fillValue(n)"
                    >
                        {{ n }}
                    </button>
                </div>
            </div>

        </main>

        <!-- Streak display (below touchpad, above progress-area, with reserved space to prevent shifting) -->
        <div class="streak-area" :style="{ visibility: streak > 0 ? 'visible' : 'hidden', opacity: streak > 0 ? 1 : 0, minHeight: '40px' }">
            <span class="streak-fire">🔥</span>
            <span class="streak-count">{{ streak }} in a row!</span>
            <span class="streak-best" v-if="bestStreak > 1">
                Best: {{ bestStreak }}
            </span>
        </div>

        <div class="progress-area">
            <h2>Path to the Party! 🎉</h2>
            <div class="goal-track">
                <div class="mascot" v-if="streak > 0">
                    {{ mascot }}
                </div>
                <div class="goal-steps-wrapper">
                    <div class="goal-steps" v-for="(row, rowIndex) in trackRows" :key="rowIndex">
                        <div class="step" v-for="i in row" :key="i" :class="{ filled: i <= roundProgress }">
                            {{ i }}
                        </div>
                    </div>
                </div>
                <div class="goal-end">
                    🎉
                </div>
            </div>
            <p class="session-counts">
                <span class="solved-count">Solved: {{ problemsSolved }}</span>
                <span class="tried-count">Tried: {{ totalProblems }}</span>
            </p>
            <p v-if="isAnchor" class="anchor-summary">
                first-try here means the frame was read, not that the bond is recalled — recall shows up as fast answers.
            </p>
        </div>

        <footer>
            <p>© 2026 David Ip. Created for George and Teddy Ip.</p>
        </footer>
    </div>

    <!-- Celebration Overlay -->
    <div class="celebration-overlay" :class="{ visible: celebrationVisible }">
        <div class="celebration-content">
            <div class="celebration-title">🎉 Amazing Job! 🎉</div>
            <p style="font-size: 1.5rem; margin: 10px 0;">You solved {{ roundProgress }} problems correctly!</p>
            <div style="font-size: 4rem; margin: 20px;">🎊🎈🚀</div>
            <button class="celebration-close-btn" @click="closeCelebration">Keep Playing!</button>
        </div>
    </div>
</template>