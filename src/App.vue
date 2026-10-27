<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useMathGame } from './useMathGame';
import { useAudioFeedback } from './useAudioFeedback';
import { usePreferences } from './usePreferences';
import { STEPS } from './mathEngine';
import NumberFrame from './components/NumberFrame.vue';
import DotRow from './components/DotRow.vue';

const {
    num1,
    num2,
    answer,
    operator,
    feedback,
    feedbackColor,
    problemsSolved,
    totalProblems,
    mode,
    step,
    anchorTotal,
    frameKind,
    frameTotal,
    keypadLength,
    roundLength,
    roundProgress,
    streak,
    bestStreak,
    bestStreakToday,
    dailySolved,
    dailyModeCounts,
    lastResult,
    isLocked,
    isRevealing,
    isAnchor,
    partWhole,
    startBar,
    maxLimit,
    effectiveMaxLimit,
    putBackDone,
    putBackUsed,
    blankField,
    generateNewProblem,
    fillValue,
    putBack,
    setOperator,
    setMaxLimit: setGameMaxLimit,
    setStep: setGameStep,
    setModeOption: setGameModeOption,
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
const { playerName, mascot, maxLimit: prefsMaxLimit, mode: prefsMode, step: prefsStep, anchorTotal: prefsAnchorTotal, anchorKind: prefsAnchorKind, countersOn, setPlayerName, setMascot, setMaxLimit: setPrefsMaxLimit, setStep: setPrefsStep, setTaskOption: setPrefsTaskOption, setCountersOn, MASCOTS } = usePreferences();

const MODE_OPTIONS = [
    { key: 'result', id: 'result', label: 'Find the total', hint: '' },
    { key: 'part', id: 'part', label: 'Find the missing part', hint: 'start with step 1–2' },
    { key: 'start', id: 'start', label: 'Find what we started with', hint: 'keep step at 1' },
    { key: 'make-ten', id: 'anchor', label: 'Make 10', hint: '', anchorTotal: 10, anchorKind: 'bond' },
    { key: 'make-five', id: 'anchor', label: 'Make 5', hint: '', anchorTotal: 5, anchorKind: 'bond' },
    { key: 'doubles', id: 'anchor', label: 'Doubles', hint: '', anchorTotal: 10, anchorKind: 'doubles' }
];

function isModeSelected(option) {
    if (prefsMode.value !== option.id) return false;
    if (option.id !== 'anchor') return true;
    const kind = option.anchorKind || 'bond';
    if (kind !== prefsAnchorKind.value) return false;
    return kind === 'doubles' || option.anchorTotal === prefsAnchorTotal.value;
}

function selectModeOption(option) {
    if (option.id === 'anchor' && operator.value === '-') return;
    const next = { mode: option.id };
    if (option.id === 'anchor') {
        next.anchorTotal = option.anchorTotal;
        next.anchorKind = option.anchorKind || 'bond';
    }
    setPrefsTaskOption(next);
}

// Sync maxLimit between preferences and game
watch(prefsMaxLimit, (newVal) => {
    setGameMaxLimit(newVal);
});

watch([prefsMode, prefsAnchorTotal, prefsAnchorKind], ([nextMode, nextTotal, nextKind]) => {
    setGameModeOption({ mode: nextMode, anchorTotal: nextTotal, anchorKind: nextKind });
});

// Sync the stored step into the game. Any step is the default.
watch(prefsStep, (newVal) => {
    setGameStep(newVal);
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
function closeOptionsPanel() {
    showSettings.value = false;
    // A half-typed name is a draft, not a preference: closing the panel discards it.
    tempName.value = playerName.value;
}

function toggleOptions() {
    if (showSettings.value) {
        closeOptionsPanel();
        return;
    }
    tempName.value = playerName.value;
    showSettings.value = true;
}

function saveName() {
    setPlayerName(tempName.value.trim());
    showSettings.value = false;
}

// Update mascot
function selectMascot(m) {
    setMascot(m);
}

// Operator glyph shown in the equation (use a proper minus sign)
const opSymbol = computed(() => (isAnchor.value || operator.value === '+' ? '+' : '−'));

const DAILY_MODE_LABELS = {
    result: 'Total',
    part: 'Missing part',
    start: 'Started with',
    anchor: 'Make 10'
};

const dailyModeSummary = computed(() => (
    Object.entries(DAILY_MODE_LABELS).map(([id, label]) => ({
        id,
        label,
        count: dailyModeCounts.value[id] || 0
    }))
));

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

// Countable rows sit under each visible numeral in the result and part tasks.
// Start mode already carries its bar, and make-ten carries its frame.
const numeralCounters = computed(() => {
    if (!countersOn.value) return [];
    if (mode.value !== 'result' && mode.value !== 'part') return [];

    return [
        { field: 'num1', value: Number(num1.value) },
        { field: 'num2', value: Number(num2.value) },
        { field: 'answer', value: Number(answer.value) }
    ].filter((counter) => Number.isFinite(counter.value) && counter.value > 0);
});

// "How to Use" instructions panel
const showInstructions = ref(false);

// Limit popup state
const showLimitPopup = ref(false);

// Both panels are adult controls, and a panel that can only be dismissed by its own button is a dead
// end on a tablet. An outside click or Escape closes them.
const optionsPanel = ref(null);
const optionsButton = ref(null);
const limitPopup = ref(null);
const limitButton = ref(null);

function onDocumentPointerDown(event) {
    const target = event.target;
    if (showSettings.value && optionsPanel.value && !optionsPanel.value.contains(target) &&
        !(optionsButton.value && optionsButton.value.contains(target))) {
        closeOptionsPanel();
    }
    if (showLimitPopup.value && limitPopup.value && !limitPopup.value.contains(target) &&
        !(limitButton.value && limitButton.value.contains(target))) {
        closeLimitPopup();
    }
}

function onDocumentKeydown(event) {
    if (event.key !== 'Escape') return;
    if (showSettings.value) closeOptionsPanel();
    if (showLimitPopup.value) closeLimitPopup();
}

onMounted(() => {
    document.addEventListener('pointerdown', onDocumentPointerDown);
    document.addEventListener('keydown', onDocumentKeydown);
});

onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', onDocumentPointerDown);
    document.removeEventListener('keydown', onDocumentKeydown);
});
const tempLimit = ref(effectiveMaxLimit.value);
const limitTouched = ref(false);

// Operator toggle in header (instead of big buttons)
const headerOperator = computed({
    get: () => operator.value,
    set: (val) => setOperator(val)
});

// Open limit popup
function openLimitPopup() {
    // Same gesture as Options: pressing the button again puts the frame away.
    if (showLimitPopup.value) {
        closeLimitPopup();
        return;
    }
    tempLimit.value = effectiveMaxLimit.value;
    limitTouched.value = false;
    showLimitPopup.value = true;
}

function closeLimitPopup() {
    // The draft belongs to the open: openLimitPopup reseeds tempLimit and limitTouched every time,
    // so this only has to put the frame away.
    showLimitPopup.value = false;
}

function touchLimit() {
    limitTouched.value = true;
}

function setLimitPreset(preset) {
    limitTouched.value = true;
    tempLimit.value = preset;
}

// Save limit from popup
function saveLimit() {
    const numeric = Number(tempLimit.value);
    const val = Number.isFinite(numeric)
        ? Math.min(Math.max(numeric, 5), 20)
        : 10;
    const nextLimit = limitTouched.value ? val : maxLimit.value;
    if (nextLimit === maxLimit.value) {
        setGameMaxLimit(nextLimit);
    }
    setPrefsMaxLimit(nextLimit);
    showLimitPopup.value = false;
}

// Cancel limit change
function cancelLimit() {
    closeLimitPopup();
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
            <p class="instructions">Addition, subtraction and number bonds</p>
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
                <button ref="limitButton" class="action-btn small" @click="openLimitPopup">
                    🔢 Limit: {{ effectiveMaxLimit }}
                </button>
                <button class="action-btn small mute-btn" @click="toggleMuted" :title="isMuted ? 'Unmute sounds' : 'Mute sounds'">
                    {{ isMuted ? '🔇' : '🔊' }}
                </button>
                <button
                    ref="optionsButton"
                    class="action-btn small options-btn"
                    :class="{ 'options-open': showSettings }"
                    :aria-expanded="showSettings"
                    aria-haspopup="dialog"
                    @click="toggleOptions"
                >Options</button>
            </div>
        </header>

        <!-- Settings Panel -->
        <div v-if="showSettings" ref="optionsPanel" class="settings-panel" role="dialog" aria-label="Options">
            <h3>Options</h3>
            <p class="options-intro">Choose what to practise. The panel closes when you click outside it.</p>
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
                        <div
                            v-for="option in MODE_OPTIONS"
                            :key="option.key"
                            class="mode-option"
                        >
                            <button
                                class="mode-btn"
                                :class="{ selected: isModeSelected(option) }"
                                :disabled="option.id === 'anchor' && operator === '-'"
                                @click="selectModeOption(option)"
                            >
                                {{ option.label }}
                            </button>
                            <span v-if="option.hint" class="mode-hint">{{ option.hint }}</span>
                        </div>
                    </div>
                    <p v-if="operator === '-'" class="anchor-advisory">
                        making 5 and 10 is adding
                    </p>
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
                <div class="counters-toggle">
                    <label>
                        <input
                            type="checkbox"
                            :checked="countersOn"
                            @change="setCountersOn($event.target.checked)"
                        />
                        Show counters
                    </label>
                </div>
            </div>
        </div>

        <!-- Limit Popup -->
        <div class="limit-popup" v-if="showLimitPopup" ref="limitPopup" role="dialog" aria-label="Number limit">
            <div class="limit-popup-content">
                <h3>Set Number Limit</h3>
                <p v-if="mode === 'start'">This game plays with numbers up to 10. A higher limit stays saved for your other tasks.</p>
                <p v-else>Choose a number between 5 and 20</p>
                <div class="limit-input-group">
                    <input
                        type="number"
                        v-model="tempLimit"
                        min="5"
                        :max="mode === 'start' ? 10 : 20"
                        @input="touchLimit"
                    />
                </div>
                <div class="limit-presets">
                    <button
                        v-for="preset in [5, 10, 15, 20]"
                        :key="preset"
                        class="limit-preset-btn"
                        :disabled="mode === 'start' && preset > 10"
                        @click="setLimitPreset(preset)"
                    >
                        {{ preset }}
                    </button>
                </div>
                <p v-if="mode === 'start'" class="limit-cap-note">
                    This game stops at 10, so the dots stay countable.
                </p>
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
                <h2>How to use this maths game</h2>
                <p><strong>One problem at a time.</strong> Fill the empty box by tapping a number, and the game tells you straight away whether it is right. <strong>+</strong> and <strong>−</strong> switch between adding and taking away.</p>
                <p><strong>Options</strong> is where the practice is set. Press it, choose, then close it and play:</p>
                <ul>
                    <li><strong>Task</strong> — which part of the sum is missing, or which facts to drill:
                        <em>Find the total</em> (3 + 4 = ?), <em>Find the missing part</em> (3 + ? = 7),
                        <em>Find what we started with</em> (? − 3 = 4), <em>Make 10</em> (7 + ? = 10),
                        <em>Make 5</em> and <em>Doubles</em> (4 + 4 = ?).
                        The last three are adding games, so they only appear with +.</li>
                    <li><strong>Step size</strong> — how big the number you add or take away is.
                        <em>1</em> means always +1 or −1; <em>2</em> means +2 or −2; <em>3-5</em> mixes 3, 4 and 5;
                        <em>Any</em> mixes everything up to the limit. A small step can still be counted on
                        fingers; a big step has to come from the facts.</li>
                    <li><strong>Show counters</strong> — draws dots under the numbers so a problem can be counted
                        instead of remembered. It makes each one easier and slower: leave it on while the child
                        is counting, turn it off once answers come without counting.</li>
                    <li><strong>Limit</strong> — the biggest number in play, 5 to 20. “Find what we started with”
                        stops at 10 so the dots stay countable.</li>
                    <li><strong>Name and mascot</strong> — kept on this device only, never sent anywhere.</li>
                </ul>
                <p><strong>A wrong answer gets one more try.</strong> After a second miss the correct sum is shown so the child can see how it works, then the next problem comes.</p>
                <p><strong>Progress.</strong> Ten correct answers — or one pass through the facts — fills the track and brings the celebration. Misses never end the game; there is nothing here to fail.</p>
            </div>

            <div class="problem-area">
                <div class="problem">
                    <input type="text" :value="num1" :class="{ 'reveal-highlight': isRevealing && blankField === 'num1' }" readonly placeholder="?" />
                    <span class="operator">{{ opSymbol }}</span>
                    <input type="text" :value="num2" :class="{ 'reveal-highlight': isRevealing && blankField === 'num2' }" readonly placeholder="?" />
                    <span class="equal-sign">=</span>
                    <input type="text" :value="answer" :class="{ 'reveal-highlight': isRevealing && blankField === 'answer' }" readonly placeholder="?" />
                </div>

                <div v-if="numeralCounters.length" class="numeral-counters">
                    <DotRow
                        v-for="counter in numeralCounters"
                        :key="counter.field"
                        class="numeral-counter"
                        :data-counter-for="counter.field"
                        :total="counter.value"
                        :known="counter.value"
                    />
                </div>

                <NumberFrame
                    v-if="isAnchor"
                    :total="frameTotal"
                    :filled="frameFilled"
                    :kind="frameKind"
                    :revealed="isRevealing"
                />

                <DotRow
                    v-if="mode === 'part' && partWhole"
                    :total="partWhole.total"
                    :known="partWhole.known"
                    :revealed="isRevealing"
                />

                <DotRow
                    v-if="mode === 'start' && startBar"
                    :total="startBar.total"
                    :known="startBar.known"
                    :taken-away="startBar.takenAway"
                    :put-back="putBackDone"
                    :revealed="isRevealing"
                    @put-back="putBack"
                />

                <div class="feedback-area">
                    <div id="feedback" aria-live="polite" :style="{ color: feedbackColor }">{{ feedback }}</div>
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

        <!-- Best-today display: never collapses after a mistake. -->
        <div class="streak-area" :style="{ visibility: bestStreakToday > 0 ? 'visible' : 'hidden', opacity: bestStreakToday > 0 ? 1 : 0, minHeight: '40px' }">
            <span class="streak-fire">🔥</span>
            <span class="streak-count">Best today: {{ bestStreakToday }} in a row!</span>
            <span class="streak-best" v-if="bestStreak > bestStreakToday">
                Best ever: {{ bestStreak }}
            </span>
        </div>

        <div class="progress-area">
            <h2>Path to the Party! 🎉</h2>
            <div class="goal-track">
                <div class="mascot">
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
            <div class="daily-summary">
                <p class="daily-summary-title">Today at a glance</p>
                <p class="daily-solved">Solved today: {{ dailySolved }}</p>
                <div class="daily-modes">
                    <span
                        v-for="entry in dailyModeSummary"
                        :key="entry.id"
                        class="daily-mode mode-count"
                        :class="`mode-count-${entry.id}`"
                    >
                        {{ entry.label }}: {{ entry.count }}
                    </span>
                </div>
                <p class="best-ever">Best ever: {{ bestStreak }}</p>
            </div>
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