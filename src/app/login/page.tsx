'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import logo from '@/assets/logo.png';

function LoginForm() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    const unauthorizedError = searchParams.get('error') === 'unauthorized';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.error || 'Invalid phone number or password.');
                setLoading(false);
                return;
            }

            router.push('/admin');
            router.refresh();
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl animate-pulse delay-700" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <Card className="w-full max-w-md relative backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-0 flex items-center justify-center w-32 relative h-32">
                        <Image
                            src={logo}
                            alt="Tap to Purr Logo"
                            fill
                            className="object-contain"
                            priority
                            quality={100}
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Tap to Purr</CardTitle>

                </CardHeader>

                <CardContent>
                    {(error || unauthorizedError) && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center gap-2 text-red-200">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm">
                                {error || 'You do not have permission to access the admin panel.'}
                            </span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-white/90">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+971XXXXXXXXX"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-pink-500 focus:ring-pink-500/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-white/90">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-pink-500 focus:ring-pink-500/20"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-lg shadow-purple-500/30 transition-all duration-200 hover:shadow-purple-500/40 hover:scale-[1.02]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>


                </CardContent>
            </Card>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black p-4">
                <Card className="w-full max-w-md relative backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-white" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
