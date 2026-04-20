"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/core";
import {
    Toolbar,
    ToolbarGroup,
    ToolbarSeparator,
    MarkButton,
    UndoRedoButton,
    type Level,
} from "@langjournal/editor";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@langjournal/ui/components/popover";
import { Button } from "@langjournal/ui/components/button";
import {
    ChevronDownIcon,
    TextIcon,
    Heading1Icon,
    Heading2Icon,
    Heading3Icon,
    Heading4Icon,
    Heading5Icon,
    Heading6Icon,
} from "lucide-react";

/**
 * 현재 활성화된 heading level을 반환합니다.
 * heading이 아니면 null을 반환합니다.
 */
function getActiveHeadingLevel(editor: Editor): Level | null {
    for (let level = 1; level <= 6; level++) {
        if (editor.isActive("heading", { level })) {
            return level as Level;
        }
    }
    return null;
}

const HEADING_OPTIONS: {
    level: Level | null;
    label: string;
    icon: React.ReactNode;
}[] = [
        { level: null, label: "본문", icon: <TextIcon className="size-5" /> },
        { level: 1, label: "제목 1", icon: <Heading1Icon className="size-5" /> },
        { level: 2, label: "제목 2", icon: <Heading2Icon className="size-5" /> },
        { level: 3, label: "제목 3", icon: <Heading3Icon className="size-5" /> },
        { level: 4, label: "제목 4", icon: <Heading4Icon className="size-5" /> },
        { level: 5, label: "제목 5", icon: <Heading5Icon className="size-5" /> },
        { level: 6, label: "제목 6", icon: <Heading6Icon className="size-5" /> },
    ];

/**
 * Heading 선택 Popover 컴포넌트
 */
const HeadingPopover = ({ editor }: { editor: Editor }) => {
    const [open, setOpen] = useState(false);
    const activeLevel = getActiveHeadingLevel(editor);

    const activeOption =
        HEADING_OPTIONS.find((opt) => opt.level === activeLevel) ??
        HEADING_OPTIONS[0];

    const handleSelect = (level: Level | null) => {
        if (level === null) {
            editor.chain().focus().setParagraph().run();
        } else {
            editor.chain().focus().toggleHeading({ level }).run();
        }
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 justify-between hover:bg-transparent data-[state=open]:bg-transparent"
                >
                    <span className="flex items-center gap-1.5">
                        {activeOption.icon}
                        {/* <span className="text-xs">{activeOption.label}</span> */}
                    </span>
                    <ChevronDownIcon className="size-3 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1" align="start">
                <div className="flex flex-col gap-0.5">
                    {HEADING_OPTIONS.map((option) => {
                        const isActive = option.level === activeLevel;
                        return (
                            <Button
                                key={option.level ?? "paragraph"}
                                variant={isActive ? "secondary" : "ghost"}
                                size="sm"
                                className="justify-start gap-2 w-full"
                                onClick={() => handleSelect(option.level)}
                            >
                                {option.icon}
                                <span className="text-xs">{option.label}</span>
                            </Button>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export const MenuBar = ({ editor }: { editor: Editor | null }) => {
    if (!editor) {
        return null;
    }

    return (
        <Toolbar className="flex items-center border-b border-t border-[#71717A]">
            {/* Heading 선택 */}
            <ToolbarGroup>
                <HeadingPopover editor={editor} />
            </ToolbarGroup>

            <ToolbarSeparator />

            {/* 텍스트 서식 (Mark) */}
            <ToolbarGroup>
                <MarkButton editor={editor} type="bold" />
                <MarkButton editor={editor} type="italic" />
                <MarkButton editor={editor} type="strike" />
                {/* <MarkButton editor={editor} type="" */}
                {/* <MarkButton editor={editor} type="code" /> */}
            </ToolbarGroup>

            <ToolbarSeparator />

            {/* Undo / Redo */}
            <ToolbarGroup>
                <UndoRedoButton editor={editor} action="undo" />
                <UndoRedoButton editor={editor} action="redo" />
            </ToolbarGroup>
        </Toolbar>
    );
};
