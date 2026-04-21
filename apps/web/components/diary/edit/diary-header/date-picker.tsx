"use client";

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";

import { Calendar } from "@langjournal/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@langjournal/ui/components/popover";
import type { DiaryFormValues } from "../diary-form-provider";

interface Props {
  ButtonComponent: React.ReactNode;
  onChange?: (date: Date) => void;
  value?: Date;
}

/**
 * 일기 날짜를 선택하는 캘린더 팝오버입니다.
 * DiaryFormProvider 하위에서 사용되며, form의 date 필드와 연동됩니다.
 */
export function DatePicker({ ButtonComponent, onChange, value }: Props) {
  const { control } = useFormContext<DiaryFormValues>();

  return (
    <Controller
      control={control}
      name="date"
      render={({ field }) => (
        <Popover>
          <PopoverTrigger asChild>{ButtonComponent}</PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value || field.value}
              onSelect={(date) => {
                if (date) {
                  onChange?.(date);
                  field.onChange(date);
                }
              }}
              defaultMonth={value || field.value}
            />
          </PopoverContent>
        </Popover>
      )}
    />
  );
}
