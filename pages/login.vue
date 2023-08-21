<script setup lang="ts">
import { signInWithEmailAndPassword } from "firebase/auth";

definePageMeta({
  layout: "auth",
});

const auth = useFirebaseAuth()!;

const showPassword = ref(false);
const form = ref({ email: "", password: "" });
const errors = ref({ email: "", password: "", form: "" });
const loading = ref(false);

const onSubmit = async () => {
  const email = form.value.email;
  const password = form.value.password;

  errors.value = { email: "", password: "", form: "" };

  let hasError = false;

  if (!email) {
    errors.value.email = "Please enter a valid email address";
    hasError = true;
  }

  if (!password || password.length < 8) {
    errors.value.password = "Password should at least be 8 characters";
    hasError = true;
  }

  if (hasError) {
    return;
  }

  loading.value = true;
  try {
    const user = await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    errors.value.form = "Failed to sign in. Pleases try again later.";
  }

  loading.value = false;
};
</script>

<template>
  <UCard class="max-w-md w-full mt-10">
    <h2 class="text-2xl font-medium text-center">Sign in to your account</h2>

    <form class="my-8" @submit.prevent="onSubmit">
      <UFormGroup
        name="email"
        label="Your email"
        :error="errors.email"
        required
      >
        <UInput
          v-model="form.email"
          placeholder="you@example.com"
          icon="i-heroicons-envelope"
          type="email"
        />
      </UFormGroup>

      <UFormGroup
        name="password"
        label="Your password"
        :error="errors.password"
        class="mt-6"
        required
      >
        <UInput
          v-model.trim="form.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="password"
          icon="i-heroicons-key"
          :ui="{ icon: { trailing: { pointer: '' } } }"
        >
          <template #trailing>
            <UButton
              v-if="showPassword"
              icon="i-heroicons-eye-slash-solid"
              :padded="false"
              color="gray"
              variant="link"
              @click="showPassword = false"
            />
            <UButton
              v-else
              icon="i-heroicons-eye-solid"
              :padded="false"
              color="gray"
              variant="link"
              @click="showPassword = true"
            />
          </template>
        </UInput>
      </UFormGroup>

      <UAlert
        v-if="errors.form"
        :title="errors.form"
        icon="i-heroicons-exclamation-triangle-solid"
        color="red"
        variant="subtle"
        class="mt-6"
        :close-button="{
          icon: 'i-heroicons-x-mark-20-solid',
          color: 'red',
          variant: 'link',
        }"
        @close="errors.form = ''"
      />

      <UButton class="mt-8" block :loading="loading" type="submit">
        Sign in
      </UButton>
    </form>

    <div
      class="text-sm font-medium text-gray-500 dark:text-gray-300 text-center"
    >
      Don't have an account?
      <UButton variant="link" :padded="false" to="/register">
        Create one now
      </UButton>
    </div>
  </UCard>
</template>
