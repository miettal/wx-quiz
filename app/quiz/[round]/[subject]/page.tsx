import { notFound } from "next/navigation";
import { getQuestionSet } from "@/lib/questions";
import QuizRunner from "./QuizRunner";

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
