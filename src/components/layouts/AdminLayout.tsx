import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

export function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile Header */}
            <div className="lg:hidden flex h-16 items-center justify-between px-4 border-b bg-background/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="font-bold text-lg">
                    <span className="text-primary">Industry</span>Mentor
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
            </div>

            {/* Sidebar with mobile state */}
            <div className={cn(
                "fixed inset-0 z-40 lg:hidden transition-opacity duration-300",
                sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}>
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            </div>

            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <AdminSidebar />
            </div>

            <main className="lg:pl-0 min-h-screen">
                <div className="lg:pl-64 container mx-auto p-4 lg:p-8 max-w-7xl">
                    <Outlet />
                </div>
            </main>
            <Toaster />
            <Sonner />
        </div>
    );
}
