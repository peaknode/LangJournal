"use client";

import { useEffect, useRef, useState } from "react";
import { useLLM } from "../../hooks/useLLM";
import { useLLMStore } from "../../lib/store";
import { ModelLoading } from "./model-loading";
import {
  buildConversationMessages,
  buildConversationStartPrompt,
} from "@langjournal/core";
import type { ConversationMessage, DiaryEntry } from "@langjournal/core";
import * as webllm from "@mlc-ai/web-llm";

/** 테스트용 고정 일기 항목 */
const TEST_ENTRY: DiaryEntry = {
  id: "test-1",
  date: "2026-04-15",
  targetLanguage: "en",
  nativeText: "오늘 카페에서 친구를 만나 오랜만에 이야기를 나눴다.",
  targetText:
    "Today I meet my friend at a cafe. We talked a long time about our life.",
  mood: "good",
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

type CacheState = "checking" | "cached" | "not-cached";

/**
 * 대화 연습 채팅 UI
 *
 * 캐시 여부를 확인한 뒤 사용자가 직접 모델 로드를 시작합니다.
 * 캐시 없으면 다운로드 안내, 있으면 빠른 시작 버튼을 표시합니다.
 */
export function ChatBox() {
  const { initialize, generate, checkCache, status } = useLLM();
  const { loadProgress, error } = useLLMStore();

  const [cacheState, setCacheState] = useState<CacheState>("checking");
  const [history, setHistory] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const availableModels = webllm.prebuiltAppConfig.model_list.map(
    (m) => m.model_id,
  );

  console.log(availableModels);

  // 마운트 시 캐시 확인만 — 자동 다운로드 없음
  useEffect(() => {
    checkCache().then((cached) =>
      setCacheState(cached ? "cached" : "not-cached"),
    );
  }, [checkCache]);

  // 모델 준비되면 AI가 대화 시작
  useEffect(() => {
    if (status !== "ready" || history.length > 0) return;

    const startConversation = async () => {
      const startMessages = [
        ...buildConversationMessages(TEST_ENTRY, []),
        {
          role: "user" as const,
          content: buildConversationStartPrompt(TEST_ENTRY),
        },
      ];

      let aiResponse = "";
      setStreamingText("");

      await generate(startMessages, (chunk) => {
        aiResponse += chunk;
        setStreamingText(aiResponse);
      });

      setHistory([
        { role: "assistant", content: aiResponse, timestamp: Date.now() },
      ]);
      setStreamingText("");
    };

    startConversation();
  }, [status]);

  // 새 메시지 도착하면 스크롤 아래로
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, streamingText]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || status !== "ready") return;

    const userMessage: ConversationMessage = {
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    const nextHistory = [...history, userMessage];
    setHistory(nextHistory);
    setInput("");

    const messages = buildConversationMessages(TEST_ENTRY, nextHistory);
    let aiResponse = "";
    setStreamingText("");

    await generate(messages, (chunk) => {
      aiResponse += chunk;
      setStreamingText(aiResponse);
    });

    setHistory([
      ...nextHistory,
      { role: "assistant", content: aiResponse, timestamp: Date.now() },
    ]);
    setStreamingText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto border border-gray-700 rounded-xl bg-gray-900 overflow-hidden">
      {/* 일기 요약 헤더 */}
      <div className="px-4 py-3 border-b border-gray-700 bg-gray-800">
        <p className="text-xs text-gray-400">오늘의 일기 기반 대화 연습 (EN)</p>
        <p className="text-sm text-gray-200 mt-0.5 truncate">
          &ldquo;{TEST_ENTRY.targetText}&rdquo;
        </p>
      </div>

      {/* 캐시 확인 중 */}
      {status === "idle" && cacheState === "checking" && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-sm">확인 중...</p>
        </div>
      )}

      {/* 시작 전 — 다운로드 또는 빠른 시작 */}
      {status === "idle" && cacheState !== "checking" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8">
          <div className="text-center space-y-1">
            <p className="text-white text-sm font-medium">
              {cacheState === "cached"
                ? "모델이 캐시에 있어요"
                : "AI 모델이 필요합니다"}
            </p>
            <p className="text-gray-500 text-xs">
              {cacheState === "cached"
                ? "바로 시작할 수 있습니다"
                : "Llama 3.2 3B · 약 1.8GB · 최초 1회만 다운로드"}
            </p>
          </div>

          <button
            onClick={initialize}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {cacheState === "cached" ? "시작하기" : "모델 다운로드 및 시작"}
          </button>
        </div>
      )}

      {/* 다운로드 / 초기화 진행 중 */}
      {status === "loading" && <ModelLoading progress={loadProgress} />}

      {/* 에러 */}
      {status === "error" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <p className="text-red-400 text-sm text-center">
            {error ?? "초기화 중 오류가 발생했습니다."}
          </p>
          <button
            onClick={initialize}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 채팅 */}
      {(status === "ready" || status === "generating") && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {history.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-100"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {streamingText && (
              <div className="flex justify-start">
                <div className="max-w-[75%] px-3 py-2 rounded-xl text-sm leading-relaxed bg-gray-700 text-gray-100">
                  {streamingText}
                  <span className="inline-block w-1.5 h-3.5 bg-gray-400 ml-0.5 animate-pulse align-middle" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="px-4 py-3 border-t border-gray-700 flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요... (Enter로 전송)"
              disabled={status === "generating"}
              rows={1}
              className="flex-1 resize-none bg-gray-800 text-gray-100 text-sm px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 placeholder-gray-500 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={status === "generating" || !input.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              전송
            </button>
          </div>
        </>
      )}
    </div>
  );
}
