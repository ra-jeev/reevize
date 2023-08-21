<script setup lang="ts">
import { doc, collection } from "firebase/firestore";
import { Quiz, QuizQuestion, Choice } from "../../types";

const router = useRouter();
const route = useRoute();
const choicePrefixes = ["a).", "b).", "c).", "d)."];
const showAnswers = ref(false);
const db = useFirestore();
const { data: quiz, pending } = useDocument(
  doc(collection(db, "quizzes"), route.params.id as string),
  {
    once: true,
  }
);

console.log("quiz", quiz);

const questions = ref<QuizQuestion[]>([]);

onMounted(() => {
  watch(quiz, (quiz) => {
    if (quiz) {
      const q = quiz as Quiz;
      const quizQuestions: QuizQuestion[] = [];

      q.questions.forEach((question) => {
        const choices: Choice[] = [];

        for (const [i, choice] of question.choices.entries()) {
          choices.push({
            label: `${choicePrefixes[i]} ${choice}`,
            name: choice,
            value: choice,
          });
        }

        quizQuestions.push({ ...question, selected: "", choices });
      });

      questions.value = quizQuestions;
    }
  });
});

const onBtnClick = () => {
  if (!showAnswers.value) {
    showAnswers.value = true;
  } else {
    router.go(0);
  }
};
</script>

<template>
  <UContainer class="pb-12">
    <UCard v-if="pending" class="text-center mt-12">Getting the quiz...</UCard>
    <div v-else-if="quiz && questions.length">
      <UCard class="mt-6" :ui="{ body: { padding: 'p-4' } }">
        <h2
          class="text-xl md:text-3xl font-semibold text-gray-900 dark:text-white text-center"
        >
          {{ quiz.name }}
        </h2>
      </UCard>
      <UCard
        v-for="(question, index) in questions"
        :key="`question_${index}`"
        class="mt-6"
      >
        <p>{{ index + 1 }}. {{ question.question }}</p>
        <div class="flex flex-col gap-2 pl-4 pt-3">
          <URadio
            v-for="(choice, i) in question.choices"
            :key="`choice-${index}${i}`"
            v-model="question.selected"
            v-bind="choice"
            :disabled="showAnswers"
          />
        </div>

        <template v-if="showAnswers">
          <p class="mt-4 flex items-center">
            <UIcon
              :name="`${
                question.selected === question.answer
                  ? 'i-heroicons-check-circle-20-solid'
                  : 'i-heroicons-x-circle-20-solid'
              }`"
              :class="`${
                question.selected === question.answer
                  ? 'text-green-500 dark:text-green-400'
                  : 'text-red-500 dark:text-red-400'
              }`"
              class="text-2xl"
            />
            <span class="ml-2">
              {{
                question.selected === question.answer
                  ? "You got it right."
                  : "Uh-oh! Wrong answer."
              }}
            </span>
          </p>
          <p class="mt-2">
            <span class="text-gray-500 dark:text-gray-400 text-sm">
              Correct answer:
            </span>
            {{ question.answer }}
          </p>
        </template>
      </UCard>
      <UButton class="mt-4" @click="onBtnClick">
        {{ showAnswers ? "Reset quiz" : "Check answers" }}
      </UButton>
    </div>
    <UCard v-else class="mt-12"> No such quiz</UCard>
  </UContainer>
</template>
