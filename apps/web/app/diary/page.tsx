import { DiaryList } from "@/components/diary/diary-list";
import { Button } from "@langjournal/ui/components/button";
import { Typography } from "@langjournal/ui/components/typography";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

export default function Diary() {
  return (
    <>
      <div className="flex items-center justify-between w-full">
        <Typography variant="display-lg" className="mb-4">
          Diary Page
        </Typography>

        <Button>
          <PlusIcon className="mr-2" />
          {/* 실제 db 에 id 생성 값으로 연동할 것 */}
          <Link href="/diary/create">New Entry</Link>
        </Button>
      </div>

      <DiaryList
        entries={[
          {
            id: "1",
            title: "My First Diary Entry",
            targetText: "Today I started my language learning journey!",
            date: "2026-04-19",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ]}
      />
    </>
    // </main>
  );
}
