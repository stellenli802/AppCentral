import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useNotifications } from "@/hooks/use-notifications";
import { useMiniApps } from "@/hooks/use-mini-apps";
import { RenderIcon } from "@/components/app-icon";
import type { Notification, MiniApp, Activity } from "@shared/schema";
import {
  CheckCheck, Loader2, Bell, Trash2, Zap,
  Bus, Car, Truck, Play, Tag, Store, Clock,
  CheckSquare, Square, X, MoreHorizontal,
} from "lucide-react";

const ACTIVITY_ICONS: Record<string, typeof Bus> = {
  bus: Bus, parking: Car, play: Play, sale: Tag,
  truck: Truck, store: Store,
};

function formatTimeAgo(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function SwipeableNotification({
  notification,
  app,
  onTap,
  onDelete,
  selectMode,
  selected,
  onToggleSelect,
}: {
  notification: Notification;
  app: MiniApp | undefined;
  onTap: () => void;
  onDelete: () => void;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const color = app?.color || "#6366f1";
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isHorizontalRef = useRef<boolean | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    setSwiping(true);
    isHorizontalRef.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping) return;
    const dx = e.touches[0].clientX - startXRef.current;
    const dy = e.touches[0].clientY - startYRef.current;

    if (isHorizontalRef.current === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        isHorizontalRef.current = Math.abs(dx) > Math.abs(dy);
      }
      return;
    }

    if (!isHorizontalRef.current) return;

    if (revealed) {
      const newOffset = -72 + dx;
      setOffsetX(Math.max(Math.min(newOffset, 0), -72));
    } else {
      if (dx < 0) setOffsetX(Math.max(dx, -72));
    }
  }, [swiping, revealed]);

  const handleTouchEnd = useCallback(() => {
    setSwiping(false);
    isHorizontalRef.current = null;
    if (offsetX < -40) {
      setOffsetX(-72);
      setRevealed(true);
    } else {
      setOffsetX(0);
      setRevealed(false);
    }
  }, [offsetX]);

  const handleDelete = useCallback(() => {
    setOffsetX(0);
    setRevealed(false);
    onDelete();
  }, [onDelete]);

  if (selectMode) {
    return (
      <button
        className={`w-full flex items-start gap-3 p-3.5 rounded-xl text-left transition-colors ${
          selected ? "bg-primary/10" : notification.isRead ? "bg-secondary/20" : "bg-secondary/40"
        }`}
        onClick={onToggleSelect}
        data-testid={`notification-${notification.id}`}
      >
        <div className="flex-shrink-0 mt-1">
          {selected ? (
            <CheckSquare className="text-primary" style={{ width: 18, height: 18 }} />
          ) : (
            <Square className="text-muted-foreground/40" style={{ width: 18, height: 18 }} />
          )}
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: color }}
        >
          {app ? <RenderIcon iconName={app.icon} className="h-4 w-4 text-white" /> : <Bell className="h-4 w-4 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[13px] font-medium text-foreground truncate">{notification.title}</p>
            {!notification.isRead && (
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground/80 line-clamp-2">{notification.body}</p>
        </div>
        <span className="text-[10px] text-muted-foreground/50 flex-shrink-0 mt-0.5">
          {formatTimeAgo(notification.createdAt)}
        </span>
      </button>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl" data-testid={`notification-${notification.id}`}>
      {revealed && (
        <div className="absolute inset-y-0 right-0 w-[72px] flex z-10">
          <button
            className="w-full h-full bg-destructive flex items-center justify-center rounded-r-xl active:bg-destructive/80 transition-colors"
            onClick={handleDelete}
            data-testid={`delete-notification-${notification.id}`}
          >
            <Trash2 className="h-4 w-4 text-white" />
          </button>
        </div>
      )}
      <div
        className={`relative rounded-xl ${
          notification.isRead ? "bg-secondary/20" : "bg-secondary/40"
        }`}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? "none" : "transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button
          className="w-full flex items-start gap-3 p-3.5 text-left active:bg-secondary/50 transition-colors"
          onClick={revealed ? () => { setOffsetX(0); setRevealed(false); } : onTap}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: color }}
          >
            {app ? <RenderIcon iconName={app.icon} className="h-4 w-4 text-white" /> : <Bell className="h-4 w-4 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[13px] font-medium text-foreground truncate">{notification.title}</p>
              {!notification.isRead && (
                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground/80 line-clamp-2">{notification.body}</p>
          </div>
          <span className="text-[10px] text-muted-foreground/50 flex-shrink-0 mt-0.5">
            {formatTimeAgo(notification.createdAt)}
          </span>
        </button>
      </div>
    </div>
  );
}

function LiveActivityCard({
  activity,
  app,
  onTap,
}: {
  activity: Activity;
  app?: MiniApp;
  onTap: () => void;
}) {
  const IconComponent = activity.icon ? ACTIVITY_ICONS[activity.icon] || Zap : Zap;
  const color = app?.color || "#6366F1";
  const age = Date.now() - new Date(activity.createdAt!).getTime();
  const minsAgo = Math.floor(age / 60000);
  const timeLabel = minsAgo < 1 ? "Just now" : minsAgo < 60 ? `${minsAgo}m ago` : `${Math.floor(minsAgo / 60)}h ago`;

  return (
    <button
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/5 active:bg-primary/10 transition-colors text-left"
      onClick={onTap}
      data-testid={`live-activity-${activity.id}`}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color + "20" }}
      >
        <IconComponent className="h-4 w-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{activity.title}</p>
        <p className="text-[11px] text-muted-foreground truncate">{activity.body}</p>
      </div>
      <span className="text-[9px] text-muted-foreground/50 flex-shrink-0">{timeLabel}</span>
    </button>
  );
}

type TabId = "all" | "activity";

export default function NotificationsTab() {
  const [, navigate] = useLocation();
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();
  const { apps } = useMiniApps();
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showActions, setShowActions] = useState(false);

  const { data: activityFeed = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
    refetchInterval: 15000,
  });

  const getApp = (id: string) => apps.find((a) => a.id === id);
  const appMap = Object.fromEntries(apps.map((a) => [a.id, a]));

  const handleTap = (notif: Notification) => {
    if (!notif.isRead) markAsRead.mutate(notif.id);
    navigate(`/app/${notif.miniAppId}?from=messages`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(notifications.map((n) => n.id)));
  };

  const handleBulkRead = async () => {
    const ids = Array.from(selectedIds);
    setSelectedIds(new Set());
    setSelectMode(false);
    for (const id of ids) {
      const notif = notifications.find((n) => n.id === id);
      if (notif && !notif.isRead) {
        try {
          await markAsRead.mutateAsync(id);
        } catch {}
      }
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    setSelectedIds(new Set());
    setSelectMode(false);
    for (const id of ids) {
      try {
        await deleteNotification.mutateAsync(id);
      } catch {}
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const groupedNotifications = notifications.reduce<Record<string, Notification[]>>((acc, n) => {
    if (!acc[n.miniAppId]) acc[n.miniAppId] = [];
    acc[n.miniAppId].push(n);
    return acc;
  }, {});

  const sortedGroups = Object.entries(groupedNotifications).sort(([, a], [, b]) => {
    const aTime = Math.max(...a.map((n) => new Date(n.createdAt || 0).getTime()));
    const bTime = Math.max(...b.map((n) => new Date(n.createdAt || 0).getTime()));
    return bTime - aTime;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-3 pb-6 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-foreground flex-shrink-0" data-testid="text-messages-heading">Activity</h1>
        {selectMode ? (
          <div className="flex items-center gap-2">
            <button
              className="text-[11px] text-primary px-2 py-1"
              onClick={selectedIds.size === notifications.length ? () => setSelectedIds(new Set()) : selectAll}
              data-testid="button-select-all"
            >
              {selectedIds.size === notifications.length ? "Deselect" : "All"}
            </button>
            <button
              className="w-7 h-7 flex items-center justify-center rounded-full bg-secondary/40"
              onClick={exitSelectMode}
              data-testid="button-exit-select"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {notifications.length > 0 && (
              <button
                className="flex items-center gap-1 text-[11px] text-foreground/60 px-2 py-1 rounded-full bg-secondary/30 active:bg-secondary/50 transition-colors"
                onClick={() => setSelectMode(true)}
                data-testid="button-select-mode"
              >
                <CheckSquare className="h-3 w-3" />
                Select
              </button>
            )}
            <button
              className="w-7 h-7 flex items-center justify-center rounded-full bg-secondary/30 active:bg-secondary/50 transition-colors"
              onClick={() => setShowActions(!showActions)}
              data-testid="button-actions-menu"
            >
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      {showActions && !selectMode && (
        <div className="flex items-center gap-2">
          <button
            className={`flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full transition-colors ${
              unreadCount > 0 ? "text-primary bg-primary/5 active:bg-primary/10" : "text-muted-foreground/30 bg-secondary/20"
            }`}
            onClick={() => { if (unreadCount > 0) { markAllAsRead.mutate(); setShowActions(false); } }}
            disabled={unreadCount === 0}
            data-testid="button-mark-all-read"
          >
            <CheckCheck className="h-3 w-3" />
            Read all
          </button>
          <button
            className={`flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full transition-colors ${
              notifications.length > 0 ? "text-destructive/70 bg-destructive/5 active:bg-destructive/10" : "text-muted-foreground/30 bg-secondary/20"
            }`}
            onClick={() => { if (notifications.length > 0) { clearAll.mutate(); setShowActions(false); } }}
            disabled={notifications.length === 0}
            data-testid="button-clear-all"
          >
            <Trash2 className="h-3 w-3" />
            Clear all
          </button>
        </div>
      )}

      {selectMode && selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/30 border border-border/20">
          <span className="text-[11px] text-foreground font-medium flex-1">
            {selectedIds.size} selected
          </span>
          <button
            className="flex items-center gap-1 text-[11px] text-primary px-2.5 py-1.5 rounded-full bg-primary/5 active:bg-primary/10 transition-colors"
            onClick={handleBulkRead}
            data-testid="button-bulk-read"
          >
            <CheckCheck className="h-3 w-3" />
            Read
          </button>
          <button
            className="flex items-center gap-1 text-[11px] text-destructive/70 px-2.5 py-1.5 rounded-full bg-destructive/5 active:bg-destructive/10 transition-colors"
            onClick={handleBulkDelete}
            data-testid="button-bulk-delete"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
      )}

      <div className="flex gap-1 bg-secondary/30 p-1 rounded-lg">
        <button
          className={`flex-1 text-center py-2 rounded-md text-xs font-medium transition-colors ${
            activeTab === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("all")}
          data-testid="tab-notifications"
        >
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </button>
        <button
          className={`flex-1 text-center py-2 rounded-md text-xs font-medium transition-colors ${
            activeTab === "activity" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("activity")}
          data-testid="tab-activity"
        >
          Live Activity {activityFeed.length > 0 && `(${activityFeed.length})`}
        </button>
      </div>

      {activeTab === "all" ? (
        notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground" data-testid="text-no-notifs">All caught up</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              When mini-apps have updates, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {sortedGroups.map(([appId, notifs]) => {
              const app = getApp(appId);
              const color = app?.color || "#6366f1";
              return (
                <section key={appId}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {app ? (
                        <RenderIcon iconName={app.icon} className="h-3 w-3 text-white" />
                      ) : (
                        <Bell className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-foreground">{app?.name || appId}</span>
                    <span className="text-[10px] text-muted-foreground/50">{notifs.length}</span>
                  </div>
                  <div className="space-y-1.5">
                    {notifs.map((notif) => (
                      <SwipeableNotification
                        key={notif.id}
                        notification={notif}
                        app={app}
                        onTap={() => handleTap(notif)}
                        onDelete={() => deleteNotification.mutate(notif.id)}
                        selectMode={selectMode}
                        selected={selectedIds.has(notif.id)}
                        onToggleSelect={() => toggleSelect(notif.id)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )
      ) : (
        activityFeed.length === 0 ? (
          <div className="py-16 text-center">
            <Zap className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground" data-testid="text-no-activity">No live activity</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Active updates from mini-apps will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {activityFeed.map((act) => (
              <LiveActivityCard
                key={act.id}
                activity={act}
                app={appMap[act.miniAppId]}
                onTap={() => navigate(`/app/${act.miniAppId}?from=messages`)}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
