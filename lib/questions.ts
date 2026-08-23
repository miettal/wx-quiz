import fs from "node:fs";
import path from "node:path";

export type Question = {
  number: number;
  text: string;
  choices: string[];
  answer: number;
  image?: string;
};

export type QuestionSet = {
  round: number;
  subject: string;
  subjectLabel: string;
  questions: Question[];
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
