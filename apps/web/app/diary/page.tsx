"use client";

import { DiaryList } from "@/components/diary/diary-list";
import { Button } from "@langjournal/ui/components/button";
import { Input } from "@langjournal/ui/components/input";
import { Typography } from "@langjournal/ui/components/typography";
import { FilterIcon, PlusIcon } from "lucide-react";
import Link from "next/link";

export default function Diary() {
  return (
    <>
      <div className="flex items-center justify-between w-full">
        <div>
          <Typography variant="display-md">Diary Archive</Typography>

          <Typography variant="label-sm" className="text-zinc-500">
            Capture the electric moments of your creative process.
          </Typography>
        </div>

        <div className="flex gap-1 items-center">
          <Input
            placeholder="Search archive..."
            className="bg-[#E8E8E4] w-56"
          />
          <Button className="bg-[#E8E8E4] hover:bg-[#E8E8E4]/90">
            <FilterIcon className="w-4.25 h-4.25" />
          </Button>
        </div>
      </div>

      <DiaryList />

      <Button
        className="w-16 h-16 rounded-full fixed bottom-6 right-6 flex items-center justify-center"
        style={{
          boxShadow: "4px 4px 0  rgba(0, 0, 0, 1)",
        }}
      >
        <Link
          href="/diary/create"
          className="flex items-center w-full h-full justify-center"
        >
          <PlusIcon className="w-4.25 h-4.25" />
        </Link>
      </Button>
    </>
  );
}
