"use client";

import { useEffect } from "react";
import { useLLM } from "../../hooks/useLLM";

/**
 * LLM 초기화 상태를 표시하는 컴포넌트
 *
 * 마운트 시 WebLLM 엔진을 Web Worker에서 초기화합니다.
 * WebGPU 미지원 시 에러 메시지를 표시합니다.
 */
export const LlmSelector = () => {
  const { status, initialize } = useLLM();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (status === "error") {
    return (
      <div>
        <p className="text-center text-xl text-white mt-2">
          WebGPU is not supported in your browser.
        </p>
        <div className="flex justify-center mt-6">
          <a
            href="https://caniuse.com/webgpu"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-white hover:bg-gray-700 transition-colors"
          >
            Check WebGPU browser support
          </a>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div>
        <p className="text-center text-xl text-white mt-2">
          Loading AI model...
        </p>
      </div>
    );
  }

  if (status === "ready") {
    return (
      <div>
        <p className="text-center text-xl text-white mt-2">
          WebGPU is supported in your browser!
        </p>
      </div>
    );
  }

  return null;
};
