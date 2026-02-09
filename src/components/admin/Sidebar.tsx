'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Cat,
    LayoutDashboard,
    Users,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    ChevronDown,
} from 'lucide-react';

interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
    },
    {
        title: 'Users',
        href: '/admin/users',
        icon: Users,
    },
    {
        title: 'Analytics',
        href: '/admin/analytics',
        icon: BarChart3,
    },
    {
        title: 'Settings',
        href: '/admin/settings',
        icon: Settings,
    },
];

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
    const pathname = usePathname();

    return (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center border-b border-white/10 px-6">
                <Link href="/admin" className="flex items-center gap-3" onClick={onItemClick}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                        <Cat className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <span className="font-bold text-white text-lg">Tap to Purr</span>
                        <p className="text-xs text-white/50">Admin Panel</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-3 py-4">
                <nav className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/admin' && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onItemClick}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-gradient-to-r from-pink-500/20 to-violet-500/20 text-white border border-pink-500/30'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                )}
                            >
                                <Icon className={cn(
                                    'w-5 h-5',
                                    isActive ? 'text-pink-400' : 'text-white/40'
                                )} />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t border-white/10 p-4">
                <div className="rounded-xl bg-gradient-to-r from-pink-500/10 to-violet-500/10 p-4 border border-pink-500/20">
                    <p className="text-white/80 text-sm font-medium mb-1">Need help?</p>
                    <p className="text-white/50 text-xs mb-3">Check our documentation for guides and tutorials.</p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-pink-500/30 text-pink-400 hover:bg-pink-500/10 hover:text-pink-300"
                    >
                        View Docs
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function Sidebar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-violet-950 to-purple-900 border-b border-white/10 flex items-center justify-between px-4 z-50">
                <Link href="/admin" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center">
                        <Cat className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-white">Tap to Purr</span>
                </Link>

                <div className="flex items-center gap-2">
                    <UserDropdown onLogout={handleLogout} />

                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                                <Menu className="w-5 h-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72 p-0 bg-gradient-to-b from-violet-950 to-purple-900 border-white/10">
                            <SidebarContent onItemClick={() => setMobileOpen(false)} />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-72 flex-col bg-gradient-to-b from-violet-950 to-purple-900 border-r border-white/10 z-40">
                <SidebarContent />
            </aside>

            {/* Desktop Top Bar */}
            <div className="hidden lg:flex fixed top-0 left-72 right-0 h-16 bg-background/80 backdrop-blur-lg border-b z-30 items-center justify-end px-6">
                <UserDropdown onLogout={handleLogout} />
            </div>
        </>
    );
}

function UserDropdown({ onLogout }: { onLogout: () => void }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 hover:bg-white/10">
                    <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-br from-pink-500 to-violet-600 text-white text-sm">
                            AD
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-white/80 text-sm hidden sm:inline">Admin</span>
                    <ChevronDown className="w-4 h-4 text-white/50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/admin/settings">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-500 focus:text-red-500">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
