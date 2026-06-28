import { FloatingCard } from "./FloatingCard";
import { useGetDashboardSummary, useGetPerformanceMetrics } from "@/api";

export function DashboardZone({ position }: { position: [number, number, number] }) {
  const { data: summary } = useGetDashboardSummary();
  const { data: metrics } = useGetPerformanceMetrics({ period: "7d" });

  const format = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

  const chartData = metrics?.spendByDay?.map((item, i) => ({
    day: item.date.slice(5),
    spend: item.value,
    rev: metrics.revenueByDay[i]?.value || 0,
  }));

  return (
    <group position={position}>
      <FloatingCard position={[0, 0, 0]} title="Dashboard Overview" color="#E87722" width={440} height={300}>
        <div className="flex flex-col gap-3 text-[#0A0A0A]">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#F5F0E8] rounded-xl p-3 border border-[#EDE6DA]">
              <div className="text-[10px] text-[#666666] uppercase font-medium">Revenue</div>
              <div className="text-xl font-bold text-[#E87722]">{format(summary?.totalRevenue ?? 0)}</div>
            </div>
            <div className="bg-[#F5F0E8] rounded-xl p-3 border border-[#EDE6DA]">
              <div className="text-[10px] text-[#666666] uppercase font-medium">Ad Spend</div>
              <div className="text-xl font-bold text-[#F97316]">{format(summary?.totalSpend ?? 0)}</div>
            </div>
            <div className="bg-[#F5F0E8] rounded-xl p-3 border border-[#EDE6DA]">
              <div className="text-[10px] text-[#666666] uppercase font-medium">Avg ROAS</div>
              <div className="text-xl font-bold text-[#0A0A0A]">{summary?.avgRoas?.toFixed(2) ?? 0}x</div>
            </div>
            <div className="bg-[#F5F0E8] rounded-xl p-3 border border-[#EDE6DA]">
              <div className="text-[10px] text-[#666666] uppercase font-medium">Active Clients</div>
              <div className="text-xl font-bold text-[#0A0A0A]">{summary?.activeClients ?? 0}</div>
            </div>
          </div>
          <div
            className="flex items-end gap-1 h-14 mt-1 px-1"
            style={{ transform: "perspective(500px) rotateX(14deg) rotateY(-6deg)", transformOrigin: "center bottom" }}
          >
            {chartData?.slice(-7).map((d, i) => {
              const max = Math.max(...(chartData?.map((c) => Math.max(c.spend, c.rev)) ?? [1]));
              return (
                <div key={i} className="flex-1 flex flex-col gap-0.5 items-center">
                  <div
                    className="w-full bg-[#E87722]/70 rounded-t-sm min-h-[4px]"
                    style={{ height: `${Math.max(8, (d.rev / max) * 100)}%` }}
                  />
                  <div
                    className="w-full bg-[#F97316]/50 rounded-b-sm min-h-[4px]"
                    style={{ height: `${Math.max(8, (d.spend / max) * 100)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-[#666666] text-center">Scroll or ↑ ↓ · 10 premium zones</p>
        </div>
      </FloatingCard>
    </group>
  );
}
