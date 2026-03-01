import { useMiniApps, useFavorites } from "@/hooks/use-mini-apps";
import { useLocation } from "wouter";
import AppIcon, { RenderIcon } from "@/components/app-icon";
import type { MiniApp } from "@shared/schema";
import {
  Clock, Pin, ChevronRight, Loader2,
} from "lucide-react";

function RecentRow({ app, timeAgo, onLaunch }: { app: MiniApp; timeAgo: string; onLaunch: () => void }) {
  return (
    <button
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/30 active:bg-secondary/50 transition-colors text-left"
      onClick={onLaunch}
      data-testid={`recent-${app.id}`}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: app.color }}
      >
        <RenderIcon iconName={app.icon} className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{app.name}</p>
        <p className="text-[11px] text-muted-foreground/60 truncate">{app.description}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[11px] text-muted-foreground/60">{timeAgo}</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
      </div>
    </button>
  );
}

export default function MyAppsTab() {
  const { apps, isLoading } = useMiniApps();
  const { favIds } = useFavorites();
  const [, navigate] = useLocation();

  const favoriteApps = apps.filter((a) => favIds.includes(a.id));
  const recentApps = apps.slice(0, 4);
  const timeLabels = ["2 hrs ago", "yesterday", "3 days ago", "last week"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-4 pb-6 space-y-7">
      <div>
        <h1 className="text-xl font-bold text-foreground" data-testid="text-myapps-heading">My Apps</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your workspace</p>
      </div>

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5" data-testid="text-section-recent">
          <Clock className="h-3 w-3" /> Recently Used
        </h2>
        <div className="space-y-2">
          {recentApps.map((app, i) => (
            <RecentRow
              key={app.id}
              app={app}
              timeAgo={timeLabels[i] || "recently"}
              onLaunch={() => navigate(`/app/${app.id}?from=my-apps`)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5" data-testid="text-section-pinned">
          <Pin className="h-3 w-3" /> Pinned Favorites
        </h2>
        {favoriteApps.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 py-4 text-center" data-testid="text-no-pinned">
            No pinned apps yet. Favorite an app to pin it here.
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {favoriteApps.map((app) => (
              <div key={app.id} className="w-16 flex-shrink-0">
                <AppIcon app={app} onLaunch={() => navigate(`/app/${app.id}?from=my-apps`)} size="sm" />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3" data-testid="text-section-all">
          All Mini-Apps
        </h2>
        <div className="grid grid-cols-4 gap-y-4 gap-x-2 justify-items-center">
          {apps.map((app) => (
            <div key={app.id} className="flex-shrink-0">
              <AppIcon app={app} onLaunch={() => navigate(`/app/${app.id}?from=my-apps`)} size="sm" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
