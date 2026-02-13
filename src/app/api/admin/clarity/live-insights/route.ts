import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

const CLARITY_API_URL = 'https://www.clarity.ms/export-data/api/v1/project-live-insights';

export async function GET(request: NextRequest) {
    try {
        const auth = await requireAdmin();
        if ('error' in auth) return auth.error;

        const apiToken = process.env.CLARITY_API_TOKEN;
        if (!apiToken) {
            return NextResponse.json({ error: 'Clarity API token not configured' }, { status: 503 });
        }

        const searchParams = request.nextUrl.searchParams;
        const numOfDays = searchParams.get('numOfDays') || '3';

        // Build Clarity API URL with optional dimensions
        const params = new URLSearchParams({ numOfDays });

        const dimension1 = searchParams.get('dimension1');
        const dimension2 = searchParams.get('dimension2');
        const dimension3 = searchParams.get('dimension3');
        if (dimension1) params.append('dimension1', dimension1);
        if (dimension2) params.append('dimension2', dimension2);
        if (dimension3) params.append('dimension3', dimension3);

        const response = await fetch(`${CLARITY_API_URL}?${params}`, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const status = response.status;
            if (status === 401) {
                return NextResponse.json({ error: 'Clarity API token is invalid or expired' }, { status: 401 });
            }
            if (status === 429) {
                return NextResponse.json({ error: 'Clarity API daily limit reached (10 requests/day)' }, { status: 429 });
            }
            return NextResponse.json({ error: `Clarity API error: ${status}` }, { status: status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching Clarity live insights:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
