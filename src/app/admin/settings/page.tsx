'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Shield, Users, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { UserWithLevel } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';

interface UserWithRole extends UserWithLevel {
    role?: string;
}

const ROLE_OPTIONS = [
    { value: 'user', label: 'User', color: 'bg-slate-500' },
    { value: 'readonly', label: 'Read Only', color: 'bg-blue-500' },
    { value: 'manager', label: 'Manager', color: 'bg-purple-500' },
    { value: 'admin', label: 'Admin', color: 'bg-pink-500' },
];

export default function SettingsPage() {
    const [users, setUsers] = useState<UserWithRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [updatingRoles, setUpdatingRoles] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/users?limit=1000');
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            setUsers(data.data || []);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setUpdatingRoles(prev => new Set(prev).add(userId));
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update role');
            }

            // Update local state
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === userId ? { ...user, role: newRole } : user
                )
            );

            toast.success('Role updated successfully');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update role');
        } finally {
            setUpdatingRoles(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        }
    };

    const getRoleColor = (role?: string) => {
        const roleOption = ROLE_OPTIONS.find(r => r.value === role);
        return roleOption?.color || 'bg-slate-500';
    };

    const getRoleLabel = (role?: string) => {
        const roleOption = ROLE_OPTIONS.find(r => r.value === role);
        return roleOption?.label || 'User';
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Admin Settings</h1>
                <p className="text-white/60 mt-1">Manage user roles and admin panel access</p>
            </div>

            <div className="grid gap-8">
                {/* Role Management */}
                <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-pink-500" />
                            <CardTitle>User Role Management</CardTitle>
                        </div>
                        <CardDescription className="text-white/40">
                            Grant admin panel access to users with different roles. Admins have full access, Managers can manage users, Read Only can view data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Filters */}
                        <div className="flex gap-4 flex-col sm:flex-row">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <Input
                                    placeholder="Search users by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-white/5 border-white/10"
                                />
                            </div>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
                                    <SelectValue placeholder="Filter by role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    {ROLE_OPTIONS.map(role => (
                                        <SelectItem key={role.value} value={role.value}>
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Users Table */}
                        <div className="rounded-xl border border-white/10 overflow-hidden">
                            {loading ? (
                                <div className="p-4 space-y-3">
                                    {[...Array(5)].map((_, i) => (
                                        <Skeleton key={i} className="h-16 w-full bg-white/10" />
                                    ))}
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-white/10 hover:bg-white/5">
                                            <TableHead className="text-white/60">User</TableHead>
                                            <TableHead className="text-white/60">Email</TableHead>
                                            <TableHead className="text-white/60">Current Role</TableHead>
                                            <TableHead className="text-white/60">Change Role</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-32 text-center text-white/40">
                                                    No users found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredUsers.map((user) => (
                                                <TableRow
                                                    key={user.id}
                                                    className="border-white/10 hover:bg-white/5"
                                                >
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500/30 to-violet-500/30 flex items-center justify-center text-white font-semibold">
                                                                {user.full_name
                                                                    ?.split(' ')
                                                                    .map(n => n[0])
                                                                    .join('')
                                                                    .toUpperCase()
                                                                    .slice(0, 2) || 'U'}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-white">
                                                                    {user.full_name || 'Unnamed User'}
                                                                </p>
                                                                <p className="text-xs text-white/40">
                                                                    {user.id.slice(0, 8)}...
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-white/70">
                                                        {user.email || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            className={`${getRoleColor(user.role)} text-white border-0`}
                                                        >
                                                            {getRoleLabel(user.role)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={user.role || 'user'}
                                                            onValueChange={(value) =>
                                                                handleRoleChange(user.id, value)
                                                            }
                                                            disabled={updatingRoles.has(user.id)}
                                                        >
                                                            <SelectTrigger className="w-[140px] bg-white/5 border-white/10">
                                                                {updatingRoles.has(user.id) ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                        <span>Updating...</span>
                                                                    </div>
                                                                ) : (
                                                                    <SelectValue />
                                                                )}
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {ROLE_OPTIONS.map(role => (
                                                                    <SelectItem key={role.value} value={role.value}>
                                                                        {role.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </div>

                        {/* Role Descriptions */}
                        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
                            <h3 className="text-sm font-semibold text-white mb-3">Role Permissions</h3>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-slate-500 text-white border-0">User</Badge>
                                    </div>
                                    <p className="text-xs text-white/50">Standard user with no admin access</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-blue-500 text-white border-0">Read Only</Badge>
                                    </div>
                                    <p className="text-xs text-white/50">Can view admin panel data but cannot make changes</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-purple-500 text-white border-0">Manager</Badge>
                                    </div>
                                    <p className="text-xs text-white/50">Can manage users and view analytics</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-pink-500 text-white border-0">Admin</Badge>
                                    </div>
                                    <p className="text-xs text-white/50">Full access to all admin panel features</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
