import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, Users, Clock, Calendar, Timer, Megaphone,
  BarChart3, LogOut, Menu, X, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard, roles: ["admin", "manager"] },
  { href: "/attendance", label: "الحضور", icon: Clock, roles: ["admin", "manager", "employee"] },
  { href: "/employees", label: "الموظفون", icon: Users, roles: ["admin", "manager"] },
  { href: "/leaves", label: "الإجازات", icon: Calendar, roles: ["admin", "manager", "employee"] },
  { href: "/overtime", label: "العمل الإضافي", icon: Timer, roles: ["admin", "manager", "employee"] },
  { href: "/announcements", label: "الإعلانات", icon: Megaphone, roles: ["admin", "manager", "employee"] },
  { href: "/reports", label: "التقارير", icon: BarChart3, roles: ["admin", "manager"] },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { employee, logout } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    fetch("/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
    }).finally(() => logout());
  };

  const visibleItems = navItems.filter(item =>
    employee && item.roles.includes(employee.role)
  );

  const roleLabel = employee?.role === "admin" ? "مسؤول النظام" : employee?.role === "manager" ? "مدير" : "موظف";
  const initials = employee?.name?.split(" ").map(w => w[0]).slice(0, 2).join("") || "م";

  const NavLinks = ({ onClose }: { onClose?: () => void }) => (
    <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
      {visibleItems.map((item) => {
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer select-none ${
              isActive
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/30"
                : "text-slate-400 hover:bg-white/8 hover:text-white"
            }`}
          >
            <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
            <span>{item.label}</span>
            {isActive && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
          </Link>
        );
      })}
    </nav>
  );

  const UserFooter = () => (
    <div className="p-3 border-t border-white/8">
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 mb-1">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center flex-shrink-0 shadow-md">
          <span className="text-white text-sm font-bold">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{employee?.name}</p>
          <p className="text-slate-400 text-xs truncate">{roleLabel}</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 font-medium"
      >
        <LogOut className="w-4 h-4 flex-shrink-0" />
        <span>تسجيل الخروج</span>
      </button>
    </div>
  );

  const SidebarHeader = () => (
    <div className="p-5 border-b border-white/8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-base leading-tight">نظام الحضور</h1>
          <p className="text-slate-400 text-xs">إدارة الموظفين</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0f172a] flex-shrink-0">
        <SidebarHeader />
        <NavLinks />
        <UserFooter />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute right-0 top-0 bottom-0 w-72 bg-[#0f172a] flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold text-sm">نظام الحضور</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavLinks onClose={() => setSidebarOpen(false)} />
            <UserFooter />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-4 md:px-6 py-3 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-slate-500 hover:text-slate-700 transition-colors p-2 rounded-lg hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          {/* Page breadcrumb area */}
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
            <Clock className="w-4 h-4 text-sky-500" />
            <span className="font-medium text-slate-700">نظام إدارة الحضور</span>
          </div>
          <div className="flex items-center gap-2 mr-auto">
            <div className="text-xs text-slate-500 hidden sm:block">
              {new Date().toLocaleDateString("ar-SA", { weekday: "long", month: "long", day: "numeric" })}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
