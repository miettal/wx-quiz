"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FlatQuestion } from "@/lib/questions";
import { CATEGORIES, type Subject } from "@/lib/categories";
import { BASE_PATH } from "@/lib/basePath";

const CIRCLED = ["①", "②", "③", "④", "⑤"] as const;
const SUBJECT_LABELS: Record<Subject, string> = {
  ippan: "一般知識",
  senmon: "専門知識",
};
const SUBJECTS = Object.keys(CATEGORIES) as Subject[];

type Mode = "normal" | "tf";
type Phase = "config" | "running" | "results";

type PracticeItem =
  | {
      kind: "choice";
      key: string;
      round: number;
      subject: Subject;
      category: string;
      questionNumber: number;
      text: string;
      image?: string;
      choices: string[];
      answerIndex: number;
    }
  | {
      kind: "tf";
      key: string;
      round: number;
      subject: Subject;
      category: string;
      questionNumber: number;
      label: string;
      text: string;
      correct: boolean;
    };

type Stats = Record<string, { correct: number; total: number }>;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pct(correct: number, total: number): string {
  if (total === 0) return "-";
  return `${Math.round((correct / total) * 100)}%`;
}

export default function PracticeApp({ questions }: { questions: FlatQuestion[] }) {
  const [phase, setPhase] = useState<Phase>("config");
  const [subjects, setSubjects] = useState<Set<Subject>>(new Set(SUBJECTS));
  const [mode, setMode] = useState<Mode>("normal");
  const [categories, setCategories] = useState<Set<string>>(
    () => new Set(SUBJECTS.flatMap((s) => [...CATEGORIES[s]])),
  );

  const [queue, setQueue] = useState<PracticeItem[]>([]);
  const [current, setCurrent] = useState<PracticeItem | null>(null);
  const [selected, setSelected] = useState<number | boolean | null>(null);
  const [stats, setStats] = useState<Stats>({});
  const [overall, setOverall] = useState({ correct: 0, total: 0 });

  const availableCategories = useMemo(
    () => SUBJECTS.filter((s) => subjects.has(s)).flatMap((s) => CATEGORIES[s].map((c) => ({ subject: s, category: c }))),
    [subjects],
  );

  const normalPool = useMemo<PracticeItem[]>(
    () =>
      questions
        .filter(
          (q) =>
            subjects.has(q.subject as Subject) &&
            !!q.category &&
            categories.has(q.category),
        )
        .map((q) => ({
          kind: "choice" as const,
          key: `${q.round}-${q.subject}-${q.number}`,
          round: q.round,
          subject: q.subject as Subject,
          category: q.category!,
          questionNumber: q.number,
          text: q.text,
          image: q.image,
          choices: q.choices,
          answerIndex: q.answer,
        })),
    [questions, subjects, categories],
  );

  const tfPool = useMemo<PracticeItem[]>(
    () =>
      questions
        .filter(
          (q) =>
            subjects.has(q.subject as Subject) &&
            !!q.category &&
            categories.has(q.category) &&
            (q.statements?.length ?? 0) > 0,
        )
        .flatMap((q) =>
          q.statements!.map((s) => ({
            kind: "tf" as const,
            key: `${q.round}-${q.subject}-${q.number}-${s.label}`,
            round: q.round,
            subject: q.subject as Subject,
            category: q.category!,
            questionNumber: q.number,
            label: s.label,
            text: s.text,
            correct: s.correct,
          })),
        ),
    [questions, subjects, categories],
  );

  const pool = mode === "normal" ? normalPool : tfPool;

  function toggleSubject(s: Subject) {
    setSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(s)) {
        if (next.size === 1) return prev;
        next.delete(s);
      } else {
        next.add(s);
      }
      return next;
    });
  }

  function toggleCategory(c: string) {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  function setSubjectCategoriesAll(s: Subject, on: boolean) {
    setCategories((prev) => {
      const next = new Set(prev);
      CATEGORIES[s].forEach((c) => (on ? next.add(c) : next.delete(c)));
      return next;
    });
  }

  function drawFrom(currentQueue: PracticeItem[]): { item: PracticeItem | null; rest: PracticeItem[] } {
    if (currentQueue.length > 0) {
      return { item: currentQueue[0], rest: currentQueue.slice(1) };
    }
    if (pool.length === 0) return { item: null, rest: [] };
    const shuffled = shuffle(pool);
    return { item: shuffled[0], rest: shuffled.slice(1) };
  }

  function start() {
    setStats({});
    setOverall({ correct: 0, total: 0 });
    const shuffled = shuffle(pool);
    setCurrent(shuffled[0] ?? null);
    setQueue(shuffled.slice(1));
    setSelected(null);
    setPhase("running");
  }

  function answer(value: number | boolean) {
    if (selected !== null || !current) return;
    setSelected(value);
    const isCorrect =
      current.kind === "choice" ? value === current.answerIndex : value === current.correct;
    setOverall((o) => ({ correct: o.correct + (isCorrect ? 1 : 0), total: o.total + 1 }));
    setStats((prev) => {
      const prevCat = prev[current.category] ?? { correct: 0, total: 0 };
      return {
        ...prev,
        [current.category]: {
          correct: prevCat.correct + (isCorrect ? 1 : 0),
          total: prevCat.total + 1,
        },
      };
    });
  }

  function next() {
    const { item, rest } = drawFrom(queue);
    setCurrent(item);
    setQueue(rest);
    setSelected(null);
  }

  function finish() {
    setPhase("results");
  }

  function backToConfig() {
    setPhase("config");
  }

  if (phase === "config") {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">演習モード</h1>
          <Link href="/" className="text-sm text-blue-600 underline">
            トップに戻る
          </Link>
        </div>

        <section className="mb-6">
          <h2 className="mb-2 font-semibold">科目</h2>
          <div className="flex gap-4">
            {SUBJECTS.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={subjects.has(s)}
                  onChange={() => toggleSubject(s)}
                />
                {SUBJECT_LABELS[s]}
              </label>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 font-semibold">出題モード</h2>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                checked={mode === "normal"}
                onChange={() => setMode("normal")}
              />
              通常(選択式)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                checked={mode === "tf"}
                onChange={() => setMode("tf")}
              />
              単問短答(正誤一問一答)
            </label>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 font-semibold">単元</h2>
          {SUBJECTS.filter((s) => subjects.has(s)).map((s) => (
            <div key={s} className="mb-3 rounded border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">{SUBJECT_LABELS[s]}</span>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    className="text-blue-600 underline"
                    onClick={() => setSubjectCategoriesAll(s, true)}
                  >
                    全選択
                  </button>
                  <button
                    type="button"
                    className="text-blue-600 underline"
                    onClick={() => setSubjectCategoriesAll(s, false)}
                  >
                    全解除
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {CATEGORIES[s].map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={categories.has(c)}
                      onChange={() => toggleCategory(c)}
                    />
                    {c}
                  </label>
                ))}
              </div>
            </div>
          ))}
          {availableCategories.length === 0 && (
            <p className="text-sm text-zinc-500">科目を1つ以上選んでください。</p>
          )}
        </section>

        <p className="mb-4 text-sm text-zinc-500">
          出題対象: {pool.length}
          {mode === "normal" ? "問" : "文"}
        </p>

        <button
          type="button"
          disabled={pool.length === 0}
          onClick={start}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-40 hover:bg-blue-700"
        >
          開始
        </button>
      </main>
    );
  }

  if (phase === "results") {
    const categoryEntries = Object.entries(stats).sort(([a], [b]) => a.localeCompare(b, "ja"));
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 p-6">
        <h1 className="mb-4 text-2xl font-bold">結果</h1>
        <p className="mb-6 text-lg">
          全体: {overall.correct} / {overall.total} ({pct(overall.correct, overall.total)})
        </p>

        <h2 className="mb-2 font-semibold">単元別正答率</h2>
        <table className="mb-6 w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
              <th className="py-1">単元</th>
              <th className="py-1 text-right">正答/出題</th>
              <th className="py-1 text-right">正答率</th>
            </tr>
          </thead>
          <tbody>
            {categoryEntries.map(([cat, s]) => (
              <tr key={cat} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-1">{cat}</td>
                <td className="py-1 text-right">
                  {s.correct} / {s.total}
                </td>
                <td className="py-1 text-right">{pct(s.correct, s.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={start}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            同じ条件でもう一度
          </button>
          <button
            type="button"
            onClick={backToConfig}
            className="rounded border border-zinc-300 px-4 py-2 dark:border-zinc-700"
          >
            条件を変える
          </button>
        </div>
      </main>
    );
  }

  // running
  if (!current) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 p-6">
        <p className="mb-4">出題対象の問題がありません。</p>
        <button
          type="button"
          onClick={backToConfig}
          className="rounded border border-zinc-300 px-4 py-2 dark:border-zinc-700"
        >
          条件を変える
        </button>
      </main>
    );
  }

  const categoryEntries = Object.entries(stats).sort(([a], [b]) => a.localeCompare(b, "ja"));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-6">
      <div className="mb-3 flex items-center justify-between text-sm text-zinc-500">
        <span>
          全体: {overall.correct} / {overall.total} ({pct(overall.correct, overall.total)})
        </span>
        <button type="button" onClick={finish} className="text-blue-600 underline">
          終了して結果を見る
        </button>
      </div>

      {categoryEntries.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          {categoryEntries.map(([cat, s]) => (
            <span
              key={cat}
              className="rounded-full border border-zinc-200 px-2 py-1 dark:border-zinc-800"
            >
              {cat}: {s.correct}/{s.total} ({pct(s.correct, s.total)})
            </span>
          ))}
        </div>
      )}

      <div className="mb-3 text-xs text-zinc-500">
        第{current.round}回 {SUBJECT_LABELS[current.subject]} 問{current.questionNumber}
        {current.kind === "tf" && ` (${current.label})`} ／ {current.category}
      </div>

      {current.kind === "choice" ? (
        <>
          <p className="mb-4 whitespace-pre-wrap leading-relaxed">{current.text}</p>
          {current.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${BASE_PATH}${current.image}`}
              alt={`問${current.questionNumber}の図`}
              className="mb-4 w-full rounded border border-zinc-200 dark:border-zinc-800"
            />
          )}
          <ul className="mb-6 space-y-2">
            {current.choices.map((choice, i) => {
              const choiceNumber = i + 1;
              const isSelected = selected === choiceNumber;
              const isCorrect = choiceNumber === current.answerIndex;
              let style = "border-zinc-300 dark:border-zinc-700";
              if (selected !== null) {
                if (isCorrect) style = "border-green-500 bg-green-50 dark:bg-green-950";
                else if (isSelected) style = "border-red-500 bg-red-50 dark:bg-red-950";
              }
              return (
                <li key={choiceNumber}>
                  <button
                    type="button"
                    onClick={() => answer(choiceNumber)}
                    disabled={selected !== null}
                    className={`w-full rounded border px-3 py-2 text-left ${style}`}
                  >
                    {CIRCLED[i]} {choice}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <>
          <p className="mb-6 whitespace-pre-wrap leading-relaxed">{current.text}</p>
          <div className="mb-6 flex gap-3">
            {[true, false].map((v) => {
              const isSelected = selected === v;
              const isCorrect = v === current.correct;
              let style = "border-zinc-300 dark:border-zinc-700";
              if (selected !== null) {
                if (isCorrect) style = "border-green-500 bg-green-50 dark:bg-green-950";
                else if (isSelected) style = "border-red-500 bg-red-50 dark:bg-red-950";
              }
              return (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => answer(v)}
                  disabled={selected !== null}
                  className={`flex-1 rounded border px-3 py-3 text-lg font-medium ${style}`}
                >
                  {v ? "正" : "誤"}
                </button>
              );
            })}
          </div>
        </>
      )}

      {selected !== null && (
        <button
          type="button"
          onClick={next}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          次の問題
        </button>
      )}
    </main>
  );
}
