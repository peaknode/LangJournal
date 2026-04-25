"use client";

import { LayoutSelector } from "@/components/layout-selector/layout-selector";
import { Button } from "@langjournal/ui/components/button";
import { Input } from "@langjournal/ui/components/input";
import { Typography } from "@langjournal/ui/components/typography";
import { Grid, Grid2X2, LayoutGrid, List, ListIcon, PlusIcon, TextAlignJustify } from "lucide-react";
import Link from "next/link";

export const DiaryListHeader = () => {
    return (
        <div className="flex items-center justify-between w-full">
            <div>
                <Typography variant="display-md">Diary Archive</Typography>
                <Typography variant="label-sm" className="text-zinc-500">
                    Capture the electric moments of your creative process.
                </Typography>
            </div>

            <div className="flex gap-1">
                <Input
                    placeholder="Search archive..."
                    className="bg-[#fff] w-56 h-[46px]"
                />
                {/* 보기 타입 변경 */}
                <LayoutSelector />

                <Button
                    style={{
                        boxShadow: "4px 4px 0 rgba(0, 0, 0, 1)",
                    }}
                >
                    <Link
                        href="/diary/create"
                        className="flex items-center w-full h-full justify-center gap-2"
                    >
                        <PlusIcon className="w-4.25 h-4.25" />
                        <Typography variant="body-sm">New Entry</Typography>
                    </Link>
                </Button>
            </div>
        </div>

    )
}
