/**
 * 데이터베이스 핵심 타입 정의 모듈
 * 모든 데이터 엔티티의 스키마를 정의합니다.
 *
 * @module db/schema
 */

/** 지원하는 목표 언어 */
export type Language = 'en' | 'ja' | 'zh' | 'es' | 'fr';

/** 일기 작성자의 기분 */
export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

/**
 * 문법 교정 항목
 * AI 피드백에서 문법이나 맞춤법 오류를 나타냅니다.
 */
export interface Correction {
    /** 수정 전 원문 */
    original: string;
    /** 수정된 표현 */
    corrected: string;
    /** 한국어 설명 (왜 이렇게 수정되는지) */
    explanation: string;
    /** targetText 내 수정 대상의 시작 인덱스 */
    offset: number;
    /** targetText 내 수정 대상의 길이 (문자 수) */
    length: number;
}

/**
 * 표현 업그레이드 제안
 * 더 자연스럽거나 효과적인 표현을 제안합니다.
 */
export interface Suggestion {
    /** 원문 표현 */
    original: string;
    /** 더 나은 표현 */
    better: string;
    /** 한국어 이유 설명 */
    reason: string;
}

/**
 * AI 피드백 기록
 * 일기에 대한 LLM 분석 결과를 저장합니다.
 */
export interface FeedbackRecord {
    /** 문법 교정 목록 */
    corrections: Correction[];
    /** 표현 업그레이드 제안 목록 */
    suggestions: Suggestion[];
    /** 오늘 배운 새로운 표현 3개 */
    newPhrases: string[];
    /** 피드백 생성 시간 (Unix timestamp) */
    generatedAt: number;
}

/**
 * 일기 항목
 * 사용자가 작성한 일기와 관련 메타데이터를 저장합니다.
 */
export interface DiaryEntry {
    /** 고유 식별자 (crypto.randomUUID()) */
    id: string;
    /** 일기 작성 날짜 ('YYYY-MM-DD' 형식) */
    date: string;
    /** 일기 제목 */
    title: string;
    /** 목표 언어 */
    targetLanguage?: Language;
    /** 모국어(한국어) 원문 — 사용자의 생각이나 의도를 기록 */
    nativeText?: string;
    /** 목표 언어로 작성한 일기 본문 */
    targetText: string;
    /** 작성 당시 기분 (선택사항) */
    mood?: Mood;
    /** AI 피드백 (선택사항, 피드백 생성 후 추가) */
    feedback?: FeedbackRecord;
    /** 생성 시간 (Unix timestamp, 불변) */
    createdAt: number;
    /** 마지막 수정 시간 (Unix timestamp) */
    updatedAt: number;
}

/**
 * 어휘 학습 항목
 * 일기에서 나타난 새로운 단어나 표현을 추적합니다.
 */
export interface VocabItem {
    /** 고유 식별자 */
    id: string;
    /** 출처 일기의 ID */
    entryId: string;
    /** 학습 대상 단어 또는 표현 */
    term: string;
    /** 발음 표기 (예: 일본어 히라가나) — 선택사항 */
    reading?: string;
    /** 한국어 뜻 */
    meaning: string;
    /** 문맥을 보여주는 예시 문장 — 선택사항 */
    exampleSentence?: string;
    /** 어휘의 언어 */
    language: Language;
    /**
     * 숙련도 레벨
     * - 0: 새로 배운 단어
     * - 1: 학습 중
     * - 2: 친숙함
     * - 3: 완전히 습득함
     */
    masteryLevel: 0 | 1 | 2 | 3;
    /** 마지막 복습 시간 — 선택사항 */
    lastReviewedAt?: number;
    /** 생성 시간 (불변) */
    createdAt: number;
}

/**
 * 대화 메시지
 * 사용자와 AI 사이의 한 번의 상호작용을 나타냅니다.
 */
export interface ConversationMessage {
    /** 발화자 역할 */
    role: 'user' | 'assistant';
    /** 메시지 내용 */
    content: string;
    /** 메시지 생성 시간 (Unix timestamp) */
    timestamp: number;
}

/**
 * 대화 세션
 * 특정 일기를 기반으로 한 대화 연습 세션을 나타냅니다.
 */
export interface ConversationSession {
    /** 대화의 기반이 되는 일기의 ID (고유 키) */
    entryId: string;
    /** 대화 메시지 목록 */
    messages: ConversationMessage[];
    /** 대화 시작 시간 */
    startedAt: number;
    /** 마지막 메시지 시간 */
    updatedAt: number;
}
