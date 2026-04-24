"use client";

import { DiaryList } from "@/components/diary/diary-list";
import { DiaryListHeader } from "@/components/diary/list";

export default function Diary() {
  return (
    <div className="p-12">
      <DiaryListHeader />
      <DiaryList />
    </div>
  );
}
