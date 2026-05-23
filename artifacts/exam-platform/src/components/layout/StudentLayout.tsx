import React from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "./Navbar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  BookOpen,
  History,
  BarChart2,
  Bookmark,
  Target,
  Archive,
  FolderOpen,
} from "lucide-react";

interface StudentLayoutProps {
  children: React.ReactNode;
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Exams", href: "/exams", icon: BookOpen },
    { name: "Topic Mock Tests", href: "/topic-mocks", icon: Target },
    { name: "Attempts", href: "/attempts", icon: History },
    { name: "Analytics", href: "/analytics", icon: BarChart2 },
    { name: "Bookmarks", href: "/bookmarks", icon: Bookmark },
    { name: "Resources", href: "/resources", icon: FolderOpen },
    { name: "Previous Papers", href: "/previous-papers", icon: Archive },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 mt-6 mb-6">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
          <ScrollArea className="h-full py-6 pr-6 lg:py-8">
            <div className="w-full flex flex-col gap-1">
              {navigation.map((item) => (
                <Button
                  key={item.href}
                  variant={location.startsWith(item.href) ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </aside>
        <main className="flex w-full flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
