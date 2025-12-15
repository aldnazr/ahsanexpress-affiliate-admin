"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { VariantProps } from "class-variance-authority";
import { SidebarMenuButton, sidebarMenuButtonVariants } from "./ui/sidebar";

export function ModeToggle({
  variant = "outline",
  size = "lgWrap",
}: VariantProps<typeof sidebarMenuButtonVariants>) {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          variant={variant}
          size={size}
          className="cursor-pointer"
          asChild
        >
          <div className="flex w-full pl-3.5 items-center justify-start gap-3 text-muted-foreground">
            <Sun className="dark:hidden" />
            <Moon className="hidden dark:block" />
            <span>Tema</span>
          </div>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
