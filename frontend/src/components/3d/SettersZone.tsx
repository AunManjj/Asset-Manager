import { FloatingCard } from "./FloatingCard";
import { useGetSetterStats, useListSetterActivities } from "@/api";

export function SettersZone({ position }: { position: [number, number, number] }) {
  const { data: stats } = useGetSetterStats();
  const { data: activities } = useListSetterActivities();

  const totalOutreach = stats?.reduce((sum, s) => sum + s.totalOutreach, 0) ?? 0;
  const totalBooked = stats?.reduce((sum, s) => sum + s.totalCallsBooked, 0) ?? 0;
  const maxOutreach = Math.max(...(activities?.slice(-7).map((a) => a.outreachCount) ?? [1]), 1);

  return (
    <group position={position}>
      <FloatingCard position={[0, 0, 0]} title="Setter Activity" color="#E87722" width={440} height={300}>
        <div className="flex flex-col gap-3 text-[#0A0A0A]">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#F5F0E8] rounded-lg p-2 text-center border border-[#EDE6DA]">
              <div className="text-[10px] text-[#6B6560] uppercase">Outreach</div>
              <div className="text-xl font-bold text-[#E87722]">{totalOutreach.toLocaleString()}</div>
            </div>
            <div className="bg-[#F5F0E8] rounded-lg p-2 text-center border border-[#EDE6DA]">
              <div className="text-[10px] text-[#6B6560] uppercase">Booked</div>
              <div className="text-xl font-bold text-[#F97316]">{totalBooked.toLocaleString()}</div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {stats?.slice(0, 3).map((s) => (
              <div
                key={s.setterId}
                className="flex items-center justify-between bg-[#F5F0E8] rounded-lg px-3 py-1.5 border border-[#EDE6DA]"
              >
                <span className="text-sm font-medium">{s.setterName}</span>
                <div className="flex gap-3 text-xs text-[#6B6560]">
                  <span>{s.totalOutreach} out</span>
                  <span>{s.totalCallsBooked} booked</span>
                  <span className="text-[#E87722]">{s.avgShowRate?.toFixed(0) ?? 0}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-1 h-12 px-1 mt-1">
            {activities?.slice(-7).map((a, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full bg-[#E87722]/70 rounded-t-sm min-h-[4px]"
                  style={{ height: `${Math.max(8, (a.outreachCount / maxOutreach) * 100)}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </FloatingCard>
    </group>
  );
}
