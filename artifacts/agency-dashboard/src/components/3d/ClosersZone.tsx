import { FloatingCard } from "./FloatingCard";
import { useGetCloserStats } from "@workspace/api-client-react";

export function ClosersZone({ position }: { position: [number, number, number] }) {
  const { data: stats } = useGetCloserStats();

  const totalCalls = stats?.reduce((sum, s) => sum + s.totalCalls, 0) ?? 0;
  const totalDeals = stats?.reduce((sum, s) => sum + s.totalDealsWon, 0) ?? 0;
  const totalRevenue = stats?.reduce((sum, s) => sum + s.totalRevenue, 0) ?? 0;

  return (
    <group position={position}>
      <FloatingCard position={[0, 0, 0]} title="Closer Performance" color="#3b82f6">
        <div className="flex flex-col gap-3 text-white">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-[10px] text-gray-400 uppercase">Calls</div>
              <div className="text-xl font-bold text-blue-400">{totalCalls}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-[10px] text-gray-400 uppercase">Deals</div>
              <div className="text-xl font-bold text-blue-400">{totalDeals}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-[10px] text-gray-400 uppercase">Revenue</div>
              <div className="text-lg font-bold text-blue-400">${(totalRevenue / 1000).toFixed(1)}k</div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {stats?.map((s) => (
              <div key={s.closerId} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-1.5">
                <span className="text-sm font-medium">{s.closerName}</span>
                <div className="flex gap-3 text-xs text-gray-400">
                  <span>{s.totalDealsWon} deals</span>
                  <span>{s.avgCloseRate?.toFixed(0) ?? 0}% close</span>
                  <span className="text-blue-400">${(s.totalRevenue / 1000).toFixed(1)}k</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FloatingCard>

      <FloatingCard position={[-4, 1, 1]} title="Close Rate" color="#3b82f6" delay={0.8}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-400">
              {stats && stats.length > 0
                ? (stats.reduce((sum, s) => sum + (s.avgCloseRate ?? 0), 0) / stats.length).toFixed(1)
                : 0}%
            </div>
            <div className="text-xs text-gray-400 mt-1">Team Average Close Rate</div>
          </div>
        </div>
      </FloatingCard>
    </group>
  );
}
