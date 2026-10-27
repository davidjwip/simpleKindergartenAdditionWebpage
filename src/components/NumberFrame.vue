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

function cellClasses(cell) {
    const isFilled = cell <= filledCount.value;
    const classes = {
        filled: isFilled,
        empty: !isFilled
    };
    // Group colours mark the two addends, so they only ever apply to a filled cell: an empty cell
    // must stay outlined, and .group-a/.group-b are declared after .empty in style.css.
    if (props.kind === 'doubles' && isFilled) {
        classes[cell <= props.total / 2 ? 'group-a' : 'group-b'] = true;
    }
    return classes;
}
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
                :class="cellClasses(cell)"
            ></span>
        </div>
    </div>
</template>
