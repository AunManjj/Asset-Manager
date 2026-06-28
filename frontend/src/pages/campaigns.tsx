import { useMemo, useState } from "react";
import { useListCampaigns, usePauseCampaign, useResumeCampaign } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Search, Megaphone, TrendingUp, DollarSign, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function statusBadgeClass(status: string) {
  if (status === "active") return "bg-primary/10 text-primary border-primary/25";
  if (status === "paused") return "bg-[#F97316]/10 text-[#E87722] border-[#F97316]/25";
  return "bg-muted text-muted-foreground border-border";
}

export default function Campaigns() {
  const { data: campaigns, isLoading, refetch } = useListCampaigns();
  const pauseMutation = usePauseCampaign();
  const resumeMutation = useResumeCampaign();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return (campaigns ?? []).filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [campaigns, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const active = filtered.filter((c) => c.status === "active");
    const totalSpend = filtered.reduce((s, c) => s + (c.spend ?? 0), 0);
    const avgRoas =
      filtered.length > 0 ? filtered.reduce((s, c) => s + (c.roas ?? 0), 0) / filtered.length : 0;
    return { total: filtered.length, active: active.length, totalSpend, avgRoas };
  }, [filtered]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  const handlePause = (id: number) => {
    pauseMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Campaign Paused" });
          refetch();
        },
      },
    );
  };

  const handleResume = (id: number) => {
    resumeMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Campaign Resumed" });
          refetch();
        },
      },
    );
  };

  const statCards = [
    { label: "Total Campaigns", value: stats.total, icon: Megaphone },
    { label: "Active", value: stats.active, icon: Activity },
    { label: "Total Spend", value: formatCurrency(stats.totalSpend), icon: DollarSign },
    { label: "Avg ROAS", value: `${stats.avgRoas.toFixed(2)}x`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Campaigns</h2>
        <p className="text-muted-foreground text-sm mt-1">Active marketing campaigns across all clients.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }, i) => (
          <div key={label} className={i % 2 === 0 ? "kpi-dark" : "kpi-light"}>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className={`text-xs uppercase font-medium tracking-wider ${i % 2 === 0 ? "text-[#B9BDC5]" : "text-[#7A7A7A]"}`}>
                  {label}
                </p>
                <p className={`text-2xl font-bold mt-1 ${i % 2 === 0 ? "text-white" : "text-[#0A0A0A]"}`}>{value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${i % 2 === 0 ? "bg-[#E87722]/20" : "bg-[#E87722]/10"}`}>
                <Icon className="w-5 h-5 text-[#E87722]" strokeWidth={1.75} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card-light overflow-hidden p-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white border-[#EDE6DA]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-white border-[#EDE6DA]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader className="bg-[#111315]">
              <TableRow className="border-white/8 hover:bg-transparent">
                <TableHead className="text-[#B9BDC5] font-medium">Campaign</TableHead>
                <TableHead className="text-[#B9BDC5] font-medium">Client</TableHead>
                <TableHead className="text-[#B9BDC5] font-medium">Status</TableHead>
                <TableHead className="text-[#B9BDC5] font-medium text-right">Spend</TableHead>
                <TableHead className="text-[#B9BDC5] font-medium text-right">ROAS</TableHead>
                <TableHead className="text-[#B9BDC5] font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-[#EDE6DA]">
                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-[50px] ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-[80px] ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow className="border-[#EDE6DA] hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No campaigns found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((campaign) => (
                  <TableRow key={campaign.id} className="border-[#EDE6DA] hover:bg-[#F5F0E8]/40 transition-colors">
                    <TableCell className="font-medium text-foreground">
                      <div>{campaign.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{campaign.objective}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{campaign.clientName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadgeClass(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-foreground">
                      {campaign.spend
                        ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(campaign.spend)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium text-primary">
                      {campaign.roas ? `${campaign.roas.toFixed(2)}x` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {campaign.status === "active" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-[#F97316]/10 hover:bg-[#F97316]/20 text-[#E87722] border-[#F97316]/25 h-8"
                          onClick={() => handlePause(campaign.id)}
                          disabled={pauseMutation.isPending}
                        >
                          <Pause className="w-3 h-3 mr-1.5" /> Pause
                        </Button>
                      ) : campaign.status === "paused" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/25 h-8"
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
      </div>
    </div>
  );
}
