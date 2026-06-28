import { useEffect, useState } from "react";
import { useListUsers, useListClients } from "@/api";
import { useGetMetaConfig, useGetMetaStatus, connectMetaAds } from "@/api/meta";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, UserCog, MoreHorizontal, ShieldAlert, Facebook, Link2, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const { data: users, isLoading } = useListUsers();
  const { data: clients } = useListClients();
  const { data: metaConfig } = useGetMetaConfig();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const clientIdNum = selectedClientId ? parseInt(selectedClientId, 10) : null;
  const { data: metaStatus, refetch: refetchMetaStatus } = useGetMetaStatus(clientIdNum);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const meta = params.get("meta");
    const clientId = params.get("clientId");
    const message = params.get("message");

    if (meta === "connected") {
      toast({ title: "Meta Ads connected", description: "Your ad account is now linked." });
      if (clientId) setSelectedClientId(clientId);
      refetchMetaStatus();
      window.history.replaceState({}, "", "/settings");
    } else if (meta === "error") {
      toast({ title: "Meta connection failed", description: message ?? "Unknown error", variant: "destructive" });
      window.history.replaceState({}, "", "/settings");
    }
  }, [toast, refetchMetaStatus]);

  const handleConnectMeta = () => {
    if (!metaConfig?.appId) {
      toast({ title: "Meta not configured", description: "Set META_APP_ID and META_APP_SECRET in backend .env", variant: "destructive" });
      return;
    }
    if (!clientIdNum) {
      toast({ title: "Select a client", description: "Choose which client to connect Meta Ads for.", variant: "destructive" });
      return;
    }
    connectMetaAds(metaConfig, clientIdNum);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm">Manage team access, Meta Ads connections, and platform configuration.</p>
      </div>

      <Card className="bg-white border-[#EDE6DA] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Meta Ads Setup Workflow</CardTitle>
          <CardDescription>
            Complete these steps in Meta Business Manager, then connect here. Payment and ad creation happen in Meta — AgencyOS imports and displays performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-3 sm:grid-cols-2 text-sm">
            {[
              { step: 1, title: "Setup payment", detail: "Add a payment method in Meta Ads Manager → Billing." },
              { step: 2, title: "Link media account", detail: "Connect Facebook Page + Instagram in Business Settings → Accounts." },
              { step: 3, title: "Create campaign", detail: "Build campaigns in Ads Manager or sync after OAuth." },
              { step: 4, title: "Create ad sets", detail: "Define targeting, budget, and schedule per ad set." },
              { step: 5, title: "Create ads", detail: "Add creative (headline, image/video, destination URL)." },
              { step: 6, title: "Run ads", detail: "Set status to Active in Meta or use Campaigns page pause/resume." },
              { step: 7, title: "Facebook Developer app", detail: "Register at developers.facebook.com, add Marketing API product." },
              { step: 8, title: "Fetch ad data", detail: "Connect below, then Sync from Meta on Facebook Ads page." },
              {
                step: 9,
                title: "Connection path",
                detail: `Settings → Connect Meta Ads → OAuth → ${metaConfig?.callbackPath ?? "/api/meta/callback"} → Facebook Ads dashboard`,
              },
            ].map(({ step, title, detail }) => (
              <li key={step} className="flex gap-3 p-3 rounded-lg bg-[#F5F0E8] border border-[#EDE6DA]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {step}
                </span>
                <div>
                  <p className="font-medium text-foreground">{title}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{detail}</p>
                </div>
              </li>
            ))}
          </ol>
          {metaConfig?.redirectUri && (
            <p className="text-xs text-muted-foreground mt-4">
              OAuth redirect URI: <code className="text-primary">{metaConfig.redirectUri}</code>
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Facebook className="w-5 h-5 text-primary" /> Meta Ads Connection
          </CardTitle>
          <CardDescription>Connect a Facebook/Instagram ad account to a client for live campaign data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-foreground">Client</label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="w-full sm:max-w-xs">
                  <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={String(client.id)}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleConnectMeta} className="gap-2">
              <Link2 className="w-4 h-4" /> Connect Meta Ads
            </Button>
          </div>

          {clientIdNum && (
            <div className="flex items-center gap-2 text-sm">
              {metaStatus?.connected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-foreground">Connected</span>
                  {metaStatus.accountId && (
                    <Badge variant="outline" className="text-primary border-primary/30">
                      {metaStatus.accountId}
                    </Badge>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">Not connected — click Connect Meta Ads to authorize.</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center">
            <UserCog className="w-5 h-5 mr-2 text-primary" /> Team Management
          </CardTitle>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" /> Invite User
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium">User</TableHead>
                <TableHead className="font-medium">Role</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Joined</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-8 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[70px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[60px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))
              ) : (
                users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatarUrl || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.role === "admin" && <ShieldAlert className="w-3 h-3 mr-1" />}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.isActive ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
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
