/**
 * 저장소 추상 인터페이스 모듈
 * 플랫폼(웹/데스크탑/모바일)에 무관한 데이터 접근 계약을 정의합니다.
 *
 * @module db/repository
 */

import type {
  DiaryEntry,
  VocabItem,
  ConversationMessage,
  ConversationSession,
  FeedbackRecord,
  Language,
  Mood,
} from './schema.js';

/**
 * 페이지네이션 옵션
 * 대량 조회 시 쿼리 결과를 제한하기 위한 파라미터입니다.
 */
export interface PaginationOptions {
  /** 조회할 항목의 최대 개수 */
  limit: number;
  /** 건너뛸 항목의 개수 (0부터 시작) */
  offset: number;
}

/**
 * 일기 조회 필터
 * 일기 목록을 특정 조건으로 필터링합니다.
 */
export interface EntryFilter {
  /** 특정 언어로만 필터 (선택사항) */
  targetLanguage?: Language;
  /** 시작 날짜 범위 ('YYYY-MM-DD' 형식, 선택사항) */
  from?: string;
  /** 종료 날짜 범위 ('YYYY-MM-DD' 형식, 선택사항) */
  to?: string;
  /** AI 피드백 여부로 필터 (true: 피드백 있는 것만, false: 없는 것만) */
  hasFeedback?: boolean;
}

/**
 * 일기 저장소 인터페이스
 * 일기 엔티티의 CRUD 작업을 정의합니다.
 * 구현은 플랫폼별로 제공됩니다 (Dexie for web, MMKV for mobile 등).
 */
export interface IEntryRepository {
  /**
   * 새 일기를 생성합니다.
   *
   * @param entry - 생성할 일기 항목
   * @returns 저장된 일기 (변경사항 포함)
   * @throws 저장 실패 시
   */
  create(entry: DiaryEntry): Promise<DiaryEntry>;

  /**
   * 일기를 부분 수정합니다.
   * 불변 필드(id, createdAt)는 수정되지 않습니다.
   *
   * @param id - 수정할 일기의 ID
   * @param patch - 수정할 필드들 (선택사항)
   * @returns 수정된 일기 전체
   * @throws 일기를 찾을 수 없거나 저장 실패 시
   */
  update(
    id: string,
    patch: Partial<Omit<DiaryEntry, 'id' | 'createdAt'>>
  ): Promise<DiaryEntry>;

  /**
   * ID로 일기를 조회합니다.
   *
   * @param id - 조회할 일기의 ID
   * @returns 일기 또는 없으면 undefined
   */
  findById(id: string): Promise<DiaryEntry | undefined>;

  /**
   * 날짜로 일기를 조회합니다.
   * 날짜 별로 최대 하나의 일기만 존재합니다.
   *
   * @param date - 조회할 날짜 ('YYYY-MM-DD' 형식)
   * @returns 일기 또는 없으면 undefined
   */
  findByDate(date: string): Promise<DiaryEntry | undefined>;

  /**
   * 조건에 맞는 일기들을 조회합니다.
   *
   * @param filter - 조회 필터 (선택사항)
   * @param pagination - 페이지네이션 옵션 (선택사항)
   * @returns 일기 배열
   */
  findMany(
    filter?: EntryFilter,
    pagination?: PaginationOptions
  ): Promise<DiaryEntry[]>;

  /**
   * 일기를 삭제합니다.
   *
   * @param id - 삭제할 일기의 ID
   * @throws 일기를 찾을 수 없을 때
   */
  delete(id: string): Promise<void>;

  /**
   * 특정 일기에 AI 피드백을 저장합니다.
   * 이 메서드는 update와 분리되어 있으며, 피드백 생성 완료 후 호출됩니다.
   *
   * @param entryId - 대상 일기의 ID
   * @param feedback - 저장할 피드백
   * @returns 피드백이 추가된 일기 전체
   * @throws 일기를 찾을 수 없거나 저장 실패 시
   */
  saveFeedback(entryId: string, feedback: FeedbackRecord): Promise<DiaryEntry>;
}

/**
 * 어휘 저장소 인터페이스
 * 학습 어휘의 관리 작업을 정의합니다.
 */
export interface IVocabRepository {
  /**
   * 새 어휘 항목을 추가합니다.
   *
   * @param item - 추가할 어휘 항목
   * @returns 저장된 어휘 (변경사항 포함)
   */
  add(item: VocabItem): Promise<VocabItem>;

  /**
   * 특정 일기에 포함된 어휘를 조회합니다.
   *
   * @param entryId - 일기 ID
   * @returns 해당 일기의 모든 어휘
   */
  findByEntry(entryId: string): Promise<VocabItem[]>;

  /**
   * 특정 언어의 모든 어휘를 조회합니다.
   *
   * @param language - 언어 코드
   * @returns 해당 언어의 모든 어휘
   */
  findByLanguage(language: Language): Promise<VocabItem[]>;

  /**
   * 어휘의 숙련도를 업데이트합니다.
   *
   * @param id - 어휘의 ID
   * @param level - 새로운 숙련도 (0~3)
   */
  updateMastery(id: string, level: VocabItem['masteryLevel']): Promise<void>;

  /**
   * 어휘를 삭제합니다.
   *
   * @param id - 삭제할 어휘의 ID
   */
  delete(id: string): Promise<void>;
}

/**
 * 대화 저장소 인터페이스
 * 대화 세션의 관리 작업을 정의합니다.
 */
export interface IConversationRepository {
  /**
   * 대화 세션을 저장합니다.
   * 기존 세션을 덮어씁니다.
   *
   * @param session - 저장할 대화 세션
   */
  save(session: ConversationSession): Promise<void>;

  /**
   * 특정 일기의 대화 세션을 조회합니다.
   *
   * @param entryId - 일기 ID
   * @returns 대화 세션 또는 없으면 undefined
   */
  findByEntry(entryId: string): Promise<ConversationSession | undefined>;

  /**
   * 대화 세션에 새 메시지를 추가합니다.
   * 세션이 없으면 새로 생성합니다.
   *
   * @param entryId - 일기 ID
   * @param message - 추가할 메시지
   * @returns 업데이트된 세션
   */
  appendMessage(
    entryId: string,
    message: ConversationMessage
  ): Promise<ConversationSession>;

  /**
   * 대화 세션을 삭제합니다.
   *
   * @param entryId - 삭제할 세션의 일기 ID
   */
  delete(entryId: string): Promise<void>;
}
