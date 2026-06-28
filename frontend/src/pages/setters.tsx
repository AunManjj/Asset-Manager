import { useState } from "react";
import { useListSetterActivities, useCreateSetterActivity } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const chartTooltipStyle = {
  backgroundColor: "#FFFFFF",
  borderColor: "#EDE6DA",
  borderRadius: "8px",
  color: "#0A0A0A",
};

export default function Setters() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { data: activities, isLoading, refetch } = useListSetterActivities();
  const createMutation = useCreateSetterActivity();
  const isOwnView = user?.role === "setter";

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    outreachCount: 0,
    callsBooked: 0,
    showRate: 0,
    platform: "Instagram",
    notes: "",
  });

  const aggregatedData =
    activities?.reduce(
      (acc, curr) => {
        const date = new Date(curr.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
        if (!acc[date]) acc[date] = { date, outreach: 0, booked: 0 };
        acc[date].outreach += curr.outreachCount;
        acc[date].booked += curr.callsBooked;
        return acc;
      },
      {} as Record<string, { date: string; outreach: number; booked: number }>,
    ) ?? {};

  const chartData = Object.values(aggregatedData).slice(-14);

  const handleSubmit = () => {
    if (!user?.id) return;
    createMutation.mutate(
      {
        data: {
          setterId: user.id,
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
            {isOwnView ? "My Setter Dashboard" : "Setters Dashboard"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {isOwnView ? "Your outreach and appointments — private to you." : "Team-wide setter performance (admin view)."}
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
              <DialogTitle>Log Setter Activity</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Outreach</Label>
                  <Input type="number" value={form.outreachCount} onChange={(e) => setForm({ ...form, outreachCount: +e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Calls Booked</Label>
                  <Input type="number" value={form.callsBooked} onChange={(e) => setForm({ ...form, callsBooked: +e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Show Rate (%)</Label>
                <Input type="number" value={form.showRate} onChange={(e) => setForm({ ...form, showRate: +e.target.value })} />
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
          <CardTitle className="text-lg font-semibold text-foreground">Outreach vs Calls Booked (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDE6DA" />
                  <XAxis dataKey="date" stroke="#6B6560" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6B6560" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "#F5F0E8" }} />
                  <Bar dataKey="outreach" name="Outreach" fill="#E87722" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="booked" name="Calls Booked" fill="#F97316" radius={[4, 4, 0, 0]} />
                </BarChart>
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
                {!isOwnView && <TableHead className="text-muted-foreground font-medium">Setter</TableHead>}
                <TableHead className="text-muted-foreground font-medium text-right">Outreach</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Booked</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Show Rate</TableHead>
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
                  </TableRow>
                ))
              ) : activities?.length === 0 ? (
                <TableRow className="border-[#EDE6DA] hover:bg-transparent">
                  <TableCell colSpan={isOwnView ? 4 : 5} className="text-center py-8 text-muted-foreground">
                    No activities logged.
                  </TableCell>
                </TableRow>
              ) : (
                activities?.slice(0, 15).map((activity) => (
                  <TableRow key={activity.id} className="border-[#EDE6DA] hover:bg-[#F5F0E8]/40 transition-colors">
                    <TableCell className="text-foreground">{new Date(activity.date).toLocaleDateString()}</TableCell>
                    {!isOwnView && <TableCell className="font-medium text-foreground">{activity.setterName}</TableCell>}
                    <TableCell className="text-right text-foreground">{activity.outreachCount}</TableCell>
                    <TableCell className="text-right text-foreground">{activity.callsBooked}</TableCell>
                    <TableCell className="text-right font-medium text-primary">{activity.showRate}%</TableCell>
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
