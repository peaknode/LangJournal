"use client";

import type { LLMLoadProgress } from "@langjournal/core";

interface ModelLoadingProps {
  progress: LLMLoadProgress | null;
}

/**
 * 모델 다운로드/초기화 진행 상태 UI
 */
export function ModelLoading({ progress }: ModelLoadingProps) {
  const pct = progress ? Math.round(progress.progress * 100) : 0;
  const elapsed = progress
    ? progress.timeElapsed < 60000
      ? `${Math.round(progress.timeElapsed / 1000)}s`
      : `${Math.round(progress.timeElapsed / 60000)}m ${Math.round((progress.timeElapsed % 60000) / 1000)}s`
    : null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
      {/* 스피너 */}
      <div className="w-10 h-10 rounded-full border-2 border-gray-700 border-t-blue-500 animate-spin" />

      {/* 제목 */}
      <div className="text-center">
        <p className="text-white text-sm font-medium">AI 모델 로딩 중</p>
        <p className="text-gray-500 text-xs mt-1">처음 실행 시 모델 다운로드가 필요합니다 (~1.8GB)</p>
      </div>

      {/* 프로그레스 바 */}
      <div className="w-full space-y-1.5">
        <div className="flex justify-between text-xs text-gray-400">
          <span>{pct}%</span>
          {elapsed && <span>{elapsed} 경과</span>}
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* 상태 텍스트 */}
      {progress?.text && (
        <p className="text-xs text-gray-500 text-center leading-relaxed max-w-xs truncate">
          {progress.text}
        </p>
      )}

      {/* 완료 임박 메시지 */}
      {pct >= 90 && (
        <p className="text-xs text-blue-400">거의 다 됐어요...</p>
      )}
    </div>
  );
}
