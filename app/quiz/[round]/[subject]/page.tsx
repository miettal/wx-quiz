import { notFound } from "next/navigation";
import {
  getAvailableRounds,
  getAvailableSubjects,
  getQuestionSet,
} from "@/lib/questions";
import QuizRunner from "./QuizRunner";

export function generateStaticParams() {
  return getAvailableRounds().flatMap((round) =>
    getAvailableSubjects(round).map((subject) => ({
      round: String(round),
      subject,
    })),
  );
}

export default async function QuizPage({
  params,
}: PageProps<"/quiz/[round]/[subject]">) {
  const { round, subject } = await params;

  let data;
  try {
    data = getQuestionSet(Number(round), subject);
  } catch {
    notFound();
  }

  return <QuizRunner data={data} />;
}
