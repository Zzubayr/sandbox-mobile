"use client";

import type React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Bell,
  Search,
  User,
} from "lucide-react";
import { useSpotlightSearch } from "@/hooks/use-spotlight-search";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import logo from "@/public/logo.svg";
import Image from "next/image";

interface HeaderProps {
  title: string;
  mobileSidebar?: React.ReactNode;
}

export function Header({ mobileSidebar }: HeaderProps) {
  const router = useRouter();
  const { openSearch } = useSpotlightSearch();

  const handleSearchClick = () => {
    openSearch("dashboard");
  };

  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        {mobileSidebar && <div className="md:hidden">{mobileSidebar}</div>}

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 flex items-center justify-center rounded-md">
            {/* <Sparkles className="h-5 w-5 text-white" /> */}
            <Image src={logo} className="" alt="logo" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div
            className="relative hidden sm:block cursor-pointer"
            data-tour="header-search"
            onClick={handleSearchClick}
          >
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search products or request ID... (⌘K)"
              className="w-[150px] pl-8 md:w-[200px] lg:w-[300px] h-9 px-3 py-1 text-sm border border-input bg-background rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={handleSearchClick}
              onFocus={handleSearchClick}
              readOnly
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden min-w-[44px] min-h-[44px]"
            onClick={handleSearchClick}
            data-tour="header-search"
          >
            <Search className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>

          <Button 
            variant="ghost" 
            className="relative h-8 w-8 rounded-full"
            onClick={() => router.push("/dashboard/settings")}
            title="Go to Settings"
          >
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </div>
    </header>
  );
}
