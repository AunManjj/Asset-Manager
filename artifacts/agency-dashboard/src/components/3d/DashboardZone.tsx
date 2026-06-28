import { FloatingCard } from "./FloatingCard";
import { useGetDashboardSummary, useGetPerformanceMetrics } from "@workspace/api-client-react";

export function DashboardZone({ position }: { position: [number, number, number] }) {
  const { data: summary } = useGetDashboardSummary();
  const { data: metrics } = useGetPerformanceMetrics({ period: "7d" });

  const format = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

  const chartData = metrics?.spendByDay?.map((item, i) => ({
    day: item.date.slice(5),
    spend: item.value,
    rev: metrics.revenueByDay[i]?.value || 0,
  }));

  return (
    <group position={position}>
      <FloatingCard position={[-3, 0, 0]} title="Dashboard" color="#6366f1">
        <div className="flex flex-col gap-3 text-white">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 rounded-lg p-2">
              <div className="text-[10px] text-gray-400 uppercase">Revenue</div>
              <div className="text-lg font-bold text-emerald-400">{format(summary?.totalRevenue ?? 0)}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <div className="text-[10px] text-gray-400 uppercase">Ad Spend</div>
              <div className="text-lg font-bold text-amber-400">{format(summary?.totalSpend ?? 0)}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <div className="text-[10px] text-gray-400 uppercase">Clients</div>
              <div className="text-lg font-bold text-indigo-400">{summary?.activeClients ?? 0}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <div className="text-[10px] text-gray-400 uppercase">ROAS</div>
              <div className="text-lg font-bold text-violet-400">{summary?.avgRoas?.toFixed(2) ?? 0}x</div>
            </div>
          </div>
          {/* Mini sparkline */}
          <div className="flex items-end gap-px h-12 mt-1">
            {chartData?.slice(-7).map((d, i) => {
              const max = Math.max(...chartData.map(c => Math.max(c.spend, c.rev)));
              return (
                <div key={i} className="flex-1 flex flex-col gap-px">
                  <div className="w-full bg-emerald-500/50 rounded-t" style={{ height: `${(d.rev / max) * 100}%` }} />
                  <div className="w-full bg-indigo-500/50" style={{ height: `${(d.spend / max) * 100}%` }} />
                </div>
              );
            })}
          </div>
        </div>
      </FloatingCard>

      {/* Welcome message floating text */}
      <FloatingCard position={[3.5, 1.5, 0]} title="AgencyOS" color="#8b5cf6" delay={1}>
        <div className="text-center py-4">
          <div className="text-2xl font-bold text-white mb-2">AgencyOS</div>
          <div className="text-sm text-gray-400">Cinematic Command Center</div>
          <div className="text-xs text-gray-500 mt-2">Auto-navigating through your data</div>
        </div>
      </FloatingCard>
    </group>
  );
}
