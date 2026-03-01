import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMiniApps, useFavorites } from "@/hooks/use-mini-apps";
import { useNotifications } from "@/hooks/use-notifications";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AppIcon, { RenderIcon } from "@/components/app-icon";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getRecentApps, getLastUsedApp } from "@/pages/mini-app-runner";
import type { Activity, MiniApp } from "@shared/schema";
import {
  Search, Bell, Settings, ChevronRight, Loader2, ExternalLink,
  Bus, Car, Truck, Play, Tag, Store, Clock, Zap, RotateCcw,
} from "lucide-react";

const ACTIVITY_ICONS: Record<string, typeof Bus> = {
  bus: Bus, parking: Car, play: Play, sale: Tag,
  truck: Truck, store: Store,
};

function ActivityPill({
  activities,
  apps,
  onTap,
}: {
  activities: Activity[];
  apps: Record<string, MiniApp>;
  onTap: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activities.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % activities.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activities.length]);

  if (activities.length === 0) return null;

  const current = activities[currentIndex];
  const app = apps[current.miniAppId];
  const color = app?.color || "#6366F1";
  const IconComponent = current.icon ? ACTIVITY_ICONS[current.icon] || Zap : Zap;

  return (
    <button
      className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-[20px] bg-black/80 backdrop-blur-xl active:bg-black/70 transition-all border border-white/[0.06] shadow-lg shadow-black/30"
      onClick={onTap}
      data-testid="button-activity-pill"
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color }}
      >
        <IconComponent className="h-3 w-3 text-white" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[11px] font-medium text-white/90 truncate" data-testid="text-pill-title">
          {current.title}
        </p>
        <p className="text-[9px] text-white/40 truncate">{app?.name || "Update"}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        {activities.length > 1 && (
          <div className="flex gap-0.5">
            {activities.map((_, i) => (
              <span
                key={i}
                className={`w-1 h-1 rounded-full transition-colors ${i === currentIndex ? "bg-white/70" : "bg-white/20"}`}
              />
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

function ResumePill({
  lastApp,
  onTap,
}: {
  lastApp: MiniApp;
  onTap: () => void;
}) {
  return (
    <button
      className="flex items-center gap-2 px-3 py-1.5 rounded-[16px] bg-black/70 backdrop-blur-xl active:bg-black/60 transition-all border border-white/[0.06] flex-shrink-0"
      onClick={onTap}
      data-testid="button-resume-pill"
      style={{ maxHeight: 40 }}
    >
      <RotateCcw className="h-3 w-3 text-white/50" />
      <span className="text-[11px] font-medium text-white/80 truncate max-w-[120px]">
        Resume: {lastApp.name}
      </span>
    </button>
  );
}

function RecentAppsTray({
  recentApps,
  onLaunch,
  pullProgress,
}: {
  recentApps: MiniApp[];
  onLaunch: (id: string) => void;
  pullProgress: number;
}) {
  if (recentApps.length === 0) return null;

  const opacity = Math.min(pullProgress, 1);
  const translateY = -20 + pullProgress * 20;
  const scale = 0.8 + pullProgress * 0.2;

  return (
    <div
      className="overflow-hidden transition-none"
      style={{
        height: pullProgress > 0.1 ? `${Math.min(pullProgress * 80, 80)}px` : 0,
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
      }}
    >
      <div className="flex items-center justify-center gap-4 py-3 px-4">
        {recentApps.map((app) => (
          <button
            key={app.id}
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
            style={{ backgroundColor: app.color }}
            onClick={() => onLaunch(app.id)}
            data-testid={`recent-app-${app.id}`}
          >
            <RenderIcon iconName={app.icon} className="h-5 w-5 text-white" />
          </button>
        ))}
      </div>
      <div className="flex justify-center pb-1">
        <div className="w-8 h-0.5 rounded-full bg-white/10" />
      </div>
    </div>
  );
}

function ActivityCard({
  activity,
  app,
  onTap,
}: {
  activity: Activity;
  app?: MiniApp;
  onTap: () => void;
}) {
  const IconComponent = activity.icon ? ACTIVITY_ICONS[activity.icon] || Clock : Clock;
  const color = app?.color || "#6366F1";
  const age = Date.now() - new Date(activity.createdAt!).getTime();
  const minsAgo = Math.floor(age / 60000);
  const timeLabel = minsAgo < 1 ? "Just now" : minsAgo < 60 ? `${minsAgo}m ago` : `${Math.floor(minsAgo / 60)}h ago`;

  return (
    <button
      className="w-full flex items-start gap-3 p-3.5 rounded-xl bg-secondary/40 active:bg-secondary/60 transition-colors text-left"
      onClick={onTap}
      data-testid={`activity-${activity.id}`}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color + "18" }}
      >
        <IconComponent className="h-5 w-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-foreground truncate">{activity.title}</p>
          <span className="text-[9px] text-muted-foreground flex-shrink-0">{timeLabel}</span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{activity.body}</p>
        {app && (
          <p className="text-[10px] mt-1 font-medium" style={{ color }}>
            {app.name}
          </p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-1" />
    </button>
  );
}

const EXTERNAL_PROVIDERS = [
  { name: "Uber", desc: "Request a ride", url: "https://m.uber.com", color: "#000" },
  { name: "Yelp", desc: "Find restaurants", url: "https://www.yelp.com", color: "#d32323" },
  { name: "Expedia", desc: "Book hotels", url: "https://www.expedia.com", color: "#00355f" },
];

export default function HomeTab() {
  const { user } = useAuth();
  const { apps, isLoading } = useMiniApps();
  const { favIds } = useFavorites();
  const { unreadCount } = useNotifications();
  const [, navigate] = useLocation();

  const { data: activityFeed = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
    refetchInterval: 15000,
  });

  const [pullProgress, setPullProgress] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [trayVisible, setTrayVisible] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ y: number; scrollTop: number } | null>(null);

  const getScrollParent = useCallback((): HTMLElement | null => {
    let el = wrapperRef.current?.parentElement;
    while (el) {
      const style = getComputedStyle(el);
      if (style.overflowY === "auto" || style.overflowY === "scroll") return el;
      el = el.parentElement;
    }
    return null;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollParent = getScrollParent();
    touchStartRef.current = {
      y: e.touches[0].clientY,
      scrollTop: scrollParent?.scrollTop || 0,
    };
  }, [getScrollParent]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const start = touchStartRef.current;
    if (!start) return;
    const scrollParent = getScrollParent();
    const scrollTop = scrollParent?.scrollTop || 0;

    if (scrollTop > 5) {
      if (isPulling) {
        setIsPulling(false);
        setPullProgress(0);
      }
      return;
    }

    const dy = e.touches[0].clientY - start.y;
    if (dy > 10 && start.scrollTop <= 0) {
      setIsPulling(true);
      const progress = Math.min(dy / 100, 1.2);
      setPullProgress(progress);
    }
  }, [isPulling, getScrollParent]);

  const handleTouchEnd = useCallback(() => {
    if (pullProgress > 0.6) {
      setTrayVisible(true);
      setPullProgress(1);
    } else {
      setTrayVisible(false);
      setPullProgress(0);
    }
    setIsPulling(false);
    touchStartRef.current = null;
  }, [pullProgress]);

  useEffect(() => {
    if (trayVisible) {
      const timer = setTimeout(() => {
        setTrayVisible(false);
        setPullProgress(0);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [trayVisible]);

  const favoriteApps = apps.filter((a) => favIds.includes(a.id));
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const firstName = user?.firstName || user?.email?.split("@")[0] || "there";

  const appMap = Object.fromEntries(apps.map((a) => [a.id, a]));

  const recentAppIds = getRecentApps().slice(0, 5);
  const recentApps = recentAppIds.map((r) => appMap[r.id]).filter(Boolean) as MiniApp[];

  const lastUsed = getLastUsedApp();
  const lastUsedApp = lastUsed ? appMap[lastUsed.id] : null;

  const hasActiveTasks = activityFeed.length > 0;
  const urgentActivities = activityFeed.slice(0, 2);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="px-5 pt-4 pb-6 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                {firstName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-base font-semibold text-foreground" data-testid="text-greeting">
                {greeting}, {firstName}
              </p>
              <p className="text-xs text-muted-foreground" data-testid="text-subtitle">
                What do you want to do?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary/60 relative"
              onClick={() => navigate("/messages")}
              data-testid="button-notifications"
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white px-1">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary/60"
              onClick={() => navigate("/profile")}
              data-testid="button-settings"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </header>

        {hasActiveTasks ? (
          <>
            <button
              className="w-full flex items-center gap-2.5 h-10 px-3.5 bg-secondary/50 rounded-xl text-sm text-muted-foreground"
              onClick={() => navigate("/search")}
              data-testid="button-home-search"
            >
              <Search className="h-4 w-4" />
              Search mini-apps, places, actions...
            </button>
            <ActivityPill
              activities={activityFeed}
              apps={appMap}
              onTap={() => navigate("/messages")}
            />
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              className="flex-1 flex items-center gap-2.5 h-10 px-3.5 bg-secondary/50 rounded-xl text-sm text-muted-foreground"
              onClick={() => navigate("/search")}
              data-testid="button-home-search"
            >
              <Search className="h-4 w-4" />
              Search mini-apps...
            </button>
            {lastUsedApp && (
              <ResumePill
                lastApp={lastUsedApp}
                onTap={() => navigate(`/app/${lastUsedApp.id}`)}
              />
            )}
          </div>
        )}

        <RecentAppsTray
          recentApps={recentApps}
          onLaunch={(id) => navigate(`/app/${id}`)}
          pullProgress={trayVisible ? 1 : pullProgress}
        />

        {[
          { label: "Transportation", cats: ["transit", "parking", "travel"] },
          { label: "Entertainment", cats: ["entertainment"] },
          { label: "Shopping", cats: ["shopping"] },
        ].map((section) => {
          const sectionApps = apps.filter((a) => section.cats.includes(a.category));
          if (sectionApps.length === 0) return null;
          return (
            <section key={section.label}>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3" data-testid={`text-section-${section.label.toLowerCase()}`}>
                {section.label}
              </h2>
              <div
                className={`grid gap-y-4 gap-x-2 justify-items-center ${
                  sectionApps.length <= 3 ? "grid-cols-3" : "grid-cols-4"
                }`}
              >
                {sectionApps.map((app) => (
                  <AppIcon key={app.id} app={app} onLaunch={() => navigate(`/app/${app.id}`)} />
                ))}
              </div>
            </section>
          );
        })}

        {urgentActivities.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" data-testid="text-section-highlights">
                Highlights
              </h2>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-muted-foreground">{activityFeed.length} active</span>
              </div>
            </div>
            <div className="space-y-2">
              {urgentActivities.map((act) => (
                <ActivityCard
                  key={act.id}
                  activity={act}
                  app={appMap[act.miniAppId]}
                  onTap={() => navigate(`/app/${act.miniAppId}`)}
                />
              ))}
            </div>
            <button
              className="w-full mt-2.5 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-primary rounded-xl bg-primary/5 active:bg-primary/10 transition-colors"
              onClick={() => navigate("/messages")}
              data-testid="button-view-all-activity"
            >
              View All Activity
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </section>
        )}

        {favoriteApps.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" data-testid="text-section-favs">
                Favorites
              </h2>
              <button
                className="flex items-center gap-0.5 text-[11px] text-muted-foreground"
                onClick={() => navigate("/my-apps")}
                data-testid="button-more-favs"
              >
                More <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {favoriteApps.map((app) => (
                <div key={app.id} className="w-16 flex-shrink-0">
                  <AppIcon app={app} onLaunch={() => navigate(`/app/${app.id}`)} size="sm" />
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3" data-testid="text-section-external">
            External Services
          </h2>
          <div className="space-y-2">
            {EXTERNAL_PROVIDERS.map((p) => (
              <button
                key={p.name}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/30 active:bg-secondary/50 transition-colors text-left"
                onClick={() => window.open(p.url, "_blank")}
                data-testid={`external-${p.name.toLowerCase()}`}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 flex-shrink-0">
                  <ExternalLink className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">{p.desc}</p>
                </div>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded flex-shrink-0">
                  External
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
