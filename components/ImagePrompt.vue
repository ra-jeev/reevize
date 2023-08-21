<script setup lang="ts">
import { ref as storageRef, uploadBytes } from "firebase/storage";
import { useFirebaseStorage } from "vuefire";
import { query, where, collection, onSnapshot } from "firebase/firestore";
import type { FormError } from "@nuxthq/ui/dist/runtime/types";

defineProps({
  item: { type: Object, required: true },
});
const emit = defineEmits(["docCreate"]);
const user = useCurrentUser();
const fileNamePrefix = `reevize/uploads/${Date.now()}--${user.value?.uid}`;
const loading = ref(false);
const storage = useFirebaseStorage();

const state = ref<{ files: FileList | null; images: string | undefined }>({
  files: null,
  images: undefined,
});

const validate = (state: any): FormError[] => {
  console.log(`inside validate func: `, state.files);
  const errors = [];

  if (!state.files || !state.files.length) {
    errors.push({
      path: "images",
      message: "Please select the images containing text",
    });
  } else if (state.files.length > 2) {
    errors.push({
      path: "images",
      message: "You can select only 2 images at once",
    });

    state.images = undefined;
    state.files = null;
  }

  return errors;
};

const form = ref();
const {
  public: { storageBucket },
} = useRuntimeConfig();

async function submit() {
  console.log(`ImagePrompt Form Submit is called`, state.value.files);
  if (state.value.files?.length) {
    const data = state.value.files.item(0);

    if (data) {
      const fileName = fileNamePrefix + data.name;
      const fileRef = storageRef(storage, fileName);
      loading.value = true;
      const res = await uploadBytes(fileRef, data);
      console.log("upload res", res);

      const db = useFirestore();

      const q = query(
        collection(db, "extractedText"),
        where("file", "==", `gs://${storageBucket}/${fileName}`)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log("query snapshot", querySnapshot);
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0].data();
          console.log("got the doc", doc);
          if (doc.text) {
            emit("docCreate", doc.text);
          }
          unsubscribe();
          loading.value = false;
        }
      });
    }
  }
}

function filesChanged(args: Event) {
  state.value.files = (args.target as HTMLInputElement).files;
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

      <UFormGroup label="Image file" name="images" required>
        <UInput
          v-model="state.images"
          accept=".jpg, .jpeg, .png"
          capture="environment"
          type="file"
          required
          :disabled="loading"
          @change="filesChanged"
        />
      </UFormGroup>

      <template #footer>
        <UButton
          icon="i-heroicons-beaker"
          :disabled="loading"
          :loading="loading"
          type="submit"
        >
          Upload & generate questions
        </UButton>
      </template>
    </UCard>
  </UForm>
</template>
