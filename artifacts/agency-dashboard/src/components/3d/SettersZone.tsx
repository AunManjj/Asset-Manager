import { FloatingCard } from "./FloatingCard";
import { useGetSetterStats, useListSetterActivities } from "@workspace/api-client-react";

export function SettersZone({ position }: { position: [number, number, number] }) {
  const { data: stats } = useGetSetterStats();
  const { data: activities } = useListSetterActivities();

  const totalOutreach = stats?.reduce((sum, s) => sum + s.totalOutreach, 0) ?? 0;
  const totalBooked = stats?.reduce((sum, s) => sum + s.totalCallsBooked, 0) ?? 0;

  return (
    <group position={position}>
      <FloatingCard position={[0, 0, 0]} title="Setter Activity" color="#ec4899">
        <div className="flex flex-col gap-3 text-white">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-400 uppercase">Outreach</div>
              <div className="text-xl font-bold text-pink-400">{totalOutreach.toLocaleString()}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-400 uppercase">Booked</div>
              <div className="text-xl font-bold text-pink-400">{totalBooked.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {stats?.slice(0, 3).map((s) => (
              <div key={s.setterId} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-1.5">
                <span className="text-sm font-medium">{s.setterName}</span>
                <div className="flex gap-3 text-xs text-gray-400">
                  <span>{s.totalOutreach} outreach</span>
                  <span>{s.totalCallsBooked} booked</span>
                  <span className="text-pink-400">{s.avgShowRate?.toFixed(0) ?? 0}% show</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FloatingCard>

      {/* Mini bar chart */}
      <FloatingCard position={[4, -0.5, 1.5]} title="Daily Outreach" color="#ec4899" delay={0.6}>
        <div className="flex items-end gap-1 h-28 px-2">
          {activities?.slice(-7).map((a, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-pink-500/60 rounded-t" style={{ height: `${(a.outreachCount / 100) * 100}%` }} />
              <span className="text-[8px] text-gray-500">{a.date?.slice(5)}</span>
            </div>
          ))}
        </div>
      </FloatingCard>
    </group>
  );
}
