'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, Bell, Database, Globe, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
    const handleSave = () => {
        toast.success('Settings saved successfully');
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Admin Settings</h1>
                <p className="text-white/60 mt-1">Configure your admin panel preferences and security</p>
            </div>

            <div className="grid gap-8">
                {/* Profile Settings */}
                <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-pink-500" />
                            <CardTitle>Security & Authentication</CardTitle>
                        </div>
                        <CardDescription className="text-white/40">Manage your admin credentials and session limits</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Admin Email</Label>
                                <Input value="admin@taptopurr.com" disabled className="bg-white/5 border-white/10" />
                            </div>
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Input value="Super Admin" disabled className="bg-white/5 border-white/10" />
                            </div>
                        </div>
                        <Button variant="outline" className="border-pink-500/30 text-pink-400 hover:bg-pink-500/10">
                            Change Admin Password
                        </Button>
                    </CardContent>
                </Card>

                {/* System Settings */}
                <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-violet-500" />
                            <CardTitle>Data Management</CardTitle>
                        </div>
                        <CardDescription className="text-white/40">Configure database thresholds and cache settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Real-time Dashboard</p>
                                <p className="text-sm text-white/40">Update charts in real-time as users perform actions</p>
                            </div>
                            <Button variant="outline" size="sm">Enabled</Button>
                        </div>
                        <Separator className="bg-white/10" />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Export Format</p>
                                <p className="text-sm text-white/40">Set your preferred format for user reports</p>
                            </div>
                            <Button variant="outline" size="sm">CSV (Default)</Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={handleSave} className="bg-gradient-to-r from-pink-500 to-violet-600">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}
