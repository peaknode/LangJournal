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
import { splitSentences, type SentenceSpan } from './sentence-splitter.js';

/**
 * ���어 코드를 전체 언어명으로 매핑합니다.
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
 * buildFeedbackPrompt의 반환 타입
 * 프롬프트 문자열과 문장 분리 결과를 함께 반환합니다.
 */
export interface FeedbackPromptResult {
  /** LLM에 보낼 프롬프트 문자열 */
  prompt: string;
  /** 클라이언트에서 분리한 문��� 위치 정보 (파서에서 offset 계산용) */
  sentenceSpans: SentenceSpan[];
}

/**
 * 일기에 대한 AI 피드백을 생성하기 위한 프롬프트를 빌드합니다.
 *
 * 프롬프트 특징:
 * - 클라이언트���서 문장을 미리 분���하여 번호 목록으로 제공
 * - 모델은 각 문장의 교정/제안만 채우면 됨 (소�� 모델 부담 감소)
 * - offset/length는 모델에게 요구하지 않고 클라이언트에서 계��
 * - 1-shot 예제 포함으로 출력 안정성 확보
 * - 한국어 설명을 명시적으로 요청
 *
 * @param entry - 분석할 일기 항목
 * @returns 프롬프트 ���자열과 문장 위치 정보
 *
 * @example
 * const { prompt, sentenceSpans } = buildFeedbackPrompt(entry);
 * const raw = await llm.generate([{ role: 'user', content: prompt }]);
 * const feedback = parseFeedbackResponse(raw, sentenceSpans);
 */
export function buildFeedbackPrompt(entry: DiaryEntry): FeedbackPromptResult {
  const lang = LANGUAGE_NAMES[entry.targetLanguage ?? 'en'];
  const sentenceSpans = splitSentences(entry.targetText);

  const numberedSentences = sentenceSpans
    .map((s, i) => `${i + 1}. "${s.text}"`)
    .join('\n');

  const prompt = `You are an ${lang} tutor for Korean learners.
Below are numbered sentences from a diary. For each sentence, find grammar/spelling errors and suggest better expressions.

Sentences:
${numberedSentences}

Respond ONLY with valid JSON, no markdown fences, no extra text:
{"sentences":[{"index":1,"corrected":"I went to school yesterday.","corrections":[{"type":"grammar","original":"go","corrected":"went","explanation":"과거 시제를 사용해야 합니���"}],"suggestions":[{"original":"go to school","better":"attended school","reason":"더 격식 있는 표현"}]}],"newPhrases":["attend school","have a blast","look forward to"]}

Rules:
- Only include sentences that have errors or can be improved
- If a sentence is correct and natural, skip it
- All explanation and reason must be in Korean
- corrections: grammar/spelling errors only
- suggestions: more natural expressions (max 2 per sentence)
- newPhrases: exactly 3 useful expressions from the diary context
`;

  return { prompt, sentenceSpans };
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
  const lang = LANGUAGE_NAMES[entry.targetLanguage ?? 'en'];
  return `You are a friendly ${lang} conversation partner.
The user wrote this diary entry today: "${entry.targetText}"
Rules:
- Respond only in ${lang}
- Keep responses to 2-3 sentences maximum
- Ask one follow-up question per turn
- Gently correct major grammar errors by using the correct form naturally in your response
- Do not use markdown formatting
- If you speak in Korean, stop the conversation and respond by saying, 'You must speak in English.
`;
}

/**
 * 대��� 시작용 메시지를 생성합니다.
 * 이 메시지를 user 역할로 LLM에 보내면 AI가 대화를 시작합니���.
 *
 * @param entry - 대화를 시작할 일기 항목
 * @returns 사용자 역할의 프롬프트 문자열
 *
 * @remarks
 * 실제 사용 흐름:
 * 1. generateFeedback으로 피드백 완료
 * 2. buildConversationMessages(entry, [])로 초기 메시지 배열 생성
 * 3. 시스템 프롬프�� + 이 메시지로 AI의 첫 응답 생성
 */
export function buildConversationStartPrompt(entry: DiaryEntry): string {
  const lang = LANGUAGE_NAMES[entry.targetLanguage ?? 'en'];
  return `Start a conversation with the user about their diary. Ask one natural question in ${lang} based on what they wrote.`;
}

/**
 * 대화 히스토리를 ChatMessage 배열로 변환합니다.
 * LLM API에 전달할 형식으로 메시지를 정렬합니다.
 *
 * @param entry - 대화의 기반이 되는 일기 항목
 * @param history - 기존 대��� 메시지 ��록 (ConversationMessage[])
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
