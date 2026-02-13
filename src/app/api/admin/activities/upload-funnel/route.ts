import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { UploadFunnelMetrics } from '@/types/database';
import { subDays } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const auth = await requireAdmin();
        if ('error' in auth) return auth.error;

        const supabase = createAdminClient();

        const searchParams = request.nextUrl.searchParams;
        const days = parseInt(searchParams.get('days') || '30');
        const startDate = subDays(new Date(), days).toISOString();

        // Get unique users at each step
        const { count: clickedUpload } = await supabase
            .from('user_activities')
            .select('user_id', { count: 'exact', head: true })
            .eq('activity_type', 'upload_button_clicked')
            .gte('created_at', startDate);

        const { count: selectedVideo } = await supabase
            .from('user_activities')
            .select('user_id', { count: 'exact', head: true })
            .eq('activity_type', 'upload_video_file_selected')
            .gte('created_at', startDate);

        const { count: selectedReceipt } = await supabase
            .from('user_activities')
            .select('user_id', { count: 'exact', head: true })
            .eq('activity_type', 'upload_receipt_file_selected')
            .gte('created_at', startDate);

        // Count users who filled store name (upload_store_name_input)
        const { count: filledStoreName } = await supabase
            .from('user_activities')
            .select('user_id', { count: 'exact', head: true })
            .eq('activity_type', 'upload_store_name_input')
            .gte('created_at', startDate);

        const { count: submitted } = await supabase
            .from('user_activities')
            .select('user_id', { count: 'exact', head: true })
            .eq('activity_type', 'upload_submit_button_clicked')
            .gte('created_at', startDate);

        const { count: completed } = await supabase
            .from('user_activities')
            .select('user_id', { count: 'exact', head: true })
            .eq('activity_type', 'video_uploaded')
            .gte('created_at', startDate);

        const funnel: UploadFunnelMetrics = {
            clickedUpload: clickedUpload || 0,
            selectedVideo: selectedVideo || 0,
            selectedReceipt: selectedReceipt || 0,
            filledStoreName: filledStoreName || 0,
            submitted: submitted || 0,
            completed: completed || 0,
        };

        return NextResponse.json(funnel);
    } catch (error) {
        console.error('Error in upload funnel API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
