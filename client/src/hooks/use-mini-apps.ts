import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MiniApp } from "@shared/schema";

export function useMiniApps() {
  const { data: apps = [], isLoading } = useQuery<MiniApp[]>({
    queryKey: ["/api/mini-apps"],
  });

  return { apps, isLoading };
}

export function useFavorites() {
  const { data: favIds = [] } = useQuery<string[]>({
    queryKey: ["/api/favorites/ids"],
  });

  const addFav = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/favorites/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/favorites/ids"] }),
  });

  const removeFav = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/favorites/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/favorites/ids"] }),
  });

  const toggle = (id: string) => {
    if (favIds.includes(id)) removeFav.mutate(id);
    else addFav.mutate(id);
  };

  return { favIds, toggle, isFav: (id: string) => favIds.includes(id) };
}
