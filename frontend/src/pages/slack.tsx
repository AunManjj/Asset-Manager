import { useListSlackLogs, useSendSlackMessage } from "@/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, Hash, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const messageSchema = z.object({
  channel: z.string().min(1, "Channel is required").startsWith("#", "Must start with #"),
  message: z.string().min(1, "Message is required"),
});

export default function SlackLog() {
  const { data: logs, isLoading, refetch } = useListSlackLogs();
  const sendMutation = useSendSlackMessage();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: { channel: "#general", message: "" },
  });

  const onSubmit = (data: z.infer<typeof messageSchema>) => {
    sendMutation.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: "Message Sent", description: `Sent to ${data.channel}` });
          form.reset({ ...data, message: "" });
          refetch();
        },
        onError: () => {
          toast({ title: "Failed to send", variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Slack Integration</h2>
        <p className="text-muted-foreground text-sm mt-1">Send manual alerts and view automated notification logs.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 bg-white border-[#EDE6DA] shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-[#E01E5A]" /> Send Alert
            </CardTitle>
            <CardDescription>Trigger a manual notification to a Slack channel.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="channel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Channel</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input placeholder="#general" {...field} className="pl-9 bg-white border-[#EDE6DA]" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Type your alert message..."
                          {...field}
                          className="bg-white border-[#EDE6DA] resize-none h-24"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={sendMutation.isPending}
                  className="w-full bg-[#E01E5A] hover:bg-[#C0164C] text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendMutation.isPending ? "Sending..." : "Send to Slack"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-white border-[#EDE6DA] shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Message Log</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-[#F5F0E8]/50">
                <TableRow className="border-[#EDE6DA] hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-medium">Time</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Channel</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Message</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-[#EDE6DA]">
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : logs?.length === 0 ? (
                  <TableRow className="border-[#EDE6DA] hover:bg-transparent">
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No messages logged.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs?.map((log) => (
                    <TableRow key={log.id} className="border-[#EDE6DA] hover:bg-[#F5F0E8]/40 transition-colors">
                      <TableCell className="text-muted-foreground text-xs">{new Date(log.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="font-medium text-primary">{log.channel}</TableCell>
                      <TableCell className="text-foreground max-w-xs truncate" title={log.message}>
                        {log.message}
                      </TableCell>
                      <TableCell>
                        {log.status === "sent" && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/25">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Sent
                          </Badge>
                        )}
                        {log.status === "failed" && (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/25" title={log.errorMessage || ""}>
                            <AlertCircle className="w-3 h-3 mr-1" /> Failed
                          </Badge>
                        )}
                        {log.status === "pending" && (
                          <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                            Pending
                          </Badge>
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
    </div>
  );
}
