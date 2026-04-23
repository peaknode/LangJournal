"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@langjournal/ui/components/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@langjournal/ui/components/sidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@langjournal/ui/components/button";
import { Typography } from "@langjournal/ui/components/typography";
import { useMemo } from "react";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();
  const isActive = (item) => {
    return pathname.includes(item.url);
  };

  return (
    <SidebarGroup>
      <SidebarMenu className="space-y-3">
        {items.map((item) => (
          <SidebarMenuItem key={item.url}>
            <Link href={item.url}>
              <Button
                variant={isActive(item) ? "default" : "ghost"}
                className="w-full justify-start"
                style={{
                  boxShadow: isActive(item)
                    ? "4px 4px 0 0 rgba(0, 0, 0, 1)"
                    : "none",
                }}
              >
                {item.icon && <item.icon className="size-4" />}
                <Typography variant="label-lg">{item.title}</Typography>
              </Button>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
