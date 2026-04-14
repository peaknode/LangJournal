/**
 * LLM 프롬프트 템플릿 모듈
 * 피드백 생성과 대화 연습용 프롬프트를 제공합니다.
 *
 * @module llm/prompts
 */

import type {
  DiaryEntry,
  ConversationMessage,
  Language,
} from '../db/schema.js';

/**
 * 언어 코드를 전체 언어명으로 매핑합니다.
 * 프롬프트에서 사람이 읽을 수 있는 언어명을 사용하기 위함입니다.
 */
const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  ja: 'Japanese',
  zh: 'Mandarin Chinese',
  es: 'Spanish',
  fr: 'French',
};

/**
 * 일기에 대한 AI 피드백을 생성하기 위한 프롬프트를 빌드합니다.
 *
 * 프롬프트 특징:
 * - JSON 응답 형식을 명시적으로 강제
 * - offset과 length를 포함한 정확한 스키마 정의
 * - 한국어 설명을 명시적으로 요청
 * - Gemma 같은 소형 모델을 고려하여 간명하게 작성
 *
 * @param entry - 분석할 일기 항목
 * @returns LLM에 보낼 프롬프트 문자열
 *
 * @example
 * const prompt = buildFeedbackPrompt(entry);
 * const response = await llm.generate([{ role: 'user', content: prompt }]);
 * const feedback = parseFeedbackResponse(response);
 */
export function buildFeedbackPrompt(entry: DiaryEntry): string {
  const lang = LANGUAGE_NAMES[entry.targetLanguage];
  return `You are an expert ${lang} language tutor for Korean learners.
Analyze the following diary entry and respond ONLY with valid JSON. No markdown fences, no text outside JSON.

Diary entry: "${entry.targetText}"

Required JSON format:
{
  "corrections": [
    { "original": "...", "corrected": "...", "explanation": "한국어 설명", "offset": 0, "length": 0 }
  ],
  "suggestions": [
    { "original": "...", "better": "...", "reason": "한국어 이유" }
  ],
  "newPhrases": ["표현1", "표현2", "표현3"]
}

Rules:
- corrections: only grammar/spelling errors, include character offset and length in original text
- suggestions: natural expression upgrades (max 3)
- newPhrases: exactly 3 useful phrases from the entry context
- All explanations must be in Korean`;
}

/**
 * 대화 연습용 시스템 메시지를 생성합니다.
 * 이 메시지는 대화의 톤과 규칙을 정의합니다.
 *
 * @param entry - 대화의 기반이 되는 일기 항목
 * @returns 시스템 프롬프트 문자열
 *
 * @remarks
 * 이 프롬프트는 `buildConversationMessages`에 의해
 * messages 배열의 첫 번째 요소로 사용됩니다.
 */
export function buildConversationSystemPrompt(entry: DiaryEntry): string {
  const lang = LANGUAGE_NAMES[entry.targetLanguage];
  return `You are a friendly ${lang} conversation partner.
The user wrote this diary entry today: "${entry.targetText}"
Rules:
- Respond only in ${lang}
- Keep responses to 2-3 sentences maximum
- Ask one follow-up question per turn
- Gently correct major grammar errors by using the correct form naturally in your response
- Do not use markdown formatting`;
}

/**
 * 대화 시작용 메시지를 생성합니다.
 * 이 메시지를 user 역할로 LLM에 보내면 AI가 대화를 시작합니다.
 *
 * @param entry - 대화를 시작할 일기 항목
 * @returns 사용자 역할의 프롬프트 문자열
 *
 * @remarks
 * 실제 사용 흐름:
 * 1. generateFeedback으로 피드백 완료
 * 2. buildConversationMessages(entry, [])로 초기 메시지 배열 생성
 * 3. 시스템 프롬프트 + 이 메시지로 AI의 첫 응답 생성
 */
export function buildConversationStartPrompt(entry: DiaryEntry): string {
  const lang = LANGUAGE_NAMES[entry.targetLanguage];
  return `Start a conversation with the user about their diary. Ask one natural question in ${lang} based on what they wrote.`;
}

/**
 * 대화 히스토리를 ChatMessage 배열로 변환합니다.
 * LLM API에 전달할 형식으로 메시지를 정렬합니다.
 *
 * @param entry - 대화의 기반이 되는 일기 항목
 * @param history - 기존 대화 메시지 목록 (ConversationMessage[])
 * @returns ChatMessage 배열 (system + user/assistant 메시지)
 *
 * @example
 * const messages = buildConversationMessages(entry, conversationHistory);
 * const response = await llm.generate(messages);
 */
export function buildConversationMessages(
  entry: DiaryEntry,
  history: ConversationMessage[]
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  return [
    { role: 'system', content: buildConversationSystemPrompt(entry) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];
}
