/**
 * 어휘 다양성 및 성장 통계 분석 모듈
 * 일기 기반의 언어 학습 진도를 추적합니다.
 *
 * @module analysis/stats
 */

import type { DiaryEntry, Language } from '../db/schema.js';

/**
 * 단일 일기의 통계
 * 어휘 다양성, 문장 길이 등의 지표를 포함합니다.
 */
export interface EntryStats {
  /** 전체 단어 개수 */
  wordCount: number;
  /** 고유 단어 개수 (중복 제외) */
  uniqueWordCount: number;
  /**
   * Type-Token Ratio (TTR)
   * 어휘 다양성을 나타내는 표준 지표 (0~1 범위)
   * 1.0에 가까울수록 다양한 표현 사용
   */
  typeTokenRatio: number;
  /** 평균 문장 길이 (단어 수) */
  avgSentenceLength: number;
  /** 전체 문장 개수 */
  sentenceCount: number;
  /** 이 일기에 대한 AI 피드백의 교정 개수 */
  correctionCount: number;
  /** 이 일기에 대한 AI 피드백의 제안 개수 */
  suggestionCount: number;
}

/**
 * 전체 성장 통계
 * 여러 일기를 기반으로 사용자의 학습 진도를 종합적으로 나타냅니다.
 */
export interface GrowthStats {
  /** 작성한 총 일기 개수 */
  totalEntries: number;
  /** 작성한 총 단어 개수 */
  totalWords: number;
  /** 모든 일기의 평균 TTR */
  avgTTR: number;
  /** 현재 연속 작성일 수 (오늘 기준) */
  streak: number;
  /** 기록된 최장 연속 작성일 수 */
  longestStreak: number;
  /** 언어별 일기 개수 (예: { en: 12, ja: 5 }) */
  languageBreakdown: Record<string, number>;
}

/**
 * 텍스트를 토큰(단어 또는 문자)으로 분리합니다.
 * 언어별로 다른 토크나이제이션 방식을 적용합니다.
 *
 * @param text - 분석할 텍스트
 * @param language - 텍스트의 언어 코드
 * @returns 토큰 배열
 *
 * @remarks
 * - 알파벳 기반 언어(en, es, fr): 소문자 변환 후 단어 단위 추출
 * - CJK 언어(ja, zh): 유니코드 블록 기준 문자 단위 추출
 *   (공백 없는 언어의 TTR을 정확히 계산하기 위함)
 */
function tokenize(text: string, language: string): string[] {
  const isCJK = language === 'ja' || language === 'zh';

  if (isCJK) {
    // CJK Unified Ideographs + Hiragana + Katakana + Hangul 범위 문자 추출
    // 그 외 알파벳도 단어 단위로 추출
    const matches = Array.from(
      text.matchAll(/[\u3000-\u9FFF\uAC00-\uD7AF]+|[a-zA-Z]+/g)
    );
    return matches.flatMap((m) => (m[0] ? Array.from(m[0]) : []));
  }

  // 알파벳 기반: 소문자 변환 후 단어 정규식으로 추출
  return (
    text
      .toLowerCase()
      .match(/\b[a-záéíóúàèìòùäöüñ'-]+\b/g) ?? []
  );
}

/**
 * 마침표, 물음표, 느낌표, 한중일 문장 종료 기호로 문장을 분리합니다.
 *
 * @param text - 분석할 텍스트
 * @returns 문장 배열
 */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?。！？])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Type-Token Ratio를 계산합니다.
 *
 * TTR = 고유 토큰 수 / 전체 토큰 수
 *
 * 특징:
 * - 단순하면서도 표준적인 어휘 다양성 지표
 * - 소형 언어 모델(Gemma-3-1B)과 함께 클라이언트에서 계산 가능
 * - CJK 언어를 위한 별도 토크나이제이션 지원
 *
 * @param text - 분석할 텍스트
 * @param language - 텍스트의 언어 코드
 * @returns TTR 값 (0~1, 빈 텍스트는 0)
 *
 * @example
 * const ttr = calcTypeTokenRatio('Hello world', 'en');
 * // 2개 토큰, 2개 고유 → TTR = 1.0
 */
export function calcTypeTokenRatio(text: string, language: string): number {
  const tokens = tokenize(text, language);
  if (tokens.length === 0) return 0;
  const types = new Set(tokens);
  return types.size / tokens.length;
}

/**
 * 단일 일기의 통계를 계산합니다.
 *
 * @param entry - 분석할 일기
 * @returns 일기의 모든 통계 지표
 *
 * @example
 * const stats = calcEntryStats(diaryEntry);
 * console.log(`이 일기의 TTR: ${stats.typeTokenRatio.toFixed(2)}`);
 */
export function calcEntryStats(entry: DiaryEntry): EntryStats {
  const tokens = tokenize(entry.targetText, entry.targetLanguage);
  const sentences = splitSentences(entry.targetText);
  const uniqueTokens = new Set(tokens);

  return {
    wordCount: tokens.length,
    uniqueWordCount: uniqueTokens.size,
    typeTokenRatio:
      tokens.length > 0 ? uniqueTokens.size / tokens.length : 0,
    avgSentenceLength:
      sentences.length > 0 ? tokens.length / sentences.length : 0,
    sentenceCount: sentences.length,
    correctionCount: entry.feedback?.corrections.length ?? 0,
    suggestionCount: entry.feedback?.suggestions.length ?? 0,
  };
}

/**
 * 날짜 문자열 간 일수를 계산합니다.
 *
 * @param a - 시작 날짜 ('YYYY-MM-DD' 형식)
 * @param b - 종료 날짜 ('YYYY-MM-DD' 형식)
 * @returns 차이 (일 단위)
 *
 * @remarks
 * DOM API 없이 순수 계산으로 구현됨 (core 패키지 요구사항)
 */
function daysBetween(a: string, b: string): number {
  const msPerDay = 86_400_000;
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / msPerDay
  );
}

/**
 * 현재 날짜를 'YYYY-MM-DD' 형식으로 반환합니다.
 *
 * @returns 오늘 날짜 문자열
 *
 * @remarks
 * UTC 기준입니다.
 */
function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 여러 일기를 기반으로 전체 성장 통계를 계산합니다.
 *
 * 계산 대상:
 * - 작성일 연속 기록 (스트릭, 최장 스트릭)
 * - 평균 TTR
 * - 언어별 분포
 * - 총 단어 수
 *
 * @param entries - 분석할 일기 배열
 * @returns 성장 통계 종합
 *
 * @example
 * const stats = calcGrowthStats(allEntries);
 * console.log(`${stats.streak}일 연속 작성 중!`);
 * console.log(`평균 어휘 다양성(TTR): ${stats.avgTTR.toFixed(2)}`);
 */
export function calcGrowthStats(entries: DiaryEntry[]): GrowthStats {
  // 날짜순 정렬 (오래된 것부터)
  const sorted = [...entries].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // 연속 작성 기록 계산
  let streak = 0;
  let longestStreak = 0;
  let currentStreak = 0;
  let prevDate: string | null = null;

  for (const entry of sorted) {
    if (prevDate === null) {
      currentStreak = 1;
    } else {
      const diff = daysBetween(prevDate, entry.date);
      // 연속: 날짜 차이가 정확히 1일
      currentStreak = diff === 1 ? currentStreak + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, currentStreak);
    prevDate = entry.date;
  }

  // 오늘 기준 현재 스트릭 (어제 또는 오늘 작성한 경우만)
  streak =
    prevDate && daysBetween(prevDate, todayString()) <= 1
      ? currentStreak
      : 0;

  // 평균 TTR 계산
  const ttrValues = entries.map((e) =>
    calcTypeTokenRatio(e.targetText, e.targetLanguage)
  );
  const avgTTR =
    ttrValues.length > 0
      ? ttrValues.reduce((sum, v) => sum + v, 0) / ttrValues.length
      : 0;

  // 언어별 분포
  const languageBreakdown: Record<string, number> = {};
  for (const e of entries) {
    languageBreakdown[e.targetLanguage] =
      (languageBreakdown[e.targetLanguage] ?? 0) + 1;
  }

  // 총 단어 수
  const totalWords = entries.reduce(
    (sum, e) =>
      sum + tokenize(e.targetText, e.targetLanguage).length,
    0
  );

  return {
    totalEntries: entries.length,
    totalWords,
    avgTTR,
    streak,
    longestStreak,
    languageBreakdown,
  };
}
