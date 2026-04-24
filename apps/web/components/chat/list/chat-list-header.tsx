"use client";

import { Button } from "@langjournal/ui/components/button";
import { Input } from "@langjournal/ui/components/input";
import { Typography } from "@langjournal/ui/components/typography";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

export const ChatListHeader = () => {
  return (
    <div className="flex items-center justify-between w-full">
      <div>
        <Typography variant="display-md">Chat Sessions</Typography>
        <Typography variant="label-sm" className="text-zinc-500">
          Select a diary entry to start an AI learning conversation.
        </Typography>
      </div>

      <div className="flex gap-1">
        <Input placeholder="Search archive..." className="bg-[#E8E8E4] w-56" />
      </div>
    </div>
  );
};
