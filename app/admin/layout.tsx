import type React from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Toaster } from "@/components/ui/sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <Toaster />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
