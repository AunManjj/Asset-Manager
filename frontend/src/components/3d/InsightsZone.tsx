import { FloatingCard } from "./FloatingCard";
import { useListAiInsights } from "@/api";

export function InsightsZone({ position }: { position: [number, number, number] }) {
  const { data: insights } = useListAiInsights();

  return (
    <group position={position}>
      <FloatingCard position={[0, 0, 0]} title="AI Insights" color="#E87722" width={440} height={300}>
        <div className="flex flex-col gap-3 text-[#0A0A0A]">
          <div className="bg-[#F5F0E8] rounded-lg p-3 text-center border border-[#EDE6DA]">
            <div className="text-3xl font-bold text-[#E87722]">{insights?.length ?? 0}</div>
            <div className="text-xs text-[#6B6560] mt-0.5">AI-Generated Insights</div>
          </div>
          <div className="flex flex-col gap-1.5">
            {insights?.slice(0, 3).map((insight) => (
              <div key={insight.id} className="bg-[#F5F0E8] rounded-lg p-2.5 border border-[#EDE6DA]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E87722]" />
                  <span className="text-xs font-medium text-[#E87722] uppercase">
                    {insight.type?.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-[#0A0A0A]/80 line-clamp-2 leading-relaxed">
                  {insight.content?.slice(0, 120)}…
                </p>
              </div>
            ))}
          </div>
        </div>
      </FloatingCard>
    </group>
  );
}
