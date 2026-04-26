"use client";

import { useEffect, useMemo, useRef } from "react";
import { useInfiniteEntries } from "@/hooks/useInfiniteEntries";
import { groupEntriesByMonth } from "@/lib/date-utils";
import { DiaryListItem, type DiaryListVariant } from "./diary-list-item";
import { DiaryCardItem } from "./diary-card-item";
import { Separator } from "@langjournal/ui/components/separator";
import { Typography } from "@langjournal/ui/components/typography";

interface DiaryListProps {
    variant?: DiaryListVariant;
    layout?: 'list' | 'card';
}

/**
 * 일기 목록을 월별 타임라인으로 렌더링합니다.
 * IntersectionObserver를 활용한 무한스크롤을 지원합니다.
 *
 * @param variant - 항목 클릭 시 이동할 경로 종류 ("diary" | "chat"), 기본값 "diary"
 * @param layout - 레이아웃 방식 ("list" | "card"), 기본값 "list"
 * @returns 월별 그룹핑된 타임라인 또는 카드 그리드
 */
export const DiaryList = ({ variant = "diary", layout = "list" }: DiaryListProps = {}) => {
    const { entries, loading, loadingMore, hasMore, loadMore } =
        useInfiniteEntries();
    const sentinelRef = useRef<HTMLDivElement>(null);

    const groups = useMemo(() => groupEntriesByMonth(entries), [entries]);

    /** IntersectionObserver로 스크롤 하단 감지 */
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (observerEntries) => {
                if (observerEntries[0]?.isIntersecting && hasMore && !loadingMore) {
                    loadMore();
                }
            },
            { rootMargin: "200px" },
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loadingMore, loadMore]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="flex flex-1 w-full flex-col items-center justify-center py-16 text-center">
                <p className="text-zinc-500 font-body">
                    No entries yet. Start writing your first diary!
                </p>
            </div>
        );
    }

    return (
        <div className="w-full py-10.5">
            {layout === 'list' ? (
                // 리스트 레이아웃
                groups.map((group) => (
                    <section key={group.key}>
                        {/* 월 헤더 */}
                        <div className="sticky top-0 z-10 dark:bg-zinc-950/80 backdrop-blur-sm py-3 px-1 flex items-center gap-3">
                            <Typography variant="headline-sm">
                                {group.label}
                            </Typography>

                            <div className="h-px flex-1 bg-zinc-400"></div>
                        </div>

                        <div className="p-4">
                            {/* 해당 월의 일기 항목들 */}
                            {group.entries.map((entry) => (
                                <DiaryListItem
                                    key={entry.id}
                                    entry={entry}
                                    variant={variant}
                                />
                            ))}
                        </div>
                    </section>
                ))
            ) : (
                // 카드 레이아웃
                groups.map((group) => (
                    <section key={group.key}>
                        {/* 월 헤더 */}
                        <div className="sticky top-0 z-10 dark:bg-zinc-950/80 backdrop-blur-sm py-3 px-1 flex items-center gap-3">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                                {group.label}
                            </h2>
                            <div className="h-px flex-1 bg-zinc-400"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                            {/* 해당 월의 일기 카드 */}
                            {group.entries.map((entry) => (
                                <DiaryCardItem
                                    key={entry.id}
                                    entry={entry}
                                    variant={variant}
                                />
                            ))}
                        </div>
                    </section>
                ))
            )}

            {/* 무한스크롤 센티넬 */}
            <div ref={sentinelRef} className="h-1" />

            {loadingMore && (
                <div className="flex justify-center py-6">
                    <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                </div>
            )}

            {!hasMore && entries.length > 0 && (
                <p className="text-center text-xs text-zinc-400 py-6 font-label">
                    All entries loaded
                </p>
            )}
        </div>
    );
};
