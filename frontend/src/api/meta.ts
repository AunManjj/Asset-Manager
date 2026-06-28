import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface MetaConfig {
  appId: string;
  redirectUri: string;
  scopes: string;
  connectionPath?: string;
  oauthPath?: string;
  callbackPath?: string;
}

export interface MetaStatus {
  connected: boolean;
  accountId?: string;
  scopes?: string;
  expiresAt?: string | null;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: string;
  spend?: string;
}

export interface MetaCampaignsResponse {
  data?: MetaCampaign[];
  error?: { message: string };
}

export interface MetaSyncResponse {
  message: string;
  synced: { campaigns: number; adsets: number; ads: number };
}

export function useGetMetaConfig(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["meta", "config"],
    queryFn: () => customFetch<MetaConfig>("/api/meta/config"),
    enabled: options?.enabled ?? true,
  });
}

export function useGetMetaStatus(clientId: number | null) {
  return useQuery({
    queryKey: ["meta", "status", clientId],
    queryFn: () => customFetch<MetaStatus>(`/api/meta/status/${clientId}`),
    enabled: clientId != null && clientId > 0,
  });
}

export function useGetMetaCampaigns(clientId: number | null, enabled = true) {
  return useQuery({
    queryKey: ["meta", "campaigns", clientId],
    queryFn: () => customFetch<MetaCampaignsResponse>(`/api/meta/campaigns/${clientId}`),
    enabled: enabled && clientId != null && clientId > 0,
  });
}

export function useSyncMetaFromFacebook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientId: number) =>
      customFetch<MetaSyncResponse>(`/api/meta/sync/${clientId}`, { method: "POST" }),
    onSuccess: (_data, clientId) => {
      queryClient.invalidateQueries({ queryKey: ["meta"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["meta", "campaigns", clientId] });
    },
  });
}

export function connectMetaAds(config: MetaConfig, clientId: number) {
  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    scope: config.scopes,
    response_type: "code",
    state: String(clientId),
  });
  window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}
