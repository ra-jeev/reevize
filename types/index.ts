export type Choice = {
  label: string;
  value: string;
  name: string;
};

export interface Question {
  question: string;
  answer: string;
  choices: string[];
}

export type Quiz = {
  name: string;
  published: boolean;
  questions: Question[];
  creator: string;
  date: string;
};

export interface QuizPlay extends Omit<Quiz, "questions"> {
  questions: QuizQuestion;
}

export interface QuizQuestion extends Omit<Question, "choices"> {
  choices: Choice[];
  selected?: string;
}
