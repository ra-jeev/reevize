<script setup lang="ts">
import { Question } from "../types";

const props = defineProps({
  questions: {
    type: Array as PropType<Question[]>,
    required: true,
  },
});
</script>

<template></template>
