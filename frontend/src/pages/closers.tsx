import { useState } from "react";
import { useListCloserActivities, useCreateCloserActivity } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const chartTooltipStyle = {
  backgroundColor: "#FFFFFF",
  borderColor: "#EDE6DA",
  borderRadius: "8px",
  color: "#0A0A0A",
};

export default function Closers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { data: activities, isLoading, refetch } = useListCloserActivities();
  const createMutation = useCreateCloserActivity();
  const isOwnView = user?.role === "closer";

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    callsTaken: 0,
    dealsWon: 0,
    revenue: 0,
    closeRate: 0,
    notes: "",
  });

  const aggregatedData =
    activities?.reduce(
      (acc, curr) => {
        const date = new Date(curr.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
        if (!acc[date]) acc[date] = { date, revenue: 0, closeRate: 0, count: 0 };
        acc[date].revenue += curr.revenue;
        acc[date].closeRate += curr.closeRate;
        acc[date].count += 1;
        return acc;
      },
      {} as Record<string, { date: string; revenue: number; closeRate: number; count: number }>,
    ) ?? {};

  const chartData = Object.values(aggregatedData)
    .map((d) => ({
      date: d.date,
      revenue: d.revenue,
      avgCloseRate: d.closeRate / d.count,
    }))
    .slice(-14);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  const handleSubmit = () => {
    if (!user?.id) return;
    createMutation.mutate(
      {
        data: {
          closerId: user.id,
          clientId: user.clientId ?? undefined,
          ...form,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Activity logged" });
          setOpen(false);
          refetch();
        },
        onError: () => toast({ title: "Failed to log activity", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            {isOwnView ? "My Closer Dashboard" : "Closers Dashboard"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {isOwnView ? "Your deals and revenue — private to you." : "Team-wide closer performance (admin view)."}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Log Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-[#EDE6DA]">
            <DialogHeader>
              <DialogTitle>Log Closer Activity</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Calls Taken</Label>
                  <Input type="number" value={form.callsTaken} onChange={(e) => setForm({ ...form, callsTaken: +e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Deals Won</Label>
                  <Input type="number" value={form.dealsWon} onChange={(e) => setForm({ ...form, dealsWon: +e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Revenue ($)</Label>
                  <Input type="number" value={form.revenue} onChange={(e) => setForm({ ...form, revenue: +e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Close Rate (%)</Label>
                  <Input type="number" value={form.closeRate} onChange={(e) => setForm({ ...form, closeRate: +e.target.value })} />
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Save Activity"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white border-[#EDE6DA] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Revenue & Close Rate Trend (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDE6DA" />
                  <XAxis dataKey="date" stroke="#6B6560" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#6B6560" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#6B6560" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#E87722" strokeWidth={3} dot={{ r: 4, fill: "#E87722", strokeWidth: 0 }} />
                  <Line yAxisId="right" type="monotone" dataKey="avgCloseRate" name="Close Rate" stroke="#F97316" strokeWidth={3} dot={{ r: 4, fill: "#F97316", strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-[#EDE6DA] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#F5F0E8]/50">
              <TableRow className="border-[#EDE6DA] hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">Date</TableHead>
                {!isOwnView && <TableHead className="text-muted-foreground font-medium">Closer</TableHead>}
                <TableHead className="text-muted-foreground font-medium text-right">Calls Taken</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Deals Won</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Close Rate</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-[#EDE6DA]">
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    {!isOwnView && <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>}
                    <TableCell className="text-right"><Skeleton className="h-4 w-[40px] ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-[40px] ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-[50px] ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-[70px] ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : activities?.length === 0 ? (
                <TableRow className="border-[#EDE6DA] hover:bg-transparent">
                  <TableCell colSpan={isOwnView ? 5 : 6} className="text-center py-8 text-muted-foreground">
                    No activities logged.
                  </TableCell>
                </TableRow>
              ) : (
                activities?.slice(0, 15).map((activity) => (
                  <TableRow key={activity.id} className="border-[#EDE6DA] hover:bg-[#F5F0E8]/40 transition-colors">
                    <TableCell className="text-foreground">{new Date(activity.date).toLocaleDateString()}</TableCell>
                    {!isOwnView && <TableCell className="font-medium text-foreground">{activity.closerName}</TableCell>}
                    <TableCell className="text-right text-foreground">{activity.callsTaken}</TableCell>
                    <TableCell className="text-right text-foreground">{activity.dealsWon}</TableCell>
                    <TableCell className="text-right font-medium text-primary">{activity.closeRate}%</TableCell>
                    <TableCell className="text-right text-[#E87722] font-medium">{formatCurrency(activity.revenue)}</TableCell>
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
