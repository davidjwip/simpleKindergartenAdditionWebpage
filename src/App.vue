<script setup>
import { ref, computed } from 'vue';
import { useMathGame } from './useMathGame';

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
    generateNewProblem,
    fillValue,
    setOperator,
    setMaxLimit,
    resetProgress,
    setProgressCallback
} = useMathGame();

// Operator glyph shown in the equation (use a proper minus sign)
const opSymbol = computed(() => (operator.value === '+' ? '+' : '−'));

// "How to Use" instructions panel
const showInstructions = ref(false);

// Limit-to-20 checkbox (two-way via computed)
const limit20 = computed({
    get: () => maxLimit.value === 20,
    set: (checked) => setMaxLimit(checked ? 20 : 10)
});

// Celebration overlay — shows once per 10 solved problems
const celebrationShown = ref(false);
const celebrationVisible = ref(false);

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
            <h1>Fun Math for Kids!</h1>
            <p class="instructions">Learn Addition &amp; Subtraction</p>
            <button class="action-btn small" style="margin-top: 10px;" @click="showInstructions = !showInstructions">
                {{ showInstructions ? 'Close' : 'How to Use' }}
            </button>
        </header>

        <main>
            <!-- Instructions Panel -->
            <div
                v-if="showInstructions"
                class="instructions-panel"
                style="background-color: #fff; border-radius: 15px; padding: 15px; margin-bottom: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);"
            >
                <h2>How to Use This Math Game</h2>
                <p><strong>1. Choose an operation:</strong> Click the "+" or "−" button to select addition or subtraction.</p>
                <p><strong>2. Select the number limit:</strong> Check the "Limit to 20" box to use numbers up to 20, or leave it unchecked for numbers up to 10.</p>
                <p><strong>3. Solve the problem:</strong> Fill in the missing number in the equation using the number buttons below.</p>
                <p><strong>4. Check your answer:</strong> The game will automatically check if your answer is correct.</p>
                <p><strong>5. Track your progress:</strong> See your progress in the progress tracker at the bottom.</p>
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
                <div class="touchpad">
                    <button
                        v-for="n in maxLimit"
                        :key="n"
                        class="touchpad-btn"
                        @click="fillValue(n)"
                    >
                        {{ n }}
                    </button>
                </div>
                <div class="limit-toggle">
                    <label>
                        <input type="checkbox" v-model="limit20" />
                        <span>Limit to 20</span>
                    </label>
                </div>
            </div>

            <div class="buttons">
                <button
                    class="operator-btn"
                    :class="{ active: operator === '+' }"
                    @click="setOperator('+')"
                >+</button>
                <button
                    class="operator-btn"
                    :class="{ active: operator === '-' }"
                    @click="setOperator('-')"
                >−</button>
            </div>
        </main>

        <div class="progress-area">
            <h2>Progress Tracker</h2>
            <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
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