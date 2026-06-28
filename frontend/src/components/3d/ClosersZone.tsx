import { FloatingCard } from "./FloatingCard";
import { useGetCloserStats } from "@/api";

export function ClosersZone({ position }: { position: [number, number, number] }) {
  const { data: stats } = useGetCloserStats();

  const totalCalls = stats?.reduce((sum, s) => sum + s.totalCalls, 0) ?? 0;
  const totalDeals = stats?.reduce((sum, s) => sum + s.totalDealsWon, 0) ?? 0;
  const totalRevenue = stats?.reduce((sum, s) => sum + s.totalRevenue, 0) ?? 0;
  const avgClose =
    stats && stats.length > 0 ? stats.reduce((sum, s) => sum + (s.avgCloseRate ?? 0), 0) / stats.length : 0;

  return (
    <group position={position}>
      <FloatingCard position={[0, 0, 0]} title="Closer Performance" color="#E87722" width={440} height={300}>
        <div className="flex flex-col gap-3 text-[#0A0A0A]">
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-[#F5F0E8] rounded-lg p-2 text-center border border-[#EDE6DA]">
              <div className="text-[9px] text-[#6B6560] uppercase">Calls</div>
              <div className="text-lg font-bold">{totalCalls}</div>
            </div>
            <div className="bg-[#F5F0E8] rounded-lg p-2 text-center border border-[#EDE6DA]">
              <div className="text-[9px] text-[#6B6560] uppercase">Deals</div>
              <div className="text-lg font-bold">{totalDeals}</div>
            </div>
            <div className="bg-[#F5F0E8] rounded-lg p-2 text-center border border-[#EDE6DA]">
              <div className="text-[9px] text-[#6B6560] uppercase">Revenue</div>
              <div className="text-lg font-bold text-[#E87722]">${(totalRevenue / 1000).toFixed(0)}k</div>
            </div>
            <div className="bg-[#F5F0E8] rounded-lg p-2 text-center border border-[#EDE6DA]">
              <div className="text-[9px] text-[#6B6560] uppercase">Close</div>
              <div className="text-lg font-bold text-[#F97316]">{avgClose.toFixed(0)}%</div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {stats?.slice(0, 3).map((s) => (
              <div
                key={s.closerId}
                className="flex items-center justify-between bg-[#F5F0E8] rounded-lg px-3 py-1.5 border border-[#EDE6DA]"
              >
                <span className="text-sm font-medium">{s.closerName}</span>
                <div className="flex gap-3 text-xs text-[#6B6560]">
                  <span>{s.totalDealsWon} deals</span>
                  <span className="text-[#E87722]">{s.avgCloseRate?.toFixed(0) ?? 0}%</span>
                  <span>${(s.totalRevenue / 1000).toFixed(1)}k</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FloatingCard>
    </group>
  );
}
