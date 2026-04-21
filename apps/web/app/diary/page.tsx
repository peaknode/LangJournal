"use client";

import { DiaryList } from "@/components/diary/diary-list";
import { Button } from "@langjournal/ui/components/button";
import { Typography } from "@langjournal/ui/components/typography";
import { PlusIcon } from "lucide-react";
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

        <Button>
          <PlusIcon className="mr-2" />
          <Link href="/diary/create">New Entry</Link>
        </Button>
      </div>

      <DiaryList />
    </>
  );
}
