import { useMemo, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListCampaigns, useListClients } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { useGetMetaStatus, useGetMetaCampaigns, useSyncMetaFromFacebook } from "@/api/meta";
import {
  DEMO_AD_CAMPAIGNS,
  computeAdStats,
  type DemoAdCampaign,
} from "@/lib/demo-ads-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Activity,
  Target,
  MousePointerClick,
  Zap,
  RefreshCw,
  Eye,
  Users,
  TrendingUp,
  Search,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type DisplayCampaign = DemoAdCampaign;

function statusBadgeClass(status: string) {
  if (status === "active") return "bg-primary/10 text-primary border-primary/25";
  if (status === "paused") return "bg-[#F97316]/10 text-[#E87722] border-[#F97316]/25";
  return "bg-muted text-muted-foreground border-border";
}

export default function FacebookAds() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: clients } = useListClients();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const clientIdNum = selectedClientId ? parseInt(selectedClientId, 10) : null;
  const { data: metaStatus } = useGetMetaStatus(clientIdNum);
  const { data: localCampaigns, isLoading: isLoadingLocal } = useListCampaigns(
    clientIdNum ? { clientId: clientIdNum } : undefined,
  );
  const { data: metaCampaigns, isLoading: isLoadingMeta, refetch: refetchMeta } = useGetMetaCampaigns(
    clientIdNum,
    Boolean(metaStatus?.connected),
  );
  const syncMeta = useSyncMetaFromFacebook();

  const [syncCooldown, setSyncCooldown] = useState(false);

  useEffect(() => {
    if (user?.role === "client" && user.clientId && !selectedClientId) {
      setSelectedClientId(String(user.clientId));
    }
  }, [user, selectedClientId]);
  const isLiveMeta = Boolean(metaStatus?.connected && metaCampaigns?.data?.length);

  const baseCampaigns: DisplayCampaign[] = useMemo(() => {
    if (isLiveMeta && metaCampaigns?.data) {
      return metaCampaigns.data.map((c, i) => ({
        id: c.id ?? `meta-${i}`,
        name: c.name ?? "Unnamed Campaign",
        status: (c.status?.toLowerCase() ?? "active") as DisplayCampaign["status"],
        platform: "Both" as const,
        objective: c.objective ?? "CONVERSIONS",
        spend: parseFloat(c.spend ?? "0"),
        impressions: 0,
        reach: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        roas: 0,
        dailyBudget: parseFloat(c.daily_budget ?? "0"),
        startDate: "2026-01-01",
      }));
    }

    if (localCampaigns && localCampaigns.length > 0) {
      return localCampaigns.map((c) => ({
        id: String(c.id),
        name: c.name,
        status: (c.status ?? "active") as DisplayCampaign["status"],
        platform: "Both" as const,
        objective: c.objective ?? "CONVERSIONS",
        spend: Number(c.spend ?? 0),
        impressions: c.impressions ?? Math.round(Number(c.spend ?? 0) * 70),
        reach: Math.round((c.impressions ?? 0) * 0.45),
        clicks: c.clicks ?? 0,
        conversions: c.conversions ?? 0,
        ctr: c.clicks && c.impressions ? (c.clicks / c.impressions) * 100 : 1.2,
        cpc: c.clicks ? Number(c.spend ?? 0) / c.clicks : 1.5,
        roas: Number(c.roas ?? 0),
        dailyBudget: Number(c.dailyBudget ?? 0),
        startDate: c.startDate ?? "2026-01-01",
      }));
    }

    return DEMO_AD_CAMPAIGNS;
  }, [isLiveMeta, metaCampaigns, localCampaigns]);

  const filteredCampaigns = useMemo(() => {
    return baseCampaigns.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (platformFilter !== "all" && c.platform !== platformFilter && c.platform !== "Both") return false;
      if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [baseCampaigns, statusFilter, platformFilter, searchQuery]);

  const stats = useMemo(() => computeAdStats(filteredCampaigns), [filteredCampaigns]);

  const spendTrend = useMemo(
    () =>
      filteredCampaigns.slice(0, 6).map((c) => ({
        name: c.name.split("—")[0].trim().slice(0, 12),
        spend: c.spend,
        roas: c.roas,
      })),
    [filteredCampaigns],
  );

  const handleSync = async () => {
    if (syncCooldown) {
      toast({ title: "Please wait", description: "Sync is on a 15-minute cooldown.", variant: "destructive" });
      return;
    }
    if (!metaStatus?.connected || !clientIdNum) {
      toast({ title: "Not connected", description: "Select a client and connect Meta Ads in Settings first.", variant: "destructive" });
      return;
    }
    try {
      const result = await syncMeta.mutateAsync(clientIdNum);
      await refetchMeta();
      queryClient.invalidateQueries({ queryKey: ["meta"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setSyncCooldown(true);
      setTimeout(() => setSyncCooldown(false), 15 * 60 * 1000);
      toast({
        title: "Synced from Meta",
        description: `${result.synced.campaigns} campaigns, ${result.synced.adsets} ad sets, ${result.synced.ads} ads imported.`,
      });
    } catch {
      toast({ title: "Sync failed", description: "Could not sync from Meta. Check your connection.", variant: "destructive" });
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  const formatNumber = (val: number) => new Intl.NumberFormat("en-US").format(val);

  const isLoading = metaStatus?.connected ? isLoadingMeta : isLoadingLocal;
  const dataSource = isLiveMeta ? "live" : localCampaigns?.length ? "local" : "demo";

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0A0A0A] tracking-tight">Facebook Ads Hub</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Paid social performance across Facebook & Instagram campaigns.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={selectedClientId || "all"} onValueChange={(v) => setSelectedClientId(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[200px] bg-white border-[#EDE6DA]">
              <SelectValue placeholder="All clients" />
            </SelectTrigger>
            <SelectContent>
              {user?.role === "admin" && <SelectItem value="all">All clients (sample view)</SelectItem>}
              {clients?.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleSync}
            disabled={!metaStatus?.connected || syncCooldown}
            className="gap-2 bg-primary hover:bg-primary/90 text-white"
          >
            <RefreshCw className="w-4 h-4" /> Sync from Meta
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {dataSource === "live" && (
          <Badge className="bg-primary/10 text-primary border-primary/25" variant="outline">
            Live Meta data · {metaStatus?.accountId}
          </Badge>
        )}
        {dataSource === "local" && (
          <Badge className="bg-white border-[#EDE6DA] text-foreground" variant="outline">
            Agency database
          </Badge>
        )}
        {dataSource === "demo" && (
          <Badge className="bg-[#F5F0E8] border-[#E87722]/30 text-[#E87722] gap-1" variant="outline">
            <Info className="w-3 h-3" />
            Sample data — connect Meta in Settings for live campaigns
          </Badge>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-white border-[#EDE6DA] shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[#F5F0E8]/50 border-[#EDE6DA]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] bg-white border-[#EDE6DA]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-full sm:w-[150px] bg-white border-[#EDE6DA]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="Both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPI row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {[
          { title: "Total Spend", value: formatCurrency(stats.totalSpend), icon: Activity },
          { title: "Impressions", value: formatNumber(stats.totalImpressions), icon: Eye },
          { title: "Reach", value: formatNumber(Math.round(stats.totalImpressions * 0.48)), icon: Users },
          { title: "Clicks", value: formatNumber(stats.totalClicks), icon: MousePointerClick },
          { title: "Conversions", value: formatNumber(stats.totalConversions), icon: TrendingUp },
          { title: "Avg CTR", value: `${stats.avgCtr.toFixed(2)}%`, icon: Target },
          { title: "Avg CPC", value: formatCurrency(stats.avgCpc), icon: MousePointerClick },
          { title: "Avg ROAS", value: `${stats.avgRoas.toFixed(2)}x`, icon: Zap },
        ].map((kpi) => (
          <Card key={kpi.title} className="bg-white border-[#EDE6DA] shadow-sm xl:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
              <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {kpi.title}
              </CardTitle>
              <kpi.icon className="w-3.5 h-3.5 text-primary shrink-0" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl font-bold text-[#0A0A0A]">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="bg-white border-[#EDE6DA] shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[#0A0A0A]">Spend by Campaign</CardTitle>
            <CardDescription>Top campaigns by ad spend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              {isLoading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spendTrend} layout="vertical" margin={{ left: 0, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EDE6DA" />
                    <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                    <YAxis dataKey="name" type="category" fontSize={10} tickLine={false} axisLine={false} width={90} />
                    <Tooltip
                      formatter={(v: number) => [formatCurrency(v), "Spend"]}
                      contentStyle={{ backgroundColor: "#fff", borderColor: "#EDE6DA", borderRadius: 8 }}
                    />
                    <Bar dataKey="spend" fill="#E87722" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#EDE6DA] shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[#0A0A0A]">ROAS Trend</CardTitle>
            <CardDescription>Return on ad spend by campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spendTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE6DA" />
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}x`} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", borderColor: "#EDE6DA", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="roas" stroke="#F97316" strokeWidth={2} dot={{ fill: "#E87722" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#EDE6DA] shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[#0A0A0A]">Quick Stats</CardTitle>
            <CardDescription>Filtered view summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-[#EDE6DA]">
              <span className="text-sm text-muted-foreground">Campaigns shown</span>
              <span className="font-semibold text-[#0A0A0A]">{filteredCampaigns.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#EDE6DA]">
              <span className="text-sm text-muted-foreground">Active campaigns</span>
              <span className="font-semibold text-primary">{stats.activeCount}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#EDE6DA]">
              <span className="text-sm text-muted-foreground">Cost per conversion</span>
              <span className="font-semibold text-[#0A0A0A]">
                {stats.totalConversions > 0
                  ? formatCurrency(stats.totalSpend / stats.totalConversions)
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Daily budget (active)</span>
              <span className="font-semibold text-[#0A0A0A]">
                {formatCurrency(
                  filteredCampaigns.filter((c) => c.status === "active").reduce((s, c) => s + c.dailyBudget, 0),
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-[#EDE6DA] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#0A0A0A]">Campaign Performance</CardTitle>
          <CardDescription>{filteredCampaigns.length} campaigns matching your filters</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#EDE6DA] hover:bg-transparent">
                <TableHead className="font-medium text-muted-foreground">Campaign</TableHead>
                <TableHead className="font-medium text-muted-foreground">Platform</TableHead>
                <TableHead className="font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="font-medium text-muted-foreground text-right">Spend</TableHead>
                <TableHead className="font-medium text-muted-foreground text-right">Impr.</TableHead>
                <TableHead className="font-medium text-muted-foreground text-right">Clicks</TableHead>
                <TableHead className="font-medium text-muted-foreground text-right">Conv.</TableHead>
                <TableHead className="font-medium text-muted-foreground text-right">CTR</TableHead>
                <TableHead className="font-medium text-muted-foreground text-right">ROAS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    No campaigns match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id} className="border-[#EDE6DA] hover:bg-[#F5F0E8]/50">
                    <TableCell>
                      <div className="font-medium text-[#0A0A0A]">{campaign.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{campaign.objective}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{campaign.platform}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${statusBadgeClass(campaign.status)}`}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(campaign.spend)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {campaign.impressions ? formatNumber(campaign.impressions) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {campaign.clicks ? formatNumber(campaign.clicks) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {campaign.conversions ? formatNumber(campaign.conversions) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {campaign.ctr ? `${campaign.ctr.toFixed(2)}%` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {campaign.roas ? `${campaign.roas.toFixed(2)}x` : "—"}
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
