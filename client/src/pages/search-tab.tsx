import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useMiniApps } from "@/hooks/use-mini-apps";
import { RenderIcon } from "@/components/app-icon";
import { routeQuery, openExternalService } from "@/lib/task-router";
import type { RouteResult } from "@/lib/task-router";
import type { MiniApp } from "@shared/schema";
import {
  Search, X, TrendingUp, ArrowRight, ExternalLink, Zap, ChevronLeft,
} from "lucide-react";

const SUGGESTIONS = [
  "bus near me",
  "find parking near me",
  "flight check-in",
  "uber ride",
  "restaurant food",
  "hotel booking",
];

function ActionResult({ route, onAction }: { route: RouteResult; onAction: () => void }) {
  return (
    <button
      className="w-full flex items-center gap-3.5 p-3 rounded-xl bg-primary/5 border border-primary/10 text-left active:scale-[0.98] transition-transform"
      onClick={onAction}
      data-testid={`action-${route.label.toLowerCase().replace(/\s/g, "-")}`}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 flex-shrink-0">
        <Zap className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{route.label}</p>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded">
            Action
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground truncate">{route.description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-primary/40 flex-shrink-0" />
    </button>
  );
}

function MiniAppResult({ app, onLaunch }: { app: MiniApp; onLaunch: () => void }) {
  return (
    <button
      className="w-full flex items-center gap-3.5 p-3 rounded-xl bg-secondary/30 active:bg-secondary/60 transition-colors text-left"
      onClick={onLaunch}
      data-testid={`result-${app.id}`}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: app.color }}
      >
        <RenderIcon iconName={app.icon} className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">{app.name}</p>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-foreground/40 bg-secondary/60 px-1.5 py-0.5 rounded">
            Mini-App
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground truncate">{app.description.slice(0, 60)}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
    </button>
  );
}

function ExternalResult({ route, onAction }: { route: RouteResult; onAction: () => void }) {
  return (
    <button
      className="w-full flex items-center gap-3.5 p-3 rounded-xl bg-secondary/30 border border-border/10 text-left active:scale-[0.98] transition-transform"
      onClick={onAction}
      data-testid={`external-${route.label.toLowerCase().replace(/\s/g, "-")}`}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 flex-shrink-0">
        <ExternalLink className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{route.label}</p>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">
            External
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground truncate">{route.description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
    </button>
  );
}

export default function SearchTab() {
  const [query, setQuery] = useState("");
  const { apps } = useMiniApps();
  const [, navigate] = useLocation();

  const intentResult = useMemo(() => routeQuery(query), [query]);

  const appResults = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return apps.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }, [apps, query]);

  const handleRouteAction = (route: RouteResult) => {
    if (route.type === "mini-app") {
      navigate(`/app/${route.appId}?from=explore`);
    } else if (route.type === "action" && "appId" in route) {
      if (route.mode.startsWith("external-")) {
        const extMap: Record<string, { deepLink: string; webFallback: string }> = {
          "external-yelp": { deepLink: "yelp://", webFallback: "https://www.yelp.com/search" },
          "external-uber": { deepLink: "uber://", webFallback: "https://m.uber.com" },
        };
        const ext = extMap[route.mode];
        if (ext) openExternalService(ext);
      } else if (route.appId) {
        navigate(`/app/${route.appId}?mode=${route.mode}&from=explore`);
      }
    } else if (route.type === "external" && "deepLink" in route) {
      openExternalService({ deepLink: route.deepLink, webFallback: route.webFallback });
    }
  };

  const hasResults = intentResult.actions.length > 0 || intentResult.miniApps.length > 0 || intentResult.external.length > 0 || appResults.length > 0;

  const dedupedAppResults = appResults.filter(
    (a) => !intentResult.miniApps.some((r) => r.type === "mini-app" && r.appId === a.id)
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl px-4 h-12 flex items-center gap-3 border-b border-border/20">
        <button onClick={() => navigate("/")} data-testid="button-search-back">
          <ChevronLeft className="h-5 w-5 text-primary" />
        </button>
        <h1 className="text-base font-semibold text-foreground" data-testid="text-search-heading">Search</h1>
      </header>
    <div className="px-5 pt-4 pb-6 space-y-5">

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search mini-apps or actions..."
          className="w-full h-10 bg-secondary/50 rounded-xl pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-1 focus:ring-primary/40"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="input-search"
        />
        {query && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2"
            onClick={() => setQuery("")}
            data-testid="button-clear-search"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {!query ? (
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3" data-testid="text-suggested">
            Suggested
          </h2>
          <div className="space-y-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="w-full flex items-center gap-2.5 py-2.5 px-1 text-left text-sm text-foreground/70 hover:text-foreground transition-colors"
                onClick={() => setQuery(s)}
                data-testid={`suggestion-${s.replace(/\s/g, "-")}`}
              >
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/50" />
                {s}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <>
          {intentResult.actions.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3" data-testid="text-actions-section">
                Actions
              </h2>
              <div className="space-y-2">
                {intentResult.actions.map((route) => (
                  <ActionResult
                    key={route.label}
                    route={route}
                    onAction={() => handleRouteAction(route)}
                  />
                ))}
              </div>
            </section>
          )}

          {intentResult.miniApps.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3" data-testid="text-miniapps-section">
                Mini-Apps
              </h2>
              <div className="space-y-2">
                {intentResult.miniApps.map((route) => {
                  if (route.type !== "mini-app") return null;
                  const app = apps.find((a) => a.id === route.appId);
                  if (!app) return null;
                  return (
                    <MiniAppResult
                      key={app.id}
                      app={app}
                      onLaunch={() => navigate(`/app/${app.id}?from=explore`)}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {dedupedAppResults.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3" data-testid="text-app-results">
                More Results
              </h2>
              <div className="space-y-2">
                {dedupedAppResults.map((app) => (
                  <MiniAppResult
                    key={app.id}
                    app={app}
                    onLaunch={() => navigate(`/app/${app.id}?from=explore`)}
                  />
                ))}
              </div>
            </section>
          )}

          {intentResult.external.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3" data-testid="text-external-section">
                External Services
              </h2>
              <div className="space-y-2">
                {intentResult.external.map((route) => (
                  <ExternalResult
                    key={route.label}
                    route={route}
                    onAction={() => handleRouteAction(route)}
                  />
                ))}
              </div>
            </section>
          )}

          {!hasResults && (
            <div className="py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground" data-testid="text-no-results">No results found</p>
            </div>
          )}
        </>
      )}
    </div>
    </div>
  );
}
