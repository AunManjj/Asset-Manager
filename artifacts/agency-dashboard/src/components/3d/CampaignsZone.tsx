import { FloatingCard } from "./FloatingCard";
import { useListCampaigns } from "@workspace/api-client-react";

export function CampaignsZone({ position }: { position: [number, number, number] }) {
  const { data: campaigns } = useListCampaigns();

  return (
    <group position={position}>
      <FloatingCard position={[0, 0, 0]} title="Campaigns" color="#f59e0b">
        <div className="flex flex-col gap-2 text-white">
          {campaigns?.slice(0, 4).map((c) => (
            <div key={c.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-2 h-2 rounded-full ${c.status === 'active' ? 'bg-emerald-400' : c.status === 'paused' ? 'bg-amber-400' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium truncate max-w-[200px]">{c.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                <span>ROAS {c.roas?.toFixed(1) ?? 0}x</span>
                <span>${c.spend?.toLocaleString() ?? 0}</span>
              </div>
            </div>
          ))}
        </div>
      </FloatingCard>

      <FloatingCard position={[-4, 1, 2]} title="Top Performer" color="#f59e0b" delay={0.7}>
        <div className="flex items-center justify-center h-full">
          {campaigns && campaigns.length > 0 && (
            <div className="text-center">
              <div className="text-sm text-gray-400">Highest ROAS</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {Math.max(...campaigns.map(c => c.roas ?? 0)).toFixed(1)}x
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {campaigns.reduce((best, c) => (c.roas ?? 0) > (best.roas ?? 0) ? c : best).name}
              </div>
            </div>
          )}
        </div>
      </FloatingCard>
    </group>
  );
}
