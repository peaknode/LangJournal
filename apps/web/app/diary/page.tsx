"use client";

import { DiaryList } from "@/components/diary/diary-list";
import { DiaryListHeader } from "@/components/diary/list";
import { Button } from "@langjournal/ui/components/button";
import { Input } from "@langjournal/ui/components/input";
import { Typography } from "@langjournal/ui/components/typography";
import { FilterIcon, PlusIcon } from "lucide-react";
import Link from "next/link";

export default function Diary() {
  return (
    <div className="p-12">
      <DiaryListHeader />
      <DiaryList />
    </div>
  );
}
