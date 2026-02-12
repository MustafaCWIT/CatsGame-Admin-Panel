'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { UserWithLevel } from '@/types/database';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
    MoreHorizontal,
    Eye,
    Pencil,
    Trash2,
    Mail,
    Phone,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminTracking } from '@/hooks/useClarity';
import { AdminEvents } from '@/lib/clarity';

interface Column {
    key: string;
    label: string;
    sortable?: boolean;
}

const columns: Column[] = [
    { key: 'full_name', label: 'User', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'total_xp', label: 'XP', sortable: true },
    { key: 'level', label: 'Level', sortable: false },
    { key: 'videos_count', label: 'Videos', sortable: true },
    { key: 'updated_at', label: 'Last Updated', sortable: true },
    { key: 'actions', label: '', sortable: false },
];

interface UserTableProps {
    users: UserWithLevel[];
    loading: boolean;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onSort: (column: string) => void;
    onRefresh: () => void;
}

export function UserTable({
    users,
    loading,
    sortBy,
    sortOrder,
    onSort,
    onRefresh,
}: UserTableProps) {
    const router = useRouter();
    const { trackUserAction } = useAdminTracking();
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserWithLevel | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedUsers(users.map((u) => u.id));
        } else {
            setSelectedUsers([]);
        }
    };

    const handleSelectUser = (userId: string, checked: boolean) => {
        if (checked) {
            setSelectedUsers([...selectedUsers, userId]);
        } else {
            setSelectedUsers(selectedUsers.filter((id) => id !== userId));
        }
    };

    const handleDeleteClick = (user: UserWithLevel) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;

        setDeleting(true);
        try {
            const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            trackUserAction(AdminEvents.USER_DELETED, userToDelete.id);
            toast.success('User deleted successfully');
            onRefresh();
        } catch (error) {
            toast.error('Failed to delete user');
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
            setUserToDelete(null);
        }
    };

    const getSortIcon = (column: string) => {
        if (sortBy !== column) {
            return <ArrowUpDown className="w-4 h-4 ml-1 text-white/30" />;
        }
        return sortOrder === 'asc' ? (
            <ArrowUp className="w-4 h-4 ml-1 text-pink-400" />
        ) : (
            <ArrowDown className="w-4 h-4 ml-1 text-pink-400" />
        );
    };

    const getInitials = (name: string | null) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getLevelColor = (level: number) => {
        if (level >= 50) return 'bg-gradient-to-r from-yellow-500 to-amber-500';
        if (level >= 20) return 'bg-gradient-to-r from-purple-500 to-pink-500';
        if (level >= 10) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
        return 'bg-gradient-to-r from-slate-500 to-slate-600';
    };

    const getRoleColor = (role?: string) => {
        switch (role) {
            case 'admin':
                return 'bg-pink-500';
            case 'manager':
                return 'bg-purple-500';
            case 'readonly':
                return 'bg-blue-500';
            default:
                return 'bg-slate-500';
        }
    };

    const getRoleLabel = (role?: string) => {
        switch (role) {
            case 'admin':
                return 'Admin';
            case 'manager':
                return 'Manager';
            case 'readonly':
                return 'Read Only';
            default:
                return 'User';
        }
    };

    const handleBulkDelete = async () => {
        if (selectedUsers.length === 0) return;

        if (!confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)? This action cannot be undone.`)) {
            return;
        }

        setDeleting(true);
        try {
            const deletePromises = selectedUsers.map(userId =>
                fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
            );

            const results = await Promise.allSettled(deletePromises);
            const failed = results.filter(r => r.status === 'rejected').length;

            if (failed === 0) {
                toast.success(`${selectedUsers.length} user(s) deleted successfully`);
                setSelectedUsers([]);
                onRefresh();
            } else {
                toast.error(`Failed to delete ${failed} user(s)`);
            }
        } catch (error) {
            toast.error('Failed to delete users');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return <TableSkeleton />;
    }

    return (
        <>
            {/* Bulk Actions Toolbar */}
            {selectedUsers.length > 0 && (
                <div className="flex items-center justify-between p-4 rounded-xl border border-pink-500/30 bg-pink-500/10 mb-4">
                    <div className="flex items-center gap-3">
                        <span className="text-white font-medium">
                            {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUsers([])}
                            className="border-white/20 text-white/80 hover:bg-white/10"
                        >
                            Clear Selection
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            disabled={deleting}
                            className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Selected
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            <div className="rounded-xl border border-white/10 overflow-hidden bg-white/5">
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/10 hover:bg-white/5">
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={selectedUsers.length === users.length && users.length > 0}
                                    onCheckedChange={handleSelectAll}
                                    className="border-white/30"
                                />
                            </TableHead>
                            {columns.map((column) => (
                                <TableHead
                                    key={column.key}
                                    className={cn(
                                        'text-white/60',
                                        column.sortable && 'cursor-pointer hover:text-white transition-colors'
                                    )}
                                    onClick={() => column.sortable && onSort(column.key)}
                                >
                                    <div className="flex items-center">
                                        {column.label}
                                        {column.sortable && getSortIcon(column.key)}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-32 text-center text-white/40">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow
                                    key={user.id}
                                    className="border-white/10 hover:bg-white/5 transition-colors"
                                >
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedUsers.includes(user.id)}
                                            onCheckedChange={(checked) =>
                                                handleSelectUser(user.id, checked as boolean)
                                            }
                                            className="border-white/30"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10">
                                                <AvatarFallback className="bg-gradient-to-br from-pink-500/30 to-violet-500/30 text-white text-sm">
                                                    {getInitials(user.full_name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-white">
                                                    {user.full_name || 'Unnamed User'}
                                                </p>
                                                <p className="text-xs text-white/40 font-mono">
                                                    {user.id.slice(0, 8)}...
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-white/70">
                                            <Mail className="w-4 h-4 text-white/40" />
                                            {user.email || '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={cn(
                                                'text-white border-0',
                                                getRoleColor((user as any)?.role)
                                            )}
                                        >
                                            {getRoleLabel((user as any)?.role)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-semibold text-white">
                                            {(user.total_xp || 0).toLocaleString()}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={cn('text-white border-0', getLevelColor(user.level))}>
                                            Lv. {user.level}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-white/70">
                                        {user.videos_count || 0}
                                    </TableCell>
                                    <TableCell className="text-white/50 text-sm">
                                        {user.updated_at
                                            ? format(new Date(user.updated_at), 'MMM d, yyyy')
                                            : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 bg-black border-white/10">
                                                <DropdownMenuLabel className="text-white">Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator className="bg-white/10" />
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        trackUserAction(AdminEvents.USER_DETAILS_VIEWED, user.id);
                                                        router.push(`/admin/users/${user.id}`);
                                                    }}
                                                    className="text-white focus:bg-white/10 focus:text-white"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        trackUserAction(AdminEvents.USER_EDIT_STARTED, user.id);
                                                        router.push(`/admin/users/${user.id}/edit`);
                                                    }}
                                                    className="text-white focus:bg-white/10 focus:text-white"
                                                >
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    Edit User
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-white/10" />
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteClick(user)}
                                                    className="text-red-500 focus:text-red-500 focus:bg-white/10"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <strong>{userToDelete?.full_name || 'this user'}</strong>? This action
                            cannot be undone and will permanently remove all user data.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function TableSkeleton() {
    return (
        <div className="rounded-xl border border-white/10 overflow-hidden bg-white/5 p-4">
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full bg-white/10" />
                ))}
            </div>
        </div>
    );
}
