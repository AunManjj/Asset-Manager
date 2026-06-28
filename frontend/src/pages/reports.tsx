import { useListReports, useCreateReport } from "@/api";
import { Card, CardContent } from "@/components/ui/card";
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
    createMutation.mutate(
      {
        data: {
          title: "Monthly Agency Performance Report",
          type: "monthly",
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Report Generation Started" });
          refetch();
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Reports</h2>
          <p className="text-muted-foreground text-sm mt-1">Client and agency-wide performance reports.</p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={createMutation.isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          {createMutation.isPending ? "Starting..." : "Generate Report"}
        </Button>
      </div>

      <Card className="bg-white border-[#EDE6DA] shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#F5F0E8]/50">
              <TableRow className="border-[#EDE6DA] hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium w-[40px]"></TableHead>
                <TableHead className="text-muted-foreground font-medium">Title</TableHead>
                <TableHead className="text-muted-foreground font-medium">Type</TableHead>
                <TableHead className="text-muted-foreground font-medium">Client</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium">Date</TableHead>
                <TableHead className="text-right w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-[#EDE6DA]">
                    <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))
              ) : reports?.length === 0 ? (
                <TableRow className="border-[#EDE6DA] hover:bg-transparent">
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No reports generated yet.
                  </TableCell>
                </TableRow>
              ) : (
                reports?.map((report) => (
                  <TableRow key={report.id} className="border-[#EDE6DA] hover:bg-[#F5F0E8]/40 transition-colors">
                    <TableCell>
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{report.title}</TableCell>
                    <TableCell className="text-muted-foreground capitalize">{report.type.replace("_", " ")}</TableCell>
                    <TableCell className="text-muted-foreground">{report.clientName || "Agency Wide"}</TableCell>
                    <TableCell>
                      {report.status === "ready" && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/25">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Ready
                        </Badge>
                      )}
                      {report.status === "generating" && (
                        <Badge variant="outline" className="bg-[#F97316]/10 text-[#E87722] border-[#F97316]/25 animate-pulse">
                          <Clock className="w-3 h-3 mr-1" /> Generating
                        </Badge>
                      )}
                      {report.status === "pending" && (
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                          <Clock className="w-3 h-3 mr-1" /> Pending
                        </Badge>
                      )}
                      {report.status === "failed" && (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/25">
                          <XCircle className="w-3 h-3 mr-1" /> Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {report.status === "ready" && (
                        <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80 hover:bg-primary/10">
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
