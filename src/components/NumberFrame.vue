<script setup>
import { computed } from 'vue';

const props = defineProps({
    total: {
        type: Number,
        default: 10
    },
    filled: {
        type: Number,
        default: 0
    },
    kind: {
        type: String,
        default: 'bond'
    },
    revealed: {
        type: Boolean,
        default: false
    }
});

const rows = computed(() => {
    const frameRows = [];
    for (let start = 1; start <= props.total; start += 5) {
        const row = [];
        const end = Math.min(start + 5, props.total + 1);
        for (let cell = start; cell < end; cell++) {
            row.push(cell);
        }
        frameRows.push(row);
    }
    return frameRows;
});

const filledCount = computed(() => {
    const shown = props.revealed ? props.total : props.filled;
    return Math.max(0, Math.min(shown, props.total));
});
</script>

<template>
    <div
        class="number-frame"
        :class="[`frame-${kind}`, { 'frame-five': total <= 5 }]"
        :data-total="total"
    >
        <div v-for="(row, index) in rows" :key="index" class="frame-row">
            <span
                v-for="cell in row"
                :key="cell"
                class="frame-cell"
                :class="{ filled: cell <= filledCount, empty: cell > filledCount }"
            ></span>
        </div>
    </div>
</template>
