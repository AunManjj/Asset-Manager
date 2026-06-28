import { FloatingCard } from "./FloatingCard";
import { useListAiInsights } from "@workspace/api-client-react";

export function InsightsZone({ position }: { position: [number, number, number] }) {
  const { data: insights } = useListAiInsights();

  return (
    <group position={position}>
      <FloatingCard position={[0, 0, 0]} title="AI Insights" color="#a855f7">
        <div className="flex flex-col gap-2 text-white">
          {insights?.slice(0, 3).map((insight) => (
            <div key={insight.id} className="bg-white/5 rounded-lg p-2.5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                <span className="text-xs font-medium text-violet-300 uppercase">{insight.type?.replace(/_/g, ' ')}</span>
              </div>
              <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">{insight.content?.slice(0, 180)}...</p>
            </div>
          ))}
        </div>
      </FloatingCard>

      <FloatingCard position={[-4, 1, 1.5]} title="Insight Count" color="#a855f7" delay={0.4}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-4xl font-bold text-violet-400">{insights?.length ?? 0}</div>
            <div className="text-xs text-gray-400 mt-1">AI-Generated Insights</div>
          </div>
        </div>
      </FloatingCard>
    </group>
  );
}
