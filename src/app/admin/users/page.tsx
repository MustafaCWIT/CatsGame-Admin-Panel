'use client';

import { useEffect, useState, useCallback } from 'react';
import { UserWithLevel, PaginatedResponse } from '@/types/database';
import { UserTable } from '@/components/admin/UserTable';
import { UserForm } from '@/components/admin/UserForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Plus,
    Search,
    Filter,
    Download,
    RefreshCw,
    X,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

export default function UsersPage() {
    const [users, setUsers] = useState<UserWithLevel[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);

    // Search and filters
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [sortBy, setSortBy] = useState('updated_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [xpMin, setXpMin] = useState('');
    const [xpMax, setXpMax] = useState('');
    const [videosMin, setVideosMin] = useState('');
    const [videosMax, setVideosMax] = useState('');
    const [filtersOpen, setFiltersOpen] = useState(false);

    // User form
    const [formOpen, setFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserWithLevel | undefined>();

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                sortBy,
                sortOrder,
            });

            if (search) params.append('search', search);
            if (xpMin) params.append('xpMin', xpMin);
            if (xpMax) params.append('xpMax', xpMax);
            if (videosMin) params.append('videosMin', videosMin);
            if (videosMax) params.append('videosMax', videosMax);

            const response = await fetch(`/api/admin/users?${params}`);
            if (!response.ok) throw new Error('Failed to fetch users');

            const data: PaginatedResponse<UserWithLevel> = await response.json();
            setUsers(data.data);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, sortBy, sortOrder, xpMin, xpMax, videosMin, videosMax]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchInput]);

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
        setPage(1);
    };

    const handleApplyFilters = () => {
        setPage(1);
        setFiltersOpen(false);
        fetchUsers();
    };

    const handleClearFilters = () => {
        setXpMin('');
        setXpMax('');
        setVideosMin('');
        setVideosMax('');
        setSearch('');
        setSearchInput('');
        setPage(1);
    };

    const handleExportCSV = async () => {
        try {
            // Fetch all users for export
            const params = new URLSearchParams({
                page: '1',
                limit: '10000',
                sortBy,
                sortOrder,
            });

            if (search) params.append('search', search);
            if (xpMin) params.append('xpMin', xpMin);
            if (xpMax) params.append('xpMax', xpMax);

            const response = await fetch(`/api/admin/users?${params}`);
            if (!response.ok) throw new Error('Failed to fetch users');

            const data: PaginatedResponse<UserWithLevel> = await response.json();

            // Generate CSV
            const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Role', 'Total XP', 'Level', 'Videos Count', 'Last Updated'];
            const rows = data.data.map((user) => [
                user.id,
                user.full_name || '',
                user.email || '',
                user.phone || '',
                (user as any)?.role || 'user',
                user.total_xp || 0,
                user.level,
                user.videos_count || 0,
                user.updated_at || '',
            ]);

            const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

            // Download
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success('Export completed');
        } catch (error) {
            toast.error('Failed to export users');
        }
    };

    const hasActiveFilters = xpMin || xpMax || videosMin || videosMax || search;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Users</h1>
                    <p className="text-white/60 mt-1">
                        Manage all registered users ({total.toLocaleString()} total)
                    </p>
                </div>

                <Button
                    onClick={() => {
                        setEditingUser(undefined);
                        setFormOpen(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-1 flex gap-2">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                            placeholder="Search by name, email, or phone..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={hasActiveFilters ? 'border-pink-500/50 text-pink-400' : ''}
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                Filters
                                {hasActiveFilters && (
                                    <span className="ml-2 w-2 h-2 rounded-full bg-pink-500" />
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end">
                            <div className="space-y-4">
                                <div className="font-medium">Filter Users</div>

                                <div className="space-y-2">
                                    <Label>XP Range</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            placeholder="Min"
                                            value={xpMin}
                                            onChange={(e) => setXpMin(e.target.value)}
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Max"
                                            value={xpMax}
                                            onChange={(e) => setXpMax(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Videos Count Range</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            placeholder="Min"
                                            value={videosMin}
                                            onChange={(e) => setVideosMin(e.target.value)}
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Max"
                                            value={videosMax}
                                            onChange={(e) => setVideosMax(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleClearFilters}
                                        className="flex-1"
                                    >
                                        Clear
                                    </Button>
                                    <Button size="sm" onClick={handleApplyFilters} className="flex-1">
                                        Apply
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Button variant="outline" onClick={handleExportCSV}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>

                    <Button variant="ghost" size="icon" onClick={fetchUsers}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Active Filters Display */}


            {/* Users Table */}
            <UserTable
                users={users}
                loading={loading}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                onRefresh={fetchUsers}
            />

            {/* Pagination */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                    <span>Rows per page:</span>
                    <Select
                        value={limit.toString()}
                        onValueChange={(value) => {
                            setLimit(parseInt(value));
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-20 h-8 bg-white/5 border-white/10">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-white/60 text-sm">
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={page >= totalPages}
                            onClick={() => setPage(page + 1)}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* User Form Modal */}
            <UserForm
                user={editingUser}
                open={formOpen}
                onOpenChange={setFormOpen}
                onSuccess={fetchUsers}
            />
        </div>
    );
}

function FilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-sm border border-pink-500/30">
            {label}
            <button
                onClick={onRemove}
                className="ml-1 hover:text-pink-100 transition-colors"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    );
}
