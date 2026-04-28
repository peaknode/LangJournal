"use client";

import { Button } from "@langjournal/ui/components/button";
import { Typography } from "@langjournal/ui/components/typography";
import { useToday } from "@/hooks/useToday";
import { getMoodEmoji } from "@/lib/mood-utils";
import Link from "next/link";
import { ArrowRight, BookOpen, MessageCircle } from "lucide-react";

/**
 * 홈 페이지 - 오늘의 일기 및 빠른 접근 메뉴
 */
export default function Home() {
  const { todayEntry } = useToday();

  return (
    <main className="w-full h-full flex flex-col p-12">
      <div className="space-y-10">
        {/* 인사말 */}
        <div>
          <Typography variant="display-lg" className="mb-2">
            Welcome back! 👋
          </Typography>
          <Typography variant="label-md" className="text-zinc-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Typography>
        </div>

        {/* 오늘의 일기 섹션 */}
        {todayEntry ? (
          <div className="bg-white rounded-lg border border-zinc-200 p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="headline-md">Today's Entry</Typography>
                <Typography variant="body-sm" className="text-zinc-500 mt-1">
                  You've written {todayEntry.targetText.length} characters
                </Typography>
              </div>
              {todayEntry.mood && (
                <span className="text-4xl">{getMoodEmoji(todayEntry.mood)}</span>
              )}
            </div>

            <p className="text-sm text-zinc-600 leading-relaxed line-clamp-3">
              {todayEntry.targetText}
            </p>

            <div className="flex gap-3 pt-2">
              <Link href={`/diary/${todayEntry.id}`} className="flex-1">
                <Button variant="default" className="w-full">
                  Continue Writing
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              {!todayEntry.feedback && (
                <Link href={`/diary/${todayEntry.id}#feedback`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    Get Feedback
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-50 rounded-lg border border-zinc-200 p-8 text-center space-y-4">
            <BookOpen className="w-12 h-12 text-zinc-400 mx-auto" />
            <div>
              <Typography variant="headline-md">Start Your Day with Writing</Typography>
              <Typography variant="body-sm" className="text-zinc-500 mt-1">
                Begin your language learning journey by writing today's diary
              </Typography>
            </div>
            <Link href="/diary/create">
              <Button>Write Your First Entry</Button>
            </Link>
          </div>
        )}

        {/* 빠른 접근 메뉴 */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/diary">
            <div className="bg-white rounded-lg border border-zinc-200 p-6 hover:shadow-md transition-shadow cursor-pointer h-full">
              <BookOpen className="w-8 h-8 text-blue-600 mb-3" />
              <Typography variant="headline-sm">Archives</Typography>
              <Typography variant="body-sm" className="text-zinc-500 mt-1">
                Browse all your diary entries
              </Typography>
            </div>
          </Link>

          <Link href="/chat">
            <div className="bg-white rounded-lg border border-zinc-200 p-6 hover:shadow-md transition-shadow cursor-pointer h-full">
              <MessageCircle className="w-8 h-8 text-green-600 mb-3" />
              <Typography variant="headline-sm">Chat & Practice</Typography>
              <Typography variant="body-sm" className="text-zinc-500 mt-1">
                Speak with your AI coach
              </Typography>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
