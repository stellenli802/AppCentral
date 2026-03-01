import { useState } from "react";
import { useLocation } from "wouter";
import { useMiniApps } from "@/hooks/use-mini-apps";
import { RenderIcon } from "@/components/app-icon";
import type { MiniApp } from "@shared/schema";
import { Search, ArrowRight, Shield, Zap } from "lucide-react";

const FILTER_TABS = ["All", "Transit", "Parking", "Travel", "Entertainment", "Shopping"];

function AppCard({ app, onLaunch }: { app: MiniApp; onLaunch: () => void }) {
  return (
    <button
      className="w-full bg-secondary/30 rounded-xl p-4 text-left active:scale-[0.98] transition-transform"
      onClick={onLaunch}
      data-testid={`card-app-${app.id}`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: app.color }}
        >
          <RenderIcon iconName={app.icon} className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{app.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{app.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-muted-foreground/60 capitalize">{app.category}</span>
            <span className="text-[10px] text-muted-foreground/60">v{app.version}</span>
            <span className="text-[10px] text-muted-foreground/60">{app.developer}</span>
          </div>
          {app.permissions.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              {app.permissions.map((p) => (
                <span key={p} className="text-[9px] uppercase tracking-wider font-medium text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded">
                  {p.replace("_", " ")}
                </span>
              ))}
            </div>
          )}
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground/30 flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

export default function ExploreTab() {
  const { apps } = useMiniApps();
  const [, navigate] = useLocation();
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = apps.filter((app) => {
    const matchCat = activeFilter === "All" || app.category.toLowerCase() === activeFilter.toLowerCase();
    const matchSearch = !search || app.name.toLowerCase().includes(search.toLowerCase()) || app.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="px-5 pt-4 pb-6 space-y-5">
      <h1 className="text-xl font-bold text-foreground" data-testid="text-explore-heading">Explore</h1>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search mini-apps..."
          className="w-full h-10 bg-secondary/50 rounded-xl pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-1 focus:ring-primary/40"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-explore-search"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              activeFilter === tab
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/50 text-foreground/70"
            }`}
            onClick={() => setActiveFilter(tab)}
            data-testid={`filter-${tab.toLowerCase()}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3" data-testid="text-all-apps">
          {search ? "Results" : "All Mini-Apps"}
        </h2>
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No apps found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onLaunch={() => navigate(`/app/${app.id}?from=explore`)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="pt-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3" data-testid="text-platform-info">
          Platform
        </h2>
        <div className="bg-secondary/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <Shield className="h-4 w-4 text-primary flex-shrink-0" />
            <p className="text-xs text-foreground/80">Secure postMessage bridge with Zod validation</p>
          </div>
          <div className="flex items-center gap-2.5">
            <Zap className="h-4 w-4 text-primary flex-shrink-0" />
            <p className="text-xs text-foreground/80">Origin-verified iframe sandboxing</p>
          </div>
          <div className="flex items-center gap-2.5">
            <Shield className="h-4 w-4 text-primary flex-shrink-0" />
            <p className="text-xs text-foreground/80">Smart task routing with deep link fallback</p>
          </div>
        </div>
      </section>
    </div>
  );
}
