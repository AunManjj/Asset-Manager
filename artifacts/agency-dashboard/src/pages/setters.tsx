import { useState } from "react";
import { useListSetterActivities } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { PhoneCall, Plus } from "lucide-react";

export default function Setters() {
  const { data: activities, isLoading } = useListSetterActivities();

  // Aggregate by date for chart
  const aggregatedData = activities?.reduce((acc, curr) => {
    const date = new Date(curr.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!acc[date]) {
      acc[date] = { date, outreach: 0, booked: 0 };
    }
    acc[date].outreach += curr.outreachCount;
    acc[date].booked += curr.callsBooked;
    return acc;
  }, {} as Record<string, { date: string, outreach: number, booked: number }>) || {};

  const chartData = Object.values(aggregatedData).slice(-14);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Setters Dashboard</h2>
          <p className="text-gray-400 text-sm">Track outreach and appointments booked.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
          <Plus className="w-4 h-4 mr-2" />
          Log Activity
        </Button>
      </div>

      <Card className="bg-[#13131a]/80 backdrop-blur border-white/5 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Outreach vs Calls Booked (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {isLoading ? (
              <Skeleton className="h-full w-full bg-white/5 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#13131a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="outreach" name="Outreach" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="booked" name="Calls Booked" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#13131a]/80 backdrop-blur border-white/5 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-gray-400 font-medium">Date</TableHead>
                <TableHead className="text-gray-400 font-medium">Setter</TableHead>
                <TableHead className="text-gray-400 font-medium text-right">Outreach</TableHead>
                <TableHead className="text-gray-400 font-medium text-right">Booked</TableHead>
                <TableHead className="text-gray-400 font-medium text-right">Show Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell><Skeleton className="h-4 w-[100px] bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[150px] bg-white/5" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-[40px] bg-white/5 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-[40px] bg-white/5 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-[50px] bg-white/5 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : activities?.length === 0 ? (
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No activities logged.
                  </TableCell>
                </TableRow>
              ) : (
                activities?.slice(0, 15).map((activity) => (
                  <TableRow key={activity.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                    <TableCell className="text-gray-300">{new Date(activity.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium text-gray-200">{activity.setterName}</TableCell>
                    <TableCell className="text-right text-gray-300">{activity.outreachCount}</TableCell>
                    <TableCell className="text-right text-gray-300">{activity.callsBooked}</TableCell>
                    <TableCell className="text-right font-medium text-indigo-300">
                      {activity.showRate}%
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