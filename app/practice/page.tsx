import { getAllQuestions } from "@/lib/questions";
import PracticeApp from "./PracticeApp";

export default function PracticePage() {
  const questions = getAllQuestions();
  return <PracticeApp questions={questions} />;
}
