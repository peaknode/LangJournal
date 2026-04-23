"use client";

interface NewPhrasesListProps {
  phrases: string[];
}

/**
 * AI가 추천한 새 표현 목록을 pill chip으로 표시합니다.
 *
 * @param phrases - 오늘의 새 표현 배열 (최대 3개)
 */
export function NewPhrasesList({ phrases }: NewPhrasesListProps) {
  if (phrases.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {phrases.map((phrase) => (
        <span
          key={phrase}
          className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-violet-100 text-violet-700"
        >
          {phrase}
        </span>
      ))}
    </div>
  );
}
