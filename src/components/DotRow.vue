<script setup>
import { computed } from 'vue';

const props = defineProps({
    total: {
        type: Number,
        default: 0
    },
    known: {
        type: Number,
        default: 0
    },
    takenAway: {
        type: Number,
        default: 0
    },
    putBack: {
        type: Boolean,
        default: false
    },
    revealed: {
        type: Boolean,
        default: false
    }
});

defineEmits(['put-back']);

const putBackDone = computed(() => props.putBack || props.revealed);

const filledCount = computed(() => {
    if (props.takenAway > 0) {
        return putBackDone.value ? props.total : props.known;
    }
    return props.revealed ? props.total : props.known;
});

const gapCount = computed(() => {
    if (props.takenAway > 0) {
        return putBackDone.value
            ? 0
            : Math.max(0, props.total - props.known - props.takenAway);
    }
    return Math.max(0, props.total - filledCount.value);
});
</script>

<template>
    <div
        class="dot-row"
        :data-total="total"
        :data-known="known"
        :data-taken-away="takenAway"
        :data-put-back="putBackDone"
    >
        <span
            v-for="cell in filledCount"
            :key="`filled-${cell}`"
            class="dot filled"
        ></span>
        <button
            v-if="takenAway > 0 && !putBackDone"
            type="button"
            class="taken-away"
            aria-label="Put the taken-away dots back"
            @click="$emit('put-back')"
        >
            <span
                v-for="cell in takenAway"
                :key="`taken-${cell}`"
                class="dot gap taken"
            ></span>
        </button>
        <span
            v-for="cell in gapCount"
            :key="`gap-${cell}`"
            class="dot gap"
        ></span>
    </div>
</template>
