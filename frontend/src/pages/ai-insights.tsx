import { useListAiInsights, useGenerateAiInsight } from "@/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BrainCircuit, Sparkles, MessageSquare, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AiInsights() {
  const { data: insights, isLoading, isError, refetch } = useListAiInsights();
  const generateMutation = useGenerateAiInsight();
  const { toast } = useToast();

  const handleGenerate = () => {
    generateMutation.mutate(
      { data: { type: "performance_analysis" } },
      {
        onSuccess: () => {
          toast({ title: "Insight Generated", description: "New AI analysis ready." });
          refetch();
        },
        onError: () => {
          toast({ title: "Generation failed", description: "Could not generate insight. Try again.", variant: "destructive" });
        },
      },
    );
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "recommendations":
        return <Lightbulb className="w-5 h-5 text-[#F97316]" />;
      case "call_coaching":
        return <MessageSquare className="w-5 h-5 text-[#E87722]" />;
      default:
        return <BrainCircuit className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-dark p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="w-5 h-5 text-[#E87722]" />
              <span className="text-[10px] uppercase tracking-widest text-[#B9BDC5]">AI Intelligence</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">AI Insights</h2>
            <p className="text-[#B9BDC5] text-sm mt-1">Automated analysis, predictions, and recommendations.</p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="bg-[#E87722] hover:bg-[#F28C3A] text-white rounded-xl shadow-[0_4px_20px_rgba(232,119,34,0.3)] transition-all duration-300"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generateMutation.isPending ? "Analyzing…" : "Generate Analysis"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-white border-[#EDE6DA] shadow-sm">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-[200px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : isError ? (
          <Card className="bg-white border-[#EDE6DA] border-dashed flex flex-col items-center justify-center p-12 text-center shadow-sm">
            <BrainCircuit className="w-12 h-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Unable to Load Insights</h3>
            <p className="text-muted-foreground max-w-sm mb-4">
              Something went wrong while fetching AI insights. Check that the backend is running and try again.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Retry
            </Button>
          </Card>
        ) : !insights || insights.length === 0 ? (
          <Card className="bg-white border-[#EDE6DA] border-dashed flex flex-col items-center justify-center p-12 text-center shadow-sm">
            <BrainCircuit className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Insights Yet</h3>
            <p className="text-muted-foreground max-w-sm">
              Generate your first AI analysis to uncover patterns in your agency's performance.
            </p>
          </Card>
        ) : (
          insights?.map((insight) => (
            <Card key={insight.id} className="card-light relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#E87722] to-[#F97316]" />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F5F0E8] border border-[#EDE6DA] flex items-center justify-center">
                      {getIconForType(insight.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-foreground capitalize">
                        {insight.type.replaceAll("_", " ")}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {new Date(insight.createdAt).toLocaleDateString()} • {insight.clientName || "Agency Wide"}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/25 uppercase text-[10px]">
                    {insight.model || "GPT-4"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none text-foreground/80 text-sm mt-4 whitespace-pre-wrap">{insight.content}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
