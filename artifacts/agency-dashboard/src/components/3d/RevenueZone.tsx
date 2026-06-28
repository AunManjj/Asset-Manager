import { FloatingCard } from "./FloatingCard";
import { useGetRevenueSummary } from "@workspace/api-client-react";

export function RevenueZone({ position }: { position: [number, number, number] }) {
  const { data: summary } = useGetRevenueSummary();

  return (
    <group position={position}>
      <FloatingCard position={[0, 0, 0]} title="Revenue" color="#22c55e">
        <div className="flex flex-col gap-3 text-white">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-gray-400 uppercase">Total Revenue</div>
              <div className="text-2xl font-bold text-emerald-400">
                ${(summary?.totalRevenue ?? 0 / 1000).toLocaleString()}k
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-gray-400 uppercase">Monthly</div>
              <div className="text-2xl font-bold text-emerald-400">
                ${(summary?.monthlyRevenue ?? 0 / 1000).toLocaleString()}k
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {summary?.revenueByType?.map((r) => (
              <div key={r.type} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-1.5">
                <span className="text-sm capitalize">{r.type.replace('_', ' ')}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${(r.amount / (summary.totalRevenue || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">${r.amount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FloatingCard>

      <FloatingCard position={[4, -0.5, 1]} title="Monthly Trend" color="#22c55e" delay={0.5}>
        <div className="flex items-end gap-1 h-24 px-2">
          {summary?.revenueByMonth?.slice(-6).map((r, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-emerald-500/60 rounded-t"
                style={{
                  height: `${(r.amount / (Math.max(...(summary.revenueByMonth?.map(m => m.amount) ?? [1]))) * 100)}%`,
                }}
              />
              <span className="text-[8px] text-gray-500">{r.month?.slice(5)}</span>
            </div>
          ))}
        </div>
      </FloatingCard>
    </group>
  );
}
