import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface Delegation {
  id: string;
  delegatorId: string;
  delegateId: string;
  isActive: boolean;
  createdAt: string;
  revokedAt: string | null;
  delegateName?: string;
}

export function useDelegation() {
  return useQuery<{ delegation: Delegation | null }>({
    queryKey: ["delegations"],
    queryFn: () => apiFetch("/api/delegations"),
    staleTime: 30_000,
  });
}

export function useCreateDelegation() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string; delegation: Delegation }, Error, string>({
    mutationFn: async (delegateId: string) => {
      return apiFetch("/api/delegations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delegateId }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["delegations"] });
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      toast.success(data.message || "Delegation created");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Couldn't create delegation");
    },
  });
}

export function useRevokeDelegation() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string; success: boolean }, Error, void>({
    mutationFn: async () => {
      return apiFetch("/api/delegations", { method: "DELETE" });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["delegations"] });
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      toast.success(data.message || "Delegation revoked");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Couldn't revoke delegation");
    },
  });
}
