<script setup>
import { ref, computed, watch } from 'vue';
import { useMathGame } from './useMathGame';
import { useAudioFeedback } from './useAudioFeedback';
import { usePreferences } from './usePreferences';

const {
    num1,
    num2,
    answer,
    operator,
    feedback,
    feedbackColor,
    problemsSolved,
    totalProblems,
    progressPercent,
    maxLimit,
    streak,
    bestStreak,
    lastResult,
    generateNewProblem,
    fillValue,
    setOperator,
    setMaxLimit: setGameMaxLimit,
    resetProgress,
    setProgressCallback
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
const { playerName, mascot, maxLimit: prefsMaxLimit, setPlayerName, setMascot, setMaxLimit: setPrefsMaxLimit, MASCOTS, getRandomName } = usePreferences();

// Sync maxLimit between preferences and game
watch(prefsMaxLimit, (newVal) => {
    setGameMaxLimit(newVal);
});

// Initialize game maxLimit from stored pref
if (prefsMaxLimit.value !== 10) {
    setGameMaxLimit(prefsMaxLimit.value);
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
const opSymbol = computed(() => (operator.value === '+' ? '+' : '−'));

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
    const val = Math.min(Math.max(Number(tempLimit.value), 5), 20);
    setGameMaxLimit(val);
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
        playCelebration();
    }
});

setProgressCallback((solved) => {
    if (solved >= 10 && !celebrationShown.value) {
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
                <button class="action-btn small" style="margin-top: 10px;" @click="showInstructions = !showInstructions">
                    {{ showInstructions ? 'Close' : 'How to Use' }}
                </button>
                <!-- Operator toggle in header -->
                <div class="operator-toggle" style="display: inline-flex; gap: 8px; margin-left: 10px; margin-top: 10px;">
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
                <button class="action-btn small" style="margin-left: 10px;" @click="openLimitPopup">
                    🔢 Limit: {{ maxLimit }}
                </button>
                <button class="action-btn small mute-btn" style="margin-left: 10px;" @click="toggleMuted" :title="isMuted ? 'Unmute sounds' : 'Mute sounds'">
                    {{ isMuted ? '🔇' : '🔊' }}
                </button>
                <button class="action-btn small" style="margin-left: 10px;" @click="showSettings = !showSettings" :title="playerName ? 'Edit profile' : 'Set your name'">
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
                    <input type="text" :value="num1" readonly placeholder="?" />
                    <span class="operator">{{ opSymbol }}</span>
                    <input type="text" :value="num2" readonly placeholder="?" />
                    <span class="equal-sign">=</span>
                    <input type="text" :value="answer" readonly placeholder="?" />
                </div>

                <div class="feedback-area">
                    <div id="feedback" :style="{ color: feedbackColor }">{{ feedback }}</div>
                </div>
            </div>

            <div class="touchpad-container">
                <div class="touchpad" :style="{ gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(maxLimit))}, 1fr)` }">
                    <button
                        v-for="n in maxLimit"
                        :key="n"
                        class="touchpad-btn"
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
                <div class="goal-steps">
                    <div class="step" v-for="i in 10" :key="i" :class="{ filled: i <= problemsSolved % 10 }">
                        {{ i }}
                    </div>
                </div>
                <div class="mascot" v-if="streak > 0">
                    {{ mascot }}
                </div>
                <div class="goal-end">
                    🎉
                </div>
            </div>
            <p>
                Problems Solved: <span>{{ problemsSolved }}</span> /
                Total Problems: <span>{{ totalProblems }}</span>
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
            <p style="font-size: 1.5rem; margin: 10px 0;">You solved 10 problems correctly!</p>
            <div style="font-size: 4rem; margin: 20px;">🎊🎈🚀</div>
            <button class="celebration-close-btn" @click="closeCelebration">Keep Playing!</button>
        </div>
    </div>
</template>