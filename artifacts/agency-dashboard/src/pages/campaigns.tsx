import { useState } from "react";
import { useListCampaigns, usePauseCampaign, useResumeCampaign } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Pause, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Campaigns() {
  const { data: campaigns, isLoading, refetch } = useListCampaigns();
  const pauseMutation = usePauseCampaign();
  const resumeMutation = useResumeCampaign();
  const { toast } = useToast();

  const handlePause = (id: number) => {
    pauseMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Campaign Paused" });
        refetch();
      }
    });
  };

  const handleResume = (id: number) => {
    resumeMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Campaign Resumed" });
        refetch();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Campaigns</h2>
        <p className="text-gray-400 text-sm">Active marketing campaigns across all clients.</p>
      </div>

      <Card className="bg-[#13131a]/80 backdrop-blur border-white/5 shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-gray-400 font-medium">Campaign</TableHead>
                <TableHead className="text-gray-400 font-medium">Client</TableHead>
                <TableHead className="text-gray-400 font-medium">Status</TableHead>
                <TableHead className="text-gray-400 font-medium text-right">Spend</TableHead>
                <TableHead className="text-gray-400 font-medium text-right">ROAS</TableHead>
                <TableHead className="text-gray-400 font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell><Skeleton className="h-4 w-[200px] bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px] bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[70px] bg-white/5 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-[80px] bg-white/5 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-[50px] bg-white/5 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-[80px] bg-white/5 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : campaigns?.length === 0 ? (
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No campaigns found.
                  </TableCell>
                </TableRow>
              ) : (
                campaigns?.map((campaign) => (
                  <TableRow key={campaign.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                    <TableCell className="font-medium text-gray-200">
                      <div>{campaign.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{campaign.objective}</div>
                    </TableCell>
                    <TableCell className="text-gray-400">{campaign.clientName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`
                        ${campaign.status === 'active' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 
                          campaign.status === 'paused' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                          'bg-gray-500/10 text-gray-400 border-gray-500/20'}
                      `}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-gray-300">
                      {campaign.spend ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(campaign.spend) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium text-indigo-300">
                      {campaign.roas ? `${campaign.roas.toFixed(2)}x` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {campaign.status === 'active' ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/20 h-8"
                          onClick={() => handlePause(campaign.id)}
                          disabled={pauseMutation.isPending}
                        >
                          <Pause className="w-3 h-3 mr-1.5" /> Pause
                        </Button>
                      ) : campaign.status === 'paused' ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 h-8"
                          onClick={() => handleResume(campaign.id)}
                          disabled={resumeMutation.isPending}
                        >
                          <Play className="w-3 h-3 mr-1.5" /> Resume
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}