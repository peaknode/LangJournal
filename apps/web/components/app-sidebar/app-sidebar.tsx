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
  PieChart,
  SquareTerminal,
} from "lucide-react";
import { NavMain } from "./nav-main";
// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Archives",
          url: "/diary",
        },
        {
          title: "Chat",
          url: "/chat",
        },
        {
          title: "Conversation",
          url: "/conversation",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
};

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" className="bg-[#FDFCF8]">
      <SidebarHeader></SidebarHeader>
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
