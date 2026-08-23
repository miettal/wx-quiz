import Link from "next/link";
import { getAvailableRounds, getAvailableSubjects } from "@/lib/questions";

const SUBJECT_LABELS: Record<string, string> = {
  ippan: "一般知識",
  senmon: "専門知識",
};

export default function Home() {
  const rounds = getAvailableRounds();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-6">
      <h1 className="mb-2 text-2xl font-bold">気象予報士試験 過去問クイズ</h1>
      <p className="mb-6 text-sm text-zinc-500">
        学科試験(一般知識・専門知識)の過去問を出題します。
      </p>
      <ul className="space-y-4">
        {rounds.map((round) => {
          const subjects = getAvailableSubjects(round);
          return (
            <li key={round} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="mb-3 font-semibold">第{round}回</h2>
              <div className="flex gap-3">
                {subjects.map((subject) => (
                  <Link
                    key={subject}
                    href={`/quiz/${round}/${subject}`}
                    className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                  >
                    {SUBJECT_LABELS[subject] ?? subject}
                  </Link>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
