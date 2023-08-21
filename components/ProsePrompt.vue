<script setup lang="ts">
import type { FormError } from "@nuxthq/ui/dist/runtime/types";

const emit = defineEmits(["docCreate"]);
defineProps({
  item: { type: Object, required: true },
});

const state = ref({
  prose: undefined,
});

const validate = (state: any): FormError[] => {
  const errors = [];
  if (!state.prose) {
    errors.push({ path: "prose", message: "Please enter the starting prose" });
  }

  return errors;
};

const form = ref();

async function submit() {
  emit("docCreate", state.value.prose);
}
</script>

<template>
  <UForm
    ref="form"
    :validate="validate"
    :state="state"
    @submit.prevent="submit"
  >
    <UCard>
      <template #header>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ item.description }}
        </p>
      </template>

      <UFormGroup label="Prose input" name="prose" required>
        <UTextarea
          v-model="state.prose"
          placeholder="Enter the input prose"
          :rows="5"
          required
        />
      </UFormGroup>

      <template #footer>
        <UButton icon="i-heroicons-beaker" type="submit">
          Generate questions
        </UButton>
      </template>
    </UCard>
  </UForm>
</template>
