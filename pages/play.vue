<script setup lang="ts">
import {
  doc,
  collection,
  addDoc,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { Question } from "../types";

const router = useRouter();
const user = useCurrentUser();

definePageMeta({
  middleware: ["auth"],
  layout: "authenticated",
});

const defaultQuizName = () => {
  const date = new Date();
  return `Untitled ${date.getDate()}-${
    date.getMonth() + 1
  }-${date.getFullYear()}-${date.getSeconds()}-${date.getMilliseconds()}`;
};

const quizName = ref(defaultQuizName());
const publish = ref(true);
const loading = ref(false);
const savingQuiz = ref(false);
const questions = ref<Question[]>([]);
const parseError = ref("");
const choices = ["a).", "b).", "c).", "d)."];

const db = useFirestore();
const items = [
  {
    slot: "prose",
    label: "Try with Text",
    description:
      "Enter the prose here for which you want to generate questions",
  },
  {
    slot: "file",
    label: "Try with image",
    description: "You can upload a jpg, jpeg or a png image file",
  },
];

const parseJSON = (jsonString: string) => {
  try {
    const qs = JSON.parse(jsonString);
    questions.value.push(...qs);
  } catch (error) {
    console.log("failed to find JSON data");
    parseError.value = "Failed to generate questions. Please retry.";
  }
};

const createRequest = async (text: string) => {
  const prompt = `
  You're a teacher who needs to create quizzes. Using the given text content 
  create several (7+) distinct MCQs (4 choices), or true/false type questions. Do not 
  include any explanations, only provide a  RFC8259 compliant JSON response 
  following this format without deviation.
  [
    {
      "question": "the question",
      "choices": ["choice 1", "choice 2", ...],
      "answer": "the correct choice",
    },
    {
      "question": "the question",
      "choices": ["True", "False"],
      "answer": "the correct choice",
    }
  ]

  The text content: `;
  const res = await addDoc(
    collection(db, `requests/${user.value?.uid}/contents`),
    {
      prompt: prompt + text + "\n\n The JSON response: ",
      date: Timestamp.now(),
    }
  );

  return res.id;
};

const onDocCreate = async (text: string) => {
  loading.value = true;

  const docId = await createRequest(text);

  const unsub = onSnapshot(
    doc(collection(db, `requests/${user.value?.uid}/contents`), docId),
    (snap) => {
      if (snap.get("response")) {
        const output = snap.get("response") as string;
        console.log("RESPONSE:", output);

        const jsonRegex = /```json([\s\S]+?)```/;
        const match = output.match(jsonRegex);
        if (match) {
          const jsonString = match[1].trim();
          parseJSON(jsonString);
        } else {
          parseJSON(output);
        }

        loading.value = false;
        unsub();

        console.log("questions", questions);
      }
    }
  );
};

const saveQuiz = async () => {
  savingQuiz.value = true;
  const res = await addDoc(collection(db, `quizzes`), {
    questions: questions.value,
    creator: user.value?.uid,
    date: Timestamp.now(),
    name: quizName.value || defaultQuizName(),
    published: publish.value,
  });

  savingQuiz.value = false;
  navigateTo(`/q/${res.id}`);
};
</script>

<template>
  <div v-if="loading" class="flex items-center space-x-4">
    Generating questions...
    <USkeleton class="h-12 w-12" :ui="{ rounded: 'rounded-full' }" />
    <div class="space-y-2">
      <USkeleton class="h-4 w-[250px]" />
      <USkeleton class="h-4 w-[200px]" />
    </div>
  </div>
  <template v-else-if="questions.length">
    <h3 class="text-gray-900 dark:text-white flex items-center justify-between">
      <span class="text-2xl font-semibold">Generated Questions</span>
      <UButton size="2xs" @click="router.go(0)">Reset</UButton>
    </h3>
    <UCard class="mt-4">
      <h4 class="text-lg">Create new quiz</h4>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Publish a new quiz using the below questions, and share with others.
      </p>
      <div class="flex items-center gap-2 mt-4">
        <span class="text-gray-500 dark:text-gray-400">Name</span>
        <div class="flex-grow">
          <UInput
            v-model="quizName"
            placeholder="Quiz name"
            icon="i-heroicons-book-open"
          >
          </UInput>
        </div>
      </div>
      <div class="flex mt-4">
        <UButton :loading="savingQuiz" :disabled="savingQuiz" @click="saveQuiz">
          {{ publish ? "Publish quiz" : "Save draft" }}
        </UButton>
        <div class="ml-4 flex items-center self-center">
          Publish <UToggle class="ml-2" v-model="publish" />
        </div>
      </div>
    </UCard>

    <UCard
      v-for="(question, index) in questions"
      :key="`question_${index}`"
      class="mt-6"
    >
      <p>{{ index + 1 }}. {{ question.question }}</p>
      <div class="flex flex-wrap">
        <div v-for="(choice, i) in question.choices" class="w-1/2 p-2">
          {{ choices[i] }} {{ choice }}
        </div>
      </div>
      <p class="mt-4">
        <span class="text-gray-500 dark:text-gray-400 text-sm">
          Correct answer:
        </span>
        {{ question.answer }}
      </p>
    </UCard>
  </template>
  <div v-else-if="parseError">
    <UCard class="text-center">
      <p>
        {{ parseError }}
      </p>
      <UButton class="mt-6" size="lg" @click="parseError = ''">
        Go back
      </UButton>
    </UCard>
  </div>
  <UTabs v-else :items="items" class="w-full">
    <template #prose="{ item }">
      <ProsePrompt :item="item" @doc-create="onDocCreate" />
    </template>
    <template #file="{ item }">
      <ImagePrompt :item="item" @doc-create="onDocCreate" />
    </template>
  </UTabs>
</template>
