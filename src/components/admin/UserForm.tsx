'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { CreateUserPayload, UpdateUserPayload, UserWithLevel, Activity } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface UserFormProps {
    user?: UserWithLevel;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

interface FormData {
    full_name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    total_xp: number;
    videos_count: number;
    role: string;
}

export function UserForm({ user, open, onOpenChange, onSuccess }: UserFormProps) {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const isEditing = !!user;

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
        setValue,
    } = useForm<FormData>({
        defaultValues: {
            full_name: user?.full_name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            password: '',
            confirmPassword: '',
            total_xp: user?.total_xp || 0,
            videos_count: user?.videos_count || 0,
            role: (user as any)?.role || 'user',
        },
    });

    const password = watch('password');

    const onSubmit = async (data: FormData) => {
        setLoading(true);

        try {
            if (isEditing) {
                // Update user
                const updatePayload: UpdateUserPayload = {
                    full_name: data.full_name,
                    email: data.email,
                    phone: data.phone || undefined,
                    total_xp: data.total_xp,
                    videos_count: data.videos_count,
                    role: data.role,
                };

                const response = await fetch(`/api/admin/users/${user.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatePayload),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to update user');
                }

                toast.success('User updated successfully');
            } else {
                // Create user
                const createPayload: CreateUserPayload = {
                    full_name: data.full_name,
                    email: data.email,
                    phone: data.phone || undefined,
                    password: data.password,
                    total_xp: data.total_xp,
                    videos_count: data.videos_count,
                    role: data.role || 'user',
                };

                const response = await fetch('/api/admin/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(createPayload),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to create user');
                }

                toast.success('User created successfully');
            }

            reset();
            onOpenChange(false);
            onSuccess();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit User' : 'Create New User'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the user details below.'
                            : 'Fill in the details to create a new user account.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name *</Label>
                            <Input
                                id="full_name"
                                placeholder="Enter full name"
                                {...register('full_name', { required: 'Full name is required' })}
                            />
                            {errors.full_name && (
                                <p className="text-sm text-red-500">{errors.full_name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter email"
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Invalid email address',
                                    },
                                })}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                            id="phone"
                            placeholder="Enter phone number"
                            {...register('phone')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Role *</Label>
                        <Select
                            value={watch('role')}
                            onValueChange={(value) => setValue('role', value)}
                        >
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="readonly">Read Only</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.role && (
                            <p className="text-sm text-red-500">{errors.role.message}</p>
                        )}
                    </div>

                    {!isEditing && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="password">Password *</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter password"
                                        className="pr-10"
                                        {...register('password', {
                                            required: !isEditing ? 'Password is required' : false,
                                            minLength: {
                                                value: 8,
                                                message: 'Password must be at least 8 characters',
                                            },
                                        })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-red-500">{errors.password.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Confirm password"
                                        className="pr-10"
                                        {...register('confirmPassword', {
                                            required: !isEditing ? 'Please confirm password' : false,
                                            validate: (value) =>
                                                !password || value === password || 'Passwords do not match',
                                        })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {isEditing && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="total_xp">Total XP</Label>
                                <Input
                                    id="total_xp"
                                    type="number"
                                    min="0"
                                    {...register('total_xp', { valueAsNumber: true })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="videos_count">Videos Count</Label>
                                <Input
                                    id="videos_count"
                                    type="number"
                                    min="0"
                                    {...register('videos_count', { valueAsNumber: true })}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {isEditing ? 'Updating...' : 'Creating...'}
                                </>
                            ) : isEditing ? (
                                'Update User'
                            ) : (
                                'Create User'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
