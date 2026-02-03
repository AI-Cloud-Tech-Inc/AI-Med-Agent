'use client';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: string;
}

export default function MetricCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon,
}: MetricCardProps) {
  const trendColor = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400',
  }[trend];

  return (
    <div className="card group min-h-24">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-gray-400 font-medium truncate">{title}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2 truncate">{value}</p>
          {change && (
            <p className={`text-xs sm:text-sm mt-1 ${trendColor} truncate`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {change}
            </p>
          )}
        </div>
        <div className="text-2xl sm:text-3xl lg:text-4xl group-hover:scale-110 transition-transform flex-shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}
