import { useState } from "react";
import { useListReports, useCreateReport } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Download, FileText, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { data: reports, isLoading, refetch } = useListReports();
  const createMutation = useCreateReport();
  const { toast } = useToast();

  const handleGenerate = () => {
    createMutation.mutate({
      data: {
        title: "Monthly Agency Performance Report",
        type: "monthly",
      }
    }, {
      onSuccess: () => {
        toast({ title: "Report Generation Started" });
        refetch();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Reports</h2>
          <p className="text-gray-400 text-sm">Client and agency-wide performance reports.</p>
        </div>
        <Button 
          onClick={handleGenerate}
          disabled={createMutation.isPending}
          className="bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          {createMutation.isPending ? "Starting..." : "Generate Report"}
        </Button>
      </div>

      <Card className="bg-[#13131a]/80 backdrop-blur border-white/5 shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-gray-400 font-medium w-[40px]"></TableHead>
                <TableHead className="text-gray-400 font-medium">Title</TableHead>
                <TableHead className="text-gray-400 font-medium">Type</TableHead>
                <TableHead className="text-gray-400 font-medium">Client</TableHead>
                <TableHead className="text-gray-400 font-medium">Status</TableHead>
                <TableHead className="text-gray-400 font-medium">Date</TableHead>
                <TableHead className="text-right w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell><Skeleton className="h-8 w-8 bg-white/5 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[200px] bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px] bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[120px] bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[70px] bg-white/5 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px] bg-white/5" /></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))
              ) : reports?.length === 0 ? (
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No reports generated yet.
                  </TableCell>
                </TableRow>
              ) : (
                reports?.map((report) => (
                  <TableRow key={report.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                    <TableCell>
                      <div className="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-indigo-400" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-200">{report.title}</TableCell>
                    <TableCell className="text-gray-400 capitalize">{report.type.replace('_', ' ')}</TableCell>
                    <TableCell className="text-gray-400">{report.clientName || 'Agency Wide'}</TableCell>
                    <TableCell>
                      {report.status === 'ready' && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Ready</Badge>}
                      {report.status === 'generating' && <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"><Clock className="w-3 h-3 mr-1" /> Generating</Badge>}
                      {report.status === 'pending' && <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>}
                      {report.status === 'failed' && <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>}
                    </TableCell>
                    <TableCell className="text-gray-400">{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {report.status === 'ready' && (
                        <Button variant="ghost" size="icon" className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
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