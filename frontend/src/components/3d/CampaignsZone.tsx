import { FloatingCard } from "./FloatingCard";
import { useListCampaigns } from "@/api";

export function CampaignsZone({ position }: { position: [number, number, number] }) {
  const { data: campaigns } = useListCampaigns();
  const topRoas =
    campaigns && campaigns.length > 0
      ? campaigns.reduce((best, c) => ((c.roas ?? 0) > (best.roas ?? 0) ? c : best))
      : { roas: 0, name: "—" };

  return (
    <group position={position}>
      <FloatingCard position={[0, 0, 0]} title="Campaigns" color="#E87722" width={440} height={300}>
        <div className="flex flex-col gap-3 text-[#0A0A0A]">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#F5F0E8] rounded-lg p-2 text-center border border-[#EDE6DA]">
              <div className="text-[10px] text-[#6B6560] uppercase">Active</div>
              <div className="text-xl font-bold text-primary">{campaigns?.filter((c) => c.status === "active").length ?? 0}</div>
            </div>
            <div className="bg-[#F5F0E8] rounded-lg p-2 text-center border border-[#EDE6DA]">
              <div className="text-[10px] text-[#6B6560] uppercase">Top ROAS</div>
              <div className="text-xl font-bold text-[#E87722]">{topRoas?.roas?.toFixed(1) ?? 0}x</div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {campaigns?.slice(0, 4).map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-[#F5F0E8] rounded-lg px-3 py-2 border border-[#EDE6DA]">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      c.status === "active" ? "bg-primary" : c.status === "paused" ? "bg-[#F97316]" : "bg-gray-400"
                    }`}
                  />
                  <span className="text-sm font-medium truncate max-w-[180px]">{c.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#6B6560] shrink-0">
                  <span className="text-[#E87722] font-medium">{c.roas?.toFixed(1) ?? 0}x</span>
                  <span>${c.spend?.toLocaleString() ?? 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FloatingCard>
    </group>
  );
}
