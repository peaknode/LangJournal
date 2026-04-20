"use client";

import { createPortal } from 'react-dom';
import type { Correction, Suggestion } from '@langjournal/core';
import type { TooltipState } from '../types.js';

interface FeedbackTooltipProps {
    /** 표시할 툴팁 상태. null이면 렌더링하지 않습니다. */
    tooltip: TooltipState | null;
    /** 마우스가 툴팁 영역에 진입할 때 호출 — 디바운스 타이머를 취소합니다. */
    onMouseEnter: () => void;
    /** 마우스가 툴팁 영역을 벗어날 때 호출 — 디바운스 타이머를 시작합니다. */
    onMouseLeave: () => void;
}

/**
 * AI 피드백 툴팁 컴포넌트.
 * React Portal을 사용해 document.body에 렌더링하므로 z-index 문제가 없습니다.
 *
 * correction 타입: 교정된 표현과 한국어 설명을 표시합니다.
 * suggestion 타입: 더 나은 표현과 그 이유를 표시합니다.
 */
export function FeedbackTooltip({
    tooltip,
    onMouseEnter,
    onMouseLeave,
}: FeedbackTooltipProps) {
    if (!tooltip) return null;

    // 툴팁을 underline 아래에 배치합니다
    const style: React.CSSProperties = {
        position: 'fixed',
        top: tooltip.rect.bottom + 6,
        left: tooltip.rect.left,
        zIndex: 9999,
        maxWidth: 320,
        background: '#1e1e2e',
        color: '#cdd6f4',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        fontSize: 14,
        lineHeight: 1.5,
        pointerEvents: 'auto',
    };

    return createPortal(
        <div style={style} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            {tooltip.type === 'correction' ? (
                <CorrectionContent data={tooltip.data} />
            ) : (
                <SuggestionContent data={tooltip.data} />
            )}
        </div>,
        document.body,
    );
}

function CorrectionContent({ data }: { data: Correction }) {
    return (
        <>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#f38ba8' }}>
                ✓ {data.corrected}
            </div>
            <div style={{ color: '#a6adc8', fontSize: 13 }}>{data.explanation}</div>
        </>
    );
}

function SuggestionContent({ data }: { data: Suggestion }) {
    return (
        <>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#a6e3a1' }}>
                💡 {data.better}
            </div>
            <div style={{ color: '#a6adc8', fontSize: 13 }}>{data.reason}</div>
        </>
    );
}
