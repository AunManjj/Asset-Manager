import { useState } from "react";
import { useListSlackLogs, useSendSlackMessage } from "@workspace/api-client-react";
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
    defaultValues: {
      channel: "#general",
      message: "",
    },
  });

  const onSubmit = (data: z.infer<typeof messageSchema>) => {
    sendMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Message Sent", description: `Sent to ${data.channel}` });
        form.reset({ ...data, message: "" });
        refetch();
      },
      onError: () => {
        toast({ title: "Failed to send", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Slack Integration</h2>
        <p className="text-gray-400 text-sm">Send manual alerts and view automated notification logs.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 bg-[#13131a]/80 backdrop-blur border-white/5 shadow-xl h-fit">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-[#E01E5A]" /> Send Alert
            </CardTitle>
            <CardDescription className="text-gray-400">Trigger a manual notification to a Slack channel.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="channel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Channel</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <Input placeholder="#general" {...field} className="pl-9 bg-black/40 border-white/10 text-white" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Type your alert message..." 
                          {...field} 
                          className="bg-black/40 border-white/10 text-white resize-none h-24" 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
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

        <Card className="md:col-span-2 bg-[#13131a]/80 backdrop-blur border-white/5 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Message Log</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-gray-400 font-medium">Time</TableHead>
                  <TableHead className="text-gray-400 font-medium">Channel</TableHead>
                  <TableHead className="text-gray-400 font-medium">Message</TableHead>
                  <TableHead className="text-gray-400 font-medium">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell><Skeleton className="h-4 w-[120px] bg-white/5" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px] bg-white/5" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[250px] bg-white/5" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[70px] bg-white/5 rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : logs?.length === 0 ? (
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      No messages logged.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs?.map((log) => (
                    <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                      <TableCell className="text-gray-400 text-xs">{new Date(log.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="font-medium text-indigo-300">{log.channel}</TableCell>
                      <TableCell className="text-gray-300 max-w-xs truncate" title={log.message}>{log.message}</TableCell>
                      <TableCell>
                        {log.status === 'sent' && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Sent</Badge>}
                        {log.status === 'failed' && <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20" title={log.errorMessage || ''}><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>}
                        {log.status === 'pending' && <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20">Pending</Badge>}
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