/**
 * 전역 상태 관리 (Zustand)
 *
 * 두 개의 독립적인 저장소:
 * - useLLMStore: WebLLM 엔진과 로딩 상태 (애플리케이션 수명 동안 단일)
 * - useJournalStore: 현재 보고 있는 일기와 모드 (페이지별 상태)
 *
 * @module lib/store
 */

import { create } from 'zustand';
import type { LLMStatus, LLMLoadProgress, AiCoreEngine } from '@langjournal/core';

// ============================================================================
// LLM Store
// ============================================================================

/**
 * WebLLM 엔진 전역 상태
 *
 * 특징:
 * - engine 참조는 worker 초기화 후 Zustand에서 관리 (ref 대신)
 * - status, loadProgress, error는 UI 업데이트 트리거
 * - reset()으로 완전히 초기화 (재로드 시)
 */
interface LLMState {
  /** WebLLM 엔진 인스턴스 (null = 미초기화) */
  engine: AiCoreEngine | null;

  /** 엔진의 현재 상태 */
  status: LLMStatus;

  /** 로딩 중 진행률 (status === 'loading'일 때만 유효) */
  loadProgress: LLMLoadProgress | null;

  /** 에러 메시지 (status === 'error'일 때 값 포함) */
  error: string | null;

  // ========== Actions ==========

  /** 엔진 인스턴스 저장 */
  setEngine: (engine: AiCoreEngine) => void;

  /** 상태 변경 */
  setStatus: (status: LLMStatus) => void;

  /** 진행률 업데이트 */
  setLoadProgress: (progress: LLMLoadProgress) => void;

  /** 에러 메시지 설정 */
  setError: (error: string | null) => void;

  /** 상태 전체 초기화 */
  reset: () => void;
}

/**
 * WebLLM 엔진 전역 저장소
 *
 * @example
 * const { engine, status } = useLLMStore();
 * const { setStatus } = useLLMStore();
 */
export const useLLMStore = create<LLMState>((set) => ({
  engine: null,
  status: 'idle',
  loadProgress: null,
  error: null,

  setEngine: (engine) => set({ engine }),
  setStatus: (status) => set({ status }),
  setLoadProgress: (loadProgress) => set({ loadProgress }),
  setError: (error) => set({ error }),
  reset: () =>
    set({ engine: null, status: 'idle', loadProgress: null, error: null }),
}));

// ============================================================================
// Journal Store
// ============================================================================

/**
 * 일기 관련 UI 상태
 *
 * 특징:
 * - currentEntryId: 현재 보고 있는 일기의 ID (필터링, 대화 세션 기반)
 * - mode: 쓰기/피드백/채팅 모드 전환
 *
 * @remarks
 * LLMStore와 분리된 이유: LLM은 애플리케이션 수명, Journal은 페이지별 상태
 */
interface JournalState {
  /** 현재 선택된 일기의 ID (null = 선택 없음) */
  currentEntryId: string | null;

  /**
   * 현재 모드
   * - 'write': 일기 작성/편집
   * - 'feedback': 피드백 보기
   * - 'chat': 대화 연습
   */
  mode: 'write' | 'feedback' | 'chat';

  // ========== Actions ==========

  /** 현재 일기 변경 */
  setCurrentEntryId: (id: string | null) => void;

  /** 모드 변경 */
  setMode: (mode: JournalState['mode']) => void;
}

/**
 * 일기 UI 상태 저장소
 *
 * @example
 * const { currentEntryId, mode } = useJournalStore();
 * const { setMode } = useJournalStore();
 */
export const useJournalStore = create<JournalState>((set) => ({
  currentEntryId: null,
  mode: 'write',

  setCurrentEntryId: (id) => set({ currentEntryId: id }),
  setMode: (mode) => set({ mode }),
}));
