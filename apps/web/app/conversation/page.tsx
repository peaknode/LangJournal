'use client';

import { Typography } from '@langjournal/ui/components/typography';
import { Button } from '@langjournal/ui/components/button';
import { Input } from '@langjournal/ui/components/input';
import { MessageCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

/**
 * 대화 연습 페이지
 * 사용자가 선택한 주제로 AI와 대화할 수 있습니다.
 */
export default function ConversationPage() {
  const conversationTopics = [
    {
      title: 'Daily Routine',
      description: 'Talk about your typical day and learn vocabulary about daily activities',
      icon: '🌅',
    },
    {
      title: 'Travel & Culture',
      description: 'Discuss travel experiences and cultural differences',
      icon: '✈️',
    },
    {
      title: 'Food & Cooking',
      description: 'Chat about favorite foods, recipes, and dining experiences',
      icon: '🍽️',
    },
    {
      title: 'Work & Career',
      description: 'Explore professional topics and career goals',
      icon: '💼',
    },
    {
      title: 'Hobbies & Interests',
      description: 'Discuss your favorite hobbies and interests',
      icon: '🎨',
    },
    {
      title: 'Movies & Entertainment',
      description: 'Talk about movies, books, music, and entertainment',
      icon: '🎬',
    },
  ];

  return (
    <main className="w-full h-full flex flex-col p-12">
      <div className="space-y-10">
        {/* 헤더 */}
        <div>
          <Typography variant="display-md">Conversation Practice</Typography>
          <Typography variant="label-sm" className="text-zinc-500">
            Start a conversation with your AI coach on any topic
          </Typography>
        </div>

        {/* 검색 */}
        <div className="flex gap-2">
          <Input
            placeholder="Search topics..."
            className="flex-1 bg-white"
          />
          <Button variant="outline">Search</Button>
        </div>

        {/* 주제 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {conversationTopics.map((topic) => (
            <div
              key={topic.title}
              className="bg-white rounded-lg border border-zinc-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-4xl">{topic.icon}</span>
              </div>

              <Typography variant="headline-sm" className="mb-2">
                {topic.title}
              </Typography>

              <Typography variant="body-sm" className="text-zinc-600 mb-4">
                {topic.description}
              </Typography>

              <Link href="/chat" className="w-full">
                <Button variant="outline" className="w-full gap-2">
                  <Sparkles className="w-4 h-4" />
                  Start Conversation
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* 빠른 시작 섹션 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-8 text-center space-y-4">
          <MessageCircle className="w-12 h-12 text-blue-600 mx-auto" />
          <div>
            <Typography variant="headline-md">Start Conversation Right Now</Typography>
            <Typography variant="body-sm" className="text-zinc-600 mt-2">
              Or choose any topic above to begin practicing with your AI coach
            </Typography>
          </div>
          <Link href="/chat">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Begin Free Conversation
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
