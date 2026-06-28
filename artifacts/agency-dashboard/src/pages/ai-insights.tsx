import { useListAiInsights, useGenerateAiInsight } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BrainCircuit, Sparkles, MessageSquare, Lightbulb } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AiInsights() {
  const { data: insights, isLoading, refetch } = useListAiInsights();
  const generateMutation = useGenerateAiInsight();
  const { toast } = useToast();

  const handleGenerate = () => {
    generateMutation.mutate({
      data: {
        type: "performance_analysis",
      }
    }, {
      onSuccess: () => {
        toast({ title: "Insight Generated", description: "New AI analysis ready." });
        refetch();
      }
    });
  };

  const getIconForType = (type: string) => {
    switch(type) {
      case 'recommendations': return <Lightbulb className="w-5 h-5 text-amber-400" />;
      case 'call_coaching': return <MessageSquare className="w-5 h-5 text-blue-400" />;
      default: return <BrainCircuit className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">AI Insights</h2>
          <p className="text-gray-400 text-sm">Automated analysis and recommendations.</p>
        </div>
        <Button 
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
          className="bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {generateMutation.isPending ? "Analyzing..." : "Generate Analysis"}
        </Button>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-[#13131a]/80 backdrop-blur border-white/5 shadow-xl">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-[200px] bg-white/5" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full bg-white/5" />
              </CardContent>
            </Card>
          ))
        ) : insights?.length === 0 ? (
          <Card className="bg-[#13131a]/80 backdrop-blur border-white/5 border-dashed flex flex-col items-center justify-center p-12 text-center">
            <BrainCircuit className="w-12 h-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Insights Yet</h3>
            <p className="text-gray-400 max-w-sm">Generate your first AI analysis to uncover patterns in your agency's performance.</p>
          </Card>
        ) : (
          insights?.map((insight) => (
            <Card key={insight.id} className="bg-[#13131a]/80 backdrop-blur border-white/5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-violet-500" />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      {getIconForType(insight.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white capitalize">{insight.type.replace('_', ' ')}</CardTitle>
                      <CardDescription className="text-xs text-gray-500">
                        {new Date(insight.createdAt).toLocaleDateString()} • {insight.clientName || 'Agency Wide'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 uppercase text-[10px]">
                    {insight.model || 'GPT-4'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none text-gray-300 text-sm mt-4 whitespace-pre-wrap">
                  {insight.content}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}