import { useState } from "react";
import { useListCampaigns, useGetInsightsSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Activity, Target, MousePointerClick, Zap } from "lucide-react";

export default function FacebookAds() {
  const { data: campaigns, isLoading: isLoadingCampaigns } = useListCampaigns();
  const { data: insights, isLoading: isLoadingInsights } = useGetInsightsSummary();

  const chartData = campaigns?.slice(0, 5).map(c => ({
    name: c.name.substring(0, 15) + "...",
    spend: c.spend || 0,
    roas: c.roas || 0,
  })) || [];

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Facebook Ads Hub</h2>
        <p className="text-gray-400 text-sm">Campaign structure and performance insights.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Spend", value: formatCurrency(insights?.totalSpend || 0), icon: Activity, color: "text-blue-400" },
          { title: "Avg CPC", value: formatCurrency(insights?.avgCpc || 0), icon: MousePointerClick, color: "text-amber-400" },
          { title: "Avg CTR", value: `${(insights?.avgCtr || 0).toFixed(2)}%`, icon: Target, color: "text-emerald-400" },
          { title: "Avg ROAS", value: `${(insights?.avgRoas || 0).toFixed(2)}x`, icon: Zap, color: "text-violet-400" },
        ].map((kpi, i) => (
          <Card key={kpi.title} className="bg-[#13131a]/80 backdrop-blur border-white/5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <kpi.icon className={`w-12 h-12 ${kpi.color}`} />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">{kpi.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingInsights ? (
                <Skeleton className="h-8 w-[100px] bg-white/5" />
              ) : (
                <div className="text-3xl font-bold text-white tracking-tight">{kpi.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 bg-[#13131a]/80 backdrop-blur border-white/5 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Top Spend by Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoadingCampaigns ? (
                <Skeleton className="h-full w-full bg-white/5 rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                    <YAxis dataKey="name" type="category" stroke="#666" fontSize={10} tickLine={false} axisLine={false} width={100} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#13131a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="spend" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-[#13131a]/80 backdrop-blur border-white/5 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-gray-400 font-medium">Campaign</TableHead>
                  <TableHead className="text-gray-400 font-medium text-right">Spend</TableHead>
                  <TableHead className="text-gray-400 font-medium text-right">Clicks</TableHead>
                  <TableHead className="text-gray-400 font-medium text-right">Conversions</TableHead>
                  <TableHead className="text-gray-400 font-medium text-right">ROAS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingCampaigns ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell><Skeleton className="h-4 w-[150px] bg-white/5" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-[60px] bg-white/5 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-[40px] bg-white/5 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-[40px] bg-white/5 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-[50px] bg-white/5 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : campaigns?.slice(0, 10).map((campaign) => (
                  <TableRow key={campaign.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                    <TableCell className="font-medium text-gray-200">{campaign.name}</TableCell>
                    <TableCell className="text-right text-gray-300">
                      {campaign.spend ? formatCurrency(campaign.spend) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-gray-300">{campaign.clicks?.toLocaleString() || '-'}</TableCell>
                    <TableCell className="text-right text-gray-300">{campaign.conversions?.toLocaleString() || '-'}</TableCell>
                    <TableCell className="text-right font-medium text-indigo-300">
                      {campaign.roas ? `${campaign.roas.toFixed(2)}x` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
