"use client";

import { Controller, useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { Button } from "@langjournal/ui/components/button";
import { DatePicker } from "./date-picker";
import { MoodPicker } from "./mood-picker";
import { CalendarIcon } from "lucide-react";
import { Typography } from "@langjournal/ui/components/typography";
import { getMoodEmoji } from "@/lib/mood-utils";
import type { DiaryFormValues } from "../diary-form-provider";

export const DiaryHeader = () => {
  const { control, watch } = useFormContext<DiaryFormValues>();
  const date = watch("date");
  const mood = watch("mood");

  return (
    <div>
      <div className="flex items-center gap-4">
        {/* 캘린더 */}
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <DatePicker
              onChange={field.onChange}
              value={field.value}
              ButtonComponent={
                <Button className="bg-[#D4BBFF] rounded-full w-10 h-10 flex items-center justify-center">
                  <CalendarIcon className="size-4 text-[#66518C]" />
                </Button>
              }
            />
          )}
        />

        {/* 기분 */}
        <MoodPicker
          ButtonComponent={
            <Button
              className="rounded-full flex items-center justify-center bg-transparent p-0"
              aria-label="기분 선택"
            >
              {mood ? (
                <span className="text-lg leading-none flex gap-1 items-center">
                  {getMoodEmoji(mood)}
                  <Typography>{mood?.toUpperCase()}</Typography>
                </span>
              ) : (
                <Typography>⛅️ How are you feeling?</Typography>
              )}
            </Button>
          }
        />

        <div>
          <Typography variant="body-md">
            {format(date, "MMM dd, yyyy").toUpperCase()}
          </Typography>

          <Typography variant="body-md" className="text-zinc-500">
            LOCATION
          </Typography>
        </div>
      </div>
    </div>
  );
};
