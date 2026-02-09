import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        label: string;
    };
    className?: string;
    variant?: 'default' | 'gradient';
}

export function StatsCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    className,
    variant = 'default',
}: StatsCardProps) {
    const isPositive = trend && trend.value >= 0;

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]',
                variant === 'gradient'
                    ? 'bg-gradient-to-br from-pink-500/20 via-violet-500/20 to-purple-500/20 border border-pink-500/20'
                    : 'bg-white/5 border border-white/10 hover:border-white/20',
                className
            )}
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-violet-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-white/60">{title}</p>
                    <p className="text-3xl font-bold text-white tracking-tight">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                    {description && (
                        <p className="text-sm text-white/50">{description}</p>
                    )}
                    {trend && (
                        <div className="flex items-center gap-1">
                            <span
                                className={cn(
                                    'text-sm font-medium',
                                    isPositive ? 'text-emerald-400' : 'text-red-400'
                                )}
                            >
                                {isPositive ? '+' : ''}{trend.value}%
                            </span>
                            <span className="text-xs text-white/40">{trend.label}</span>
                        </div>
                    )}
                </div>

                <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    variant === 'gradient'
                        ? 'bg-gradient-to-br from-pink-500 to-violet-600 shadow-lg shadow-pink-500/30'
                        : 'bg-white/10'
                )}>
                    <Icon className={cn(
                        'w-6 h-6',
                        variant === 'gradient' ? 'text-white' : 'text-white/60'
                    )} />
                </div>
            </div>
        </div>
    );
}
