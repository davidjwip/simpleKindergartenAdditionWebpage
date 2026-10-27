<script setup>
defineProps({
    total: {
        type: Number,
        default: 0
    },
    known: {
        type: Number,
        default: 0
    },
    revealed: {
        type: Boolean,
        default: false
    }
});
</script>

<template>
    <div class="dot-row" :data-total="total" :data-known="known">
        <span
            v-for="cell in total"
            :key="cell"
            class="dot"
            :class="cell <= (revealed ? total : known) ? 'filled' : 'gap'"
        ></span>
    </div>
</template>
