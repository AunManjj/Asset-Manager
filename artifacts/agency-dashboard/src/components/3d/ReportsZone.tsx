import { FloatingCard } from "./FloatingCard";
import { useListReports } from "@workspace/api-client-react";

export function ReportsZone({ position }: { position: [number, number, number] }) {
  const { data: reports } = useListReports();

  const statusColors: Record<string, string> = {
    ready: 'bg-emerald-400',
    pending: 'bg-amber-400',
    generating: 'bg-blue-400',
    failed: 'bg-red-400',
  };

  return (
    <group position={position}>
      <FloatingCard position={[0, 0, 0]} title="Reports" color="#06b6d4">
        <div className="flex flex-col gap-2 text-white">
          {reports?.slice(0, 4).map((r) => (
            <div key={r.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-2 h-2 rounded-full ${statusColors[r.status] || 'bg-gray-400'}`} />
                <span className="text-sm font-medium truncate max-w-[200px]">{r.title}</span>
              </div>
              <span className={`text-xs ${r.status === 'ready' ? 'text-emerald-400' : 'text-gray-400'}`}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </FloatingCard>

      <FloatingCard position={[4, 0.5, 1]} title="Status" color="#06b6d4" delay={0.3}>
        <div className="flex items-center justify-center h-full gap-4">
          {['ready', 'pending', 'generating'].map((status) => {
            const count = reports?.filter(r => r.status === status).length ?? 0;
            return (
              <div key={status} className="text-center">
                <div className={`text-2xl font-bold ${status === 'ready' ? 'text-emerald-400' : status === 'pending' ? 'text-amber-400' : 'text-blue-400'}`}>
                  {count}
                </div>
                <div className="text-[10px] text-gray-400 capitalize">{status}</div>
              </div>
            );
          })}
        </div>
      </FloatingCard>
    </group>
  );
}
