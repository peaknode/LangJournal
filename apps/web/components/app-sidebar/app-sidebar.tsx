"use client";

import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
} from "@langjournal/ui/components/sidebar";
import {
    AudioWaveform,
    Command,
    Frame,
    GalleryVerticalEnd,
    House,
    LucidePencilLine,
    MessageCircle,
    MessageSquare,
    MessagesSquare,
    NotebookPen,
    PieChart,
    Speech,
    SquareTerminal,
} from "lucide-react";
import { NavMain } from "./nav-main";
import { Typography } from "@langjournal/ui/components/typography";
import Link from "next/link";

const data = {
    navMain: [
        {
            title: "Home",
            url: "/",
            icon: House
        },
        {
            title: "Archives",
            url: "/diary",
            //   icon: LucidePencilLine,
            icon: NotebookPen
        },
        {
            title: "Chat",
            url: "/chat",
            icon: MessagesSquare,
        },
        {
            title: "Conversation",
            url: "/conversation",
            icon: Speech
        },
    ],
};

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" className="bg-[#FDFCF8]">
            <SidebarHeader>
                <Link href="/">
                    <Typography
                        variant="display-sm"
                        className="text-zinc-900 dark:text-zinc-50"
                    >
                        LangJournal
                    </Typography>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            {/* <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail /> */}
        </Sidebar>
    );
}
