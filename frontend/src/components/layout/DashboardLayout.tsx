import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  PhoneCall,
  BadgeDollarSign,
  FileText,
  BrainCircuit,
  MessageSquare,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, lazy, Suspense } from "react";
import { useLogout, useListNotifications, useMarkAllNotificationsRead } from "@/api";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

const InteractiveBackground = lazy(() =>
  import("@/components/3d/InteractiveBackground").then((m) => ({ default: m.InteractiveBackground })),
);

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const logoutMutation = useLogout();

  const { data: notifications } = useListNotifications();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => logout(),
    });
  };

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["admin", "client"] },
    { href: "/clients", label: "Clients", icon: Users, roles: ["admin"] },
    { href: "/campaigns", label: "Campaigns", icon: Megaphone, roles: ["admin", "client"] },
    { href: "/facebook-ads", label: "Facebook Ads", icon: Megaphone, roles: ["admin", "client"] },
    { href: "/setters", label: "Setters", icon: PhoneCall, roles: ["admin", "setter"] },
    { href: "/closers", label: "Closers", icon: BadgeDollarSign, roles: ["admin", "closer"] },
    { href: "/reports", label: "Reports", icon: FileText, roles: ["admin", "client"] },
    { href: "/ai-insights", label: "AI Insights", icon: BrainCircuit, roles: ["admin", "client"] },
    { href: "/slack", label: "Slack Log", icon: MessageSquare, roles: ["admin"] },
    { href: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
  ];

  const visibleNavItems = navItems.filter((item) => user?.role && item.roles.includes(user.role));
  const isAdmin = user?.role === "admin";
  const currentPage = navItems.find((i) => i.href === location)?.label || "AgencyOS";
  const showInteractiveBg = location !== "/dashboard";

  useEffect(() => {
    if (!isMobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isMobileOpen]);

  const NavLink = ({ item, onClick }: { item: (typeof navItems)[0]; onClick?: () => void }) => {
    const isActive = location === item.href;
    return (
      <Link href={item.href}>
        <div
          onClick={onClick}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ${
            isActive
              ? "bg-[#E87722]/15 text-[#FFB366] border border-[#E87722]/30 shadow-[0_0_20px_rgba(232,119,34,0.15)]"
              : "text-[#B9BDC5] hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <item.icon className={`w-[18px] h-[18px] ${isActive ? "text-[#E87722]" : ""}`} strokeWidth={1.75} />
          <span className="font-medium text-sm">{item.label}</span>
          {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E87722] shadow-[0_0_8px_#E87722]" />}
        </div>
      </Link>
    );
  };

  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E87722] to-[#F97316] flex items-center justify-center font-bold text-white shadow-[0_0_24px_rgba(232,119,34,0.35)]">
          A
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-white block leading-tight">AgencyOS</span>
          <span className="text-[10px] text-[#B9BDC5] uppercase tracking-widest">Command Center</span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto pb-4">
        {visibleNavItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={onNavClick} />
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-white/8">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-white/5 transition-colors duration-300">
              <Avatar className="h-9 w-9 border border-[#E87722]/30">
                <AvatarImage src={user?.avatarUrl || ""} />
                <AvatarFallback className="bg-[#22262B] text-[#FFB366] text-xs">
                  {user?.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-[#B9BDC5] truncate capitalize">{user?.role}</p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 glass-dialog" align="end" sideOffset={10}>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => isAdmin && setLocation("/settings")}
              className={`cursor-pointer ${!isAdmin ? "opacity-50 pointer-events-none" : ""}`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-ivory text-foreground overflow-hidden font-sans">
      <aside className="hidden md:flex flex-col w-[17rem] bg-[#111315] border-r border-white/8 z-20 shrink-0">
        <SidebarContent />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-ivory relative">
        {showInteractiveBg && (
          <Suspense fallback={null}>
            <InteractiveBackground />
          </Suspense>
        )}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(232,119,34,0.04)_0%,_transparent_50%)] pointer-events-none" />

        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 glass-nav z-10 sticky top-0">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden shrink-0"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <p className="text-[10px] text-[#7A7A7A] uppercase tracking-wider hidden sm:block">Workspace</p>
              <h1 className="text-lg font-semibold tracking-tight text-[#0A0A0A] truncate">{currentPage}</h1>
            </div>
            <div className="hidden lg:flex items-center flex-1 max-w-sm ml-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7A7A]" />
                <Input
                  placeholder="Search campaigns, clients…"
                  className="pl-9 h-9 bg-white/70 border-[#E8E2D8] rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-[#F2ECE3] transition-colors duration-300">
                <Bell className="w-[18px] h-[18px] text-[#5B5B5B]" strokeWidth={1.75} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#E87722] rounded-full shadow-[0_0_8px_#E87722]" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 glass-dialog" align="end">
              <div className="flex items-center justify-between p-4 border-b border-[#E8E2D8]">
                <h4 className="font-semibold text-sm">Notifications</h4>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-1 text-xs text-[#E87722]"
                    onClick={() => markAllRead.mutate(undefined)}
                  >
                    Mark all read
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[300px]">
                {notifications?.length === 0 ? (
                  <div className="p-4 text-center text-sm text-[#7A7A7A]">No notifications</div>
                ) : (
                  <div className="divide-y divide-[#E8E2D8]">
                    {notifications?.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 transition-colors duration-200 hover:bg-[#F7F4EF] ${!notif.isRead ? "bg-[#E87722]/5" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-none mb-1">{notif.title}</p>
                          {!notif.isRead && <span className="w-2 h-2 rounded-full bg-[#E87722] shrink-0 mt-1" />}
                        </div>
                        <p className="text-xs text-[#7A7A7A] line-clamp-2">{notif.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 z-[1] relative min-h-0 bg-transparent">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="h-full min-h-[calc(100vh-4rem)] relative page-enter"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.32 }}
              className="fixed inset-y-0 left-0 w-[17rem] bg-[#111315] border-r border-white/8 z-50 flex flex-col shadow-2xl md:hidden"
            >
              <div className="absolute top-4 right-4">
                <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)} className="text-white hover:bg-white/10" aria-label="Close menu">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <SidebarContent onNavClick={() => setIsMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
