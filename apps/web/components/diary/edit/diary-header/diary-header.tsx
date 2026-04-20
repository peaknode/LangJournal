"use client";

import { Controller, useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { Button } from "@langjournal/ui/components/button";
import { DatePicker } from "./date-picker";
import { CalendarIcon } from "lucide-react";
import { Typography } from "@langjournal/ui/components/typography";
import type { DiaryFormValues } from "../diary-form-provider";

export const DiaryHeader = () => {
    const { control, watch } = useFormContext<DiaryFormValues>();
    const date = watch("date");

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
