import { Link, useLocation, useRoute } from "wouter";
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
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLogout, useListNotifications, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const logoutMutation = useLogout();
  
  const { data: notifications } = useListNotifications();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => logout()
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

  const visibleNavItems = navItems.filter(item => user?.role && item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-gray-100 overflow-hidden font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0d0d14]/80 backdrop-blur-xl border-r border-indigo-500/10 z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            A
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">AgencyOS</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4">
          {visibleNavItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
                    isActive
                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]"
                      : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-indigo-400" : "text-gray-500 group-hover:text-gray-300"}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 w-1 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
                <Avatar className="h-9 w-9 border border-indigo-500/30">
                  <AvatarImage src={user?.avatarUrl || ""} />
                  <AvatarFallback className="bg-indigo-950 text-indigo-200">{user?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-[#13131a] border-indigo-500/20 text-gray-200" align="end" sideOffset={10}>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={() => setLocation("/settings")} className="hover:bg-white/5 focus:bg-white/5 cursor-pointer">
                <Settings className="w-4 h-4 mr-2 text-gray-400" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-400 cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0a0a0f] relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#0a0a0f] to-[#0a0a0f] pointer-events-none" />
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-white/5 backdrop-blur-md bg-[#0a0a0f]/50 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden text-gray-400 hover:text-white" onClick={() => setIsMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold tracking-tight hidden sm:block">
              {navItems.find(i => i.href === location)?.label || "AgencyOS"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white hover:bg-white/5">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,1)]" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-[#13131a] border-indigo-500/20 text-gray-200" align="end">
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                  <h4 className="font-semibold text-sm">Notifications</h4>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs text-indigo-400 hover:text-indigo-300" onClick={() => markAllRead.mutate(undefined)}>
                      Mark all read
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[300px]">
                  {notifications?.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {notifications?.map(notif => (
                        <div key={notif.id} className={`p-4 transition-colors hover:bg-white/5 ${!notif.isRead ? 'bg-indigo-500/5' : ''}`}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium leading-none mb-1 text-gray-200">{notif.title}</p>
                            {!notif.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1" />}
                          </div>
                          <p className="text-xs text-gray-400 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-gray-500 mt-2">{new Date(notif.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 z-0 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-64 bg-[#0d0d14] border-r border-indigo-500/20 z-50 flex flex-col shadow-2xl md:hidden"
            >
              <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white">
                  A
                </div>
                <span className="text-xl font-bold tracking-tight">AgencyOS</span>
              </div>
              <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {visibleNavItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg ${
                          isActive
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            : "text-gray-400"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
