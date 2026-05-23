import React from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "./Navbar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart,
  Upload,
  Target,
  FolderOpen,
  Archive,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Manage Exams", href: "/admin/exams", icon: FileText },
    { name: "Upload PDF", href: "/admin/upload", icon: Upload },
    { name: "Topic Mocks", href: "/admin/topic-mocks", icon: Target },
    { name: "Resources", href: "/admin/resources", icon: FolderOpen },
    { name: "Previous Papers", href: "/admin/previous-papers", icon: Archive },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart },
  ];

  const isExactActive = (href: string) => {
    if (href === "/admin") return location === "/admin";
    return location.startsWith(href);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 mt-6 mb-6">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
          <ScrollArea className="h-full py-6 pr-6 lg:py-8">
            <h4 className="mb-1 rounded-md px-2 py-1 text-sm font-semibold">
              Admin Panel
            </h4>
            <div className="w-full flex flex-col gap-1 mt-2">
              {navigation.map((item) => (
                <Button
                  key={item.href}
                  variant={isExactActive(item.href) ? "secondary" : "ghost"}
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
