"use client";

import { useState } from "react";
import Link from "next/link";
import type { QuestionSet } from "@/lib/questions";

const CIRCLED = ["①", "②", "③", "④", "⑤"] as const;

export default function QuizRunner({ data }: { data: QuestionSet }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = data.questions[index];
  const isLast = index === data.questions.length - 1;

  function handleSelect(choiceNumber: number) {
    if (selected !== null) return;
    setSelected(choiceNumber);
    if (choiceNumber === question.answer) setScore((s) => s + 1);
  }

  function handleNext() {
    if (isLast) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  }

  if (finished) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 p-6 text-center">
        <h1 className="mb-4 text-2xl font-bold">結果</h1>
        <p className="mb-6 text-lg">
          {score} / {data.questions.length} 問正解
        </p>
        <Link href="/" className="text-blue-600 underline">
          トップに戻る
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-6">
      <div className="mb-4 flex justify-between text-sm text-zinc-500">
        <span>
          第{data.round}回 {data.subjectLabel}
        </span>
        <span>
          {index + 1} / {data.questions.length}
        </span>
      </div>

      <h2 className="mb-3 font-semibold">問{question.number}</h2>
      <p className="mb-4 whitespace-pre-wrap leading-relaxed">{question.text}</p>

      {question.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={question.image}
          alt={`問${question.number}の図`}
          className="mb-4 w-full rounded border border-zinc-200 dark:border-zinc-800"
        />
      )}

      <ul className="mb-6 space-y-2">
        {question.choices.map((choice, i) => {
          const choiceNumber = i + 1;
          const isSelected = selected === choiceNumber;
          const isCorrect = choiceNumber === question.answer;

          let style = "border-zinc-300 dark:border-zinc-700";
          if (selected !== null) {
            if (isCorrect) style = "border-green-500 bg-green-50 dark:bg-green-950";
            else if (isSelected) style = "border-red-500 bg-red-50 dark:bg-red-950";
          }

          return (
            <li key={choiceNumber}>
              <button
                type="button"
                onClick={() => handleSelect(choiceNumber)}
                disabled={selected !== null}
                className={`w-full rounded border px-3 py-2 text-left ${style}`}
              >
                {CIRCLED[i]} {choice}
              </button>
            </li>
          );
        })}
      </ul>

      {selected !== null && (
        <button
          type="button"
          onClick={handleNext}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {isLast ? "結果を見る" : "次の問題"}
        </button>
      )}
    </main>
  );
}
