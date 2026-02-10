import { Sidebar } from '@/components/admin/Sidebar';
import { Toaster } from '@/components/ui/sonner';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <Sidebar />

            {/* Main content area */}
            <main className="lg:pl-72 pt-16">
                <div className="p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </main>

            <Toaster position="top-right" richColors />
        </div>
    );
}
