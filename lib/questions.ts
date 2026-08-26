import fs from "node:fs";
import path from "node:path";

export type Statement = {
  label: string;
  text: string;
  correct: boolean;
  correctedText?: string;
};

export type Match = {
  label: string;
  item: string;
  targetLabel: string;
  targetText?: string;
};

export type Question = {
  number: number;
  text: string;
  choices: string[];
  answer: number;
  image?: string;
  category?: string;
  statements?: Statement[];
  matches?: Match[];
};

export type QuestionSet = {
  round: number;
  subject: string;
  subjectLabel: string;
  questions: Question[];
};

export type FlatQuestion = Question & {
  round: number;
  subject: string;
  subjectLabel: string;
};

const QUESTIONS_DIR = path.join(process.cwd(), "data", "questions");

export function getAvailableRounds(): number[] {
  return fs
    .readdirSync(QUESTIONS_DIR)
    .filter((name) => fs.statSync(path.join(QUESTIONS_DIR, name)).isDirectory())
    .map(Number)
    .sort((a, b) => b - a);
}

export function getAvailableSubjects(round: number): string[] {
  const dir = path.join(QUESTIONS_DIR, String(round));
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.replace(/\.json$/, ""));
}

export function getQuestionSet(round: number, subject: string): QuestionSet {
  const file = path.join(QUESTIONS_DIR, String(round), `${subject}.json`);
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

export function getAllQuestions(): FlatQuestion[] {
  return getAvailableRounds().flatMap((round) =>
    getAvailableSubjects(round).flatMap((subject) => {
      const set = getQuestionSet(round, subject);
      return set.questions.map((q) => ({
        ...q,
        round: set.round,
        subject: set.subject,
        subjectLabel: set.subjectLabel,
      }));
    }),
  );
}
