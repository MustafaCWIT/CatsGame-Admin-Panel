import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';

export async function GET() {
    const session = await verifyAdminSession();

    if (!session) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
        user: {
            id: session.userId,
            phone: session.phone,
            role: session.role,
        },
    });
}
