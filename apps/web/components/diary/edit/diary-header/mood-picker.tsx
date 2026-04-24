"use client";

import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@langjournal/ui/components/popover";
import { cn } from "@langjournal/ui/lib/utils";
import { MOOD_OPTIONS } from "@/lib/mood-utils";
import type { DiaryFormValues } from "../diary-form-provider";
import { ArrowDown } from "lucide-react";

interface Props {
  ButtonComponent: React.ReactNode;
}

/**
 * 일기 작성자의 기분을 선택하는 Popover입니다.
 * DiaryFormProvider 하위에서 사용되며, form의 mood 필드와 연동됩니다.
 * 이미 선택된 chip을 다시 누르면 선택이 해제되어 mood가 undefined로 저장됩니다.
 */
export function MoodPicker({ ButtonComponent }: Props) {
  const { control, watch } = useFormContext<DiaryFormValues>();
  const [open, setOpen] = React.useState(false);

  const mood = watch("mood");

  return (
    <Controller
      control={control}
      name="mood"
      render={({ field }) => (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            className={cn(
              mood
                ? "bg-primary-container"
                : "bg-[#E8E8E4] border border-[#E3E3DE]",
              "flex gap-0.5 items-center rounded-full px-4",
            )}
          >
            <>
              {ButtonComponent}
              <ArrowDown
                className={cn(open ? "rotate-180" : "rotate-0", "w-4")}
              />
            </>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex flex-col gap-1">
              {MOOD_OPTIONS.map((option) => {
                const selected = field.value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      field.onChange(selected ? undefined : option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-0.5 rounded-xl px-3 py-2 text-xs transition-colors",
                      "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                      selected && "bg-[#D4BBFF] hover:bg-[#D4BBFF]",
                    )}
                    aria-pressed={selected}
                  >
                    <span className="text-xl leading-none">{option.emoji}</span>
                    <span className="text-[11px] text-zinc-700 dark:text-zinc-200">
                      {option.label.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}
    />
  );
}
