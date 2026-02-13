'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { UserWithLevel } from '@/types/database';
import { UserForm } from '@/components/admin/UserForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft } from 'lucide-react';

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [user, setUser] = useState<UserWithLevel | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUser() {
            try {
                const response = await fetch(`/api/admin/users/${id}`);
                if (!response.ok) throw new Error('User not found');
                const data = await response.json();
                setUser(data);
            } catch (err) {
                // Error handled in UserForm or shown via toast
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, [id]);

    if (loading) return <EditSkeleton />;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="text-white/60 hover:text-white"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Edit User</h1>
                    <p className="text-white/60 mt-1">Update profile and level information for {user?.phone || 'user'}</p>
                </div>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-8 shadow-2xl backdrop-blur-sm">
                <UserForm
                    user={user || undefined}
                    open={true}
                    onOpenChange={(open) => !open && router.back()}
                    onSuccess={() => {
                        router.push(`/admin/users/${id}`);
                        router.refresh();
                    }}
                />
            </div>
        </div>
    );
}

function EditSkeleton() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
            <div className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full bg-white/5" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48 bg-white/5" />
                    <Skeleton className="h-4 w-64 bg-white/5" />
                </div>
            </div>
            <Skeleton className="h-[600px] rounded-2xl bg-white/5" />
        </div>
    );
}
