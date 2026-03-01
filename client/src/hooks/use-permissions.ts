import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AppPermission } from "@shared/schema";

export function usePermissions() {
  const { data: permissions = [], isLoading } = useQuery<AppPermission[]>({
    queryKey: ["/api/permissions"],
  });

  const setPermission = useMutation({
    mutationFn: (data: { miniAppId: string; permission: string; granted: boolean }) =>
      apiRequest("POST", "/api/permissions", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/permissions"] }),
  });

  const isGranted = (miniAppId: string, permission: string): boolean | null => {
    const p = permissions.find((p) => p.miniAppId === miniAppId && p.permission === permission);
    if (!p) return null;
    return p.granted;
  };

  return { permissions, isLoading, setPermission, isGranted };
}
