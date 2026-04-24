/**
 * 기분(Mood) 표시용 공용 유틸.
 *
 * 일기 작성 폼의 MoodPicker와 목록 렌더링에서 동일한 이모지·라벨을 사용하기 위해
 * 한 곳에서 정의한다.
 */

import type { Mood } from "@langjournal/core";

export interface MoodOption {
  value: Mood;
  emoji: string;
  label: string;
}

/** UI에 노출되는 기분 선택지 목록 (표시 순서 기준) */
export const MOOD_OPTIONS: MoodOption[] = [
  { value: "great", emoji: "🤩", label: "great" },
  { value: "good", emoji: "😊", label: "good" },
  { value: "neutral", emoji: "😐", label: "neutral" },
  { value: "anxious", emoji: "😰", label: "anxious" },
  { value: "frustrated", emoji: "😤", label: "frustrated" },
  { value: "sad", emoji: "🥲", label: "sad"}
];

const MOOD_EMOJI: Record<Mood, string> = MOOD_OPTIONS.reduce(
  (acc, { value, emoji }) => {
    acc[value] = emoji;
    return acc;
  },
  {} as Record<Mood, string>,
);

/**
 * Mood 값을 이모지로 변환합니다.
 *
 * @param mood - 변환할 mood 값
 * @returns 대응하는 이모지
 */
export function getMoodEmoji(mood: Mood): string {
  return MOOD_EMOJI[mood];
}
