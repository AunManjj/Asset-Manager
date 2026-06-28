import { FloatingCard } from "./FloatingCard";
import { useGetRevenueSummary } from "@/api";

export function RevenueZone({ position }: { position: [number, number, number] }) {
  const { data: summary } = useGetRevenueSummary();
  const maxMonth = Math.max(...(summary?.revenueByMonth?.map((m) => m.amount) ?? [1]), 1);

  return (
    <group position={position}>
      <FloatingCard position={[0, 0, 0]} title="Revenue" color="#E87722" width={440} height={300}>
        <div className="flex flex-col gap-3 text-[#0A0A0A]">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#F5F0E8] rounded-lg p-3 border border-[#EDE6DA]">
              <div className="text-[10px] text-[#6B6560] uppercase">Total Revenue</div>
              <div className="text-xl font-bold text-[#E87722]">
                ${((summary?.totalRevenue ?? 0) / 1000).toFixed(0)}k
              </div>
            </div>
            <div className="bg-[#F5F0E8] rounded-lg p-3 border border-[#EDE6DA]">
              <div className="text-[10px] text-[#6B6560] uppercase">Monthly</div>
              <div className="text-xl font-bold text-[#F97316]">
                ${((summary?.monthlyRevenue ?? 0) / 1000).toFixed(0)}k
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {summary?.revenueByType?.slice(0, 3).map((r) => (
              <div
                key={r.type}
                className="flex items-center justify-between bg-[#F5F0E8] rounded-lg px-3 py-1.5 border border-[#EDE6DA]"
              >
                <span className="text-sm capitalize">{r.type.replace("_", " ")}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-[#EDE6DA] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#E87722] rounded-full"
                      style={{ width: `${(r.amount / (summary.totalRevenue || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#E87722] font-medium">${r.amount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-1 h-10 px-1">
            {summary?.revenueByMonth?.slice(-6).map((r, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-[#F97316]/60 rounded-t-sm min-h-[4px]"
                  style={{ height: `${Math.max(8, (r.amount / maxMonth) * 100)}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </FloatingCard>
    </group>
  );
}
