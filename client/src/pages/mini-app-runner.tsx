import { useEffect, useRef, useCallback, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useFavorites } from "@/hooks/use-mini-apps";
import { usePermissions } from "@/hooks/use-permissions";
import { useDevMode } from "@/hooks/use-dev-mode";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { postMessageSchema } from "@shared/schema";
import type { MiniApp } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import PermissionModal, { type PermissionChoice } from "@/components/permission-modal";
import BridgeInspector, { useBridgeLogger } from "@/components/bridge-inspector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RenderIcon } from "@/components/app-icon";
import {
  ChevronDown, Loader2, AlertTriangle, MoreHorizontal,
  Star, ExternalLink, Flag, MapPin, Key, X,
} from "lucide-react";

type PendingPermission = {
  type: "location" | "auth";
  requestId: string;
};

type RateLimitBucket = { timestamps: number[] };

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  AUTH_CODE_REQUEST: { max: 3, windowMs: 30000 },
  LOCATION_REQUEST: { max: 5, windowMs: 30000 },
  NOTIFICATION_SEND: { max: 10, windowMs: 30000 },
  PUBLISH_ACTIVITY: { max: 15, windowMs: 30000 },
};

function saveRecentApp(appId: string, url?: string) {
  try {
    const raw = localStorage.getItem("miniapp-recents");
    const recents: { id: string; url?: string; ts: number }[] = raw ? JSON.parse(raw) : [];
    const filtered = recents.filter((r) => r.id !== appId);
    filtered.unshift({ id: appId, url, ts: Date.now() });
    localStorage.setItem("miniapp-recents", JSON.stringify(filtered.slice(0, 10)));
  } catch {}
}

export function getRecentApps(): { id: string; url?: string; ts: number }[] {
  try {
    const raw = localStorage.getItem("miniapp-recents");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLastUsedApp(): { id: string; url?: string; ts: number } | null {
  const recents = getRecentApps();
  return recents[0] || null;
}

export default function MiniAppRunner() {
  const [, params] = useRoute("/app/:id");
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { isFav, toggle } = useFavorites();
  const { isGranted, setPermission } = usePermissions();
  const { devMode } = useDevMode();
  const { toast } = useToast();
  const { logs, log: bridgeLog, clear: clearBridgeLogs } = useBridgeLogger();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [miniAppReady, setMiniAppReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [closing, setClosing] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  const fromPage = (() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const params = new URLSearchParams(search);
    const from = params.get("from");
    if (from === "messages") return "/messages";
    if (from === "explore") return "/explore";
    if (from === "my-apps") return "/my-apps";
    if (from === "profile") return "/profile";
    return "/";
  })();
  const verifiedOriginRef = useRef<string | null>(null);
  const [pendingPermission, setPendingPermission] = useState<PendingPermission | null>(null);
  const sessionGrantsRef = useRef<Set<string>>(new Set());
  const rateBucketsRef = useRef<Record<string, RateLimitBucket>>({});

  const { data: app, isLoading } = useQuery<MiniApp>({
    queryKey: ["/api/mini-apps", params?.id],
    enabled: !!params?.id,
  });

  const resolvedUrl = (() => {
    if (!app) return undefined;
    const recents = getRecentApps();
    const saved = recents.find((r) => r.id === app.id);
    return saved?.url || app.url;
  })();

  useEffect(() => {
    if (app) {
      saveRecentApp(app.id, app.url);
    }
  }, [app]);

  useEffect(() => {
    if (!app || !iframeRef.current) return;
    const interval = setInterval(() => {
      try {
        const iframeUrl = iframeRef.current?.contentWindow?.location?.href;
        if (iframeUrl && iframeUrl !== "about:blank") {
          const urlObj = new URL(iframeUrl);
          const path = urlObj.pathname + urlObj.search + urlObj.hash;
          saveRecentApp(app.id, path);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [app]);

  const checkRateLimit = useCallback((type: string): boolean => {
    const config = RATE_LIMITS[type];
    if (!config) return true;
    const now = Date.now();
    if (!rateBucketsRef.current[type]) {
      rateBucketsRef.current[type] = { timestamps: [] };
    }
    const bucket = rateBucketsRef.current[type];
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < config.windowMs);
    if (bucket.timestamps.length >= config.max) return false;
    bucket.timestamps.push(now);
    return true;
  }, []);

  const isOriginAllowed = useCallback(
    (origin: string): boolean => {
      if (!app) return false;
      if (app.allowedOrigins.includes("*")) return true;
      return app.allowedOrigins.includes(origin);
    },
    [app]
  );

  const sendToIframe = useCallback(
    (data: object) => {
      const targetOrigin = verifiedOriginRef.current || "*";
      iframeRef.current?.contentWindow?.postMessage(data, targetOrigin);
      if (devMode) {
        bridgeLog({
          direction: "outbound",
          type: (data as any).type || "unknown",
          origin: targetOrigin,
          status: "allowed",
          payload: data,
        });
      }
    },
    [devMode, bridgeLog]
  );

  const hasPermission = useCallback(
    (permName: "location" | "auth"): boolean | null => {
      if (!app) return false;
      const sessionKey = `${app.id}:${permName}`;
      if (sessionGrantsRef.current.has(sessionKey)) return true;
      return isGranted(app.id, permName);
    },
    [app, isGranted]
  );

  const handleLocationRequest = useCallback(
    (requestId: string) => {
      if (!("geolocation" in navigator)) {
        sendToIframe({ type: "HOST_ERROR", requestType: "LOCATION_REQUEST", code: "UNAVAILABLE", message: "Geolocation not available on this device" });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendToIframe({ type: "LOCATION_RESPONSE", requestId, latitude: position.coords.latitude, longitude: position.coords.longitude });
        },
        (err) => {
          sendToIframe({ type: "HOST_ERROR", requestType: "LOCATION_REQUEST", code: "BROWSER_DENIED", message: err.message || "Location access denied by browser" });
        }
      );
    },
    [sendToIframe]
  );

  const handleAuthRequest = useCallback(
    async (requestId: string) => {
      try {
        const res = await apiRequest("POST", "/api/auth-code");
        const data = await res.json();
        sendToIframe({
          type: "AUTH_CODE_RESPONSE",
          requestId,
          code: data.code,
          user: user ? {
            name: user.firstName || user.email?.split("@")[0] || "User",
            profileImage: user.profileImageUrl || null,
          } : null,
          token: `nexus_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        });
      } catch {
        sendToIframe({ type: "HOST_ERROR", requestType: "AUTH_CODE_REQUEST", code: "FAILED", message: "Failed to generate auth code" });
      }
    },
    [sendToIframe, user]
  );

  const handlePermissionChoice = useCallback(
    (choice: PermissionChoice) => {
      if (!pendingPermission || !app) return;
      const { type, requestId } = pendingPermission;
      setPendingPermission(null);

      if (choice === "deny") {
        sendToIframe({ type: "HOST_ERROR", requestType: type === "location" ? "LOCATION_REQUEST" : "AUTH_CODE_REQUEST", code: "DENIED", message: `${type} permission denied by user` });
        return;
      }

      if (choice === "always-allow") {
        setPermission.mutate({ miniAppId: app.id, permission: type, granted: true });
      }

      const sessionKey = `${app.id}:${type}`;
      sessionGrantsRef.current.add(sessionKey);

      if (type === "location") {
        handleLocationRequest(requestId);
      } else {
        handleAuthRequest(requestId);
      }
    },
    [pendingPermission, app, sendToIframe, setPermission, handleLocationRequest, handleAuthRequest]
  );

  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      if (!app || !iframeRef.current) return;

      const originAllowed = isOriginAllowed(event.origin);

      if (!originAllowed) {
        if (devMode) {
          bridgeLog({
            direction: "inbound",
            type: event.data?.type || "unknown",
            origin: event.origin,
            status: "blocked",
            payload: event.data || {},
          });
        }
        return;
      }

      const result = postMessageSchema.safeParse(event.data);
      if (!result.success) {
        if (devMode && event.data?.type) {
          bridgeLog({
            direction: "inbound",
            type: event.data?.type || "invalid",
            origin: event.origin,
            status: "blocked",
            payload: { error: "Schema validation failed", raw: event.data },
          });
        }
        return;
      }

      const msg = result.data;

      if (devMode) {
        bridgeLog({
          direction: "inbound",
          type: msg.type,
          origin: event.origin,
          status: "allowed",
          payload: msg as object,
        });
      }

      switch (msg.type) {
        case "READY":
          verifiedOriginRef.current = event.origin;
          setMiniAppReady(true);
          break;

        case "AUTH_CODE_REQUEST": {
          if (!checkRateLimit("AUTH_CODE_REQUEST")) {
            sendToIframe({ type: "HOST_ERROR", requestType: "AUTH_CODE_REQUEST", code: "RATE_LIMITED", message: "Too many auth requests. Please wait before trying again." });
            if (devMode) bridgeLog({ direction: "outbound", type: "HOST_ERROR", origin: event.origin, status: "blocked", payload: { code: "RATE_LIMITED" } });
            return;
          }
          if (!app.permissions.includes("AUTH_CODE")) {
            sendToIframe({ type: "HOST_ERROR", requestType: "AUTH_CODE_REQUEST", code: "NOT_DECLARED", message: "App does not declare AUTH_CODE permission" });
            return;
          }
          const authPerm = hasPermission("auth");
          if (authPerm === true) {
            await handleAuthRequest(msg.requestId);
          } else {
            setPendingPermission({ type: "auth", requestId: msg.requestId });
          }
          break;
        }

        case "LOCATION_REQUEST": {
          if (!checkRateLimit("LOCATION_REQUEST")) {
            sendToIframe({ type: "HOST_ERROR", requestType: "LOCATION_REQUEST", code: "RATE_LIMITED", message: "Too many location requests. Please wait before trying again." });
            if (devMode) bridgeLog({ direction: "outbound", type: "HOST_ERROR", origin: event.origin, status: "blocked", payload: { code: "RATE_LIMITED" } });
            return;
          }
          if (!app.permissions.includes("LOCATION")) {
            sendToIframe({ type: "HOST_ERROR", requestType: "LOCATION_REQUEST", code: "NOT_DECLARED", message: "App does not declare LOCATION permission" });
            return;
          }
          const locPerm = hasPermission("location");
          if (locPerm === true) {
            handleLocationRequest(msg.requestId);
          } else {
            setPendingPermission({ type: "location", requestId: msg.requestId });
          }
          break;
        }

        case "NOTIFICATION_SEND": {
          if (!checkRateLimit("NOTIFICATION_SEND")) {
            sendToIframe({ type: "NOTIFICATION_ACK", requestId: msg.requestId, success: false });
            if (devMode) bridgeLog({ direction: "outbound", type: "NOTIFICATION_ACK", origin: event.origin, status: "blocked", payload: { reason: "RATE_LIMITED" } });
            return;
          }
          try {
            await apiRequest("POST", "/api/notifications", {
              miniAppId: app.id,
              title: msg.title,
              body: msg.body,
              data: msg.data || {},
            });
            sendToIframe({ type: "NOTIFICATION_ACK", requestId: msg.requestId, success: true });
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
            queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
            toast({ title: app.name, description: msg.title });
          } catch {
            sendToIframe({ type: "NOTIFICATION_ACK", requestId: msg.requestId, success: false });
          }
          break;
        }

        case "PUBLISH_ACTIVITY": {
          if (!checkRateLimit("PUBLISH_ACTIVITY")) {
            sendToIframe({ type: "ACTIVITY_ACK", requestId: msg.requestId, success: false });
            return;
          }
          try {
            await apiRequest("POST", "/api/activities", {
              miniAppId: app.id,
              title: msg.title,
              body: msg.body,
              icon: msg.icon || null,
              data: msg.data || {},
              ttl: msg.ttl || 3600,
            });
            sendToIframe({ type: "ACTIVITY_ACK", requestId: msg.requestId, success: true });
            queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
            toast({ title: "Activity Published", description: msg.title });
          } catch {
            sendToIframe({ type: "ACTIVITY_ACK", requestId: msg.requestId, success: false });
          }
          break;
        }

        case "CLOSE":
          handleClose();
          break;
      }
    },
    [app, navigate, fromPage, isOriginAllowed, sendToIframe, hasPermission, handleLocationRequest, handleAuthRequest, toast, checkRateLimit, devMode, bridgeLog]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  const handleClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => navigate(fromPage), 280);
  }, [closing, navigate, fromPage]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="h-screen flex items-center justify-center bg-background px-8">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-sm text-foreground font-medium" data-testid="text-app-not-found">App not found</p>
          <Button variant="secondary" size="sm" onClick={() => navigate(fromPage)} className="rounded-xl" data-testid="button-back-home">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const appIsFav = isFav(app.id);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        style={{
          opacity: closing ? 0 : entered ? 1 : 0,
          transition: "opacity 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onClick={handleClose}
      />

      <div
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-background overflow-hidden"
        style={{
          top: 0,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          transform: closing
            ? "translateY(100%)"
            : entered
              ? "translateY(0)"
              : "translateY(100%)",
          transition: "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        data-testid="mini-app-runner"
      >
        <header
          className="flex items-center h-12 px-3 flex-shrink-0 border-b border-border/15"
          style={{ background: `linear-gradient(135deg, ${app.color}18, transparent)` }}
        >
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary/50 active:bg-secondary/80 transition-colors"
            onClick={handleClose}
            data-testid="button-back"
          >
            <ChevronDown className="text-foreground/70" style={{ width: 18, height: 18 }} />
          </button>

          <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: app.color }}
            >
              <RenderIcon iconName={app.icon} className="h-3 w-3 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-foreground truncate max-w-[140px]" data-testid="text-runner-app-name">
              {app.name}
            </span>
            <span className="text-[9px] text-muted-foreground/50 bg-secondary/40 px-1.5 py-0.5 rounded font-medium tracking-wide uppercase flex-shrink-0">
              mini-app
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                appIsFav ? "bg-primary/15" : "bg-secondary/50 active:bg-secondary/80"
              }`}
              onClick={() => {
                toggle(app.id);
                toast({
                  title: appIsFav ? "Removed from favorites" : "Added to favorites",
                  description: appIsFav ? `${app.name} unpinned` : `${app.name} pinned to your favorites`,
                });
              }}
              data-testid="button-runner-fav"
            >
              <Star
                className={`transition-colors ${appIsFav ? "text-primary fill-primary" : "text-foreground/50"}`}
                style={{ width: 15, height: 15 }}
              />
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary/50 active:bg-secondary/80 transition-colors"
              onClick={() => setShowActions(!showActions)}
              data-testid="button-runner-menu"
            >
              <MoreHorizontal className="text-foreground/50" style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </header>

        {showActions && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-secondary/20 border-b border-border/10">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/60 text-xs font-medium text-foreground/70 active:bg-secondary/80 transition-colors" data-testid="button-runner-open">
              <ExternalLink className="h-3 w-3" /> Open in browser
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/60 text-xs font-medium text-foreground/70 active:bg-secondary/80 transition-colors" data-testid="button-runner-report">
              <Flag className="h-3 w-3" /> Report
            </button>
            {app.permissions.length > 0 && (
              <div className="flex items-center gap-1.5 ml-auto">
                {app.permissions.map((p) => (
                  <Badge key={p} variant="secondary" className="text-[9px] px-1.5 py-0 rounded-full gap-1 font-normal h-5">
                    {p === "LOCATION" && <MapPin className="h-2 w-2" />}
                    {p === "AUTH_CODE" && <Key className="h-2 w-2" />}
                    {p.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 relative">
          {!miniAppReady && !loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1"
                  style={{ backgroundColor: app.color }}
                >
                  <RenderIcon iconName={app.icon} className="h-7 w-7 text-white" />
                </div>
                <Loader2 className="h-5 w-5 animate-spin text-white/30" />
                <p className="text-xs text-muted-foreground">Loading {app.name}...</p>
              </div>
            </div>
          )}
          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="text-center space-y-3">
                <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-foreground">Failed to load</p>
                <Button variant="secondary" size="sm" onClick={() => setLoadError(false)} className="rounded-xl" data-testid="button-retry">
                  Retry
                </Button>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={resolvedUrl || app.url}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title={app.name}
            onError={() => setLoadError(true)}
            data-testid="iframe-mini-app"
          />
        </div>

        {pendingPermission && (
          <PermissionModal
            appName={app.name}
            appColor={app.color}
            appIcon={app.icon}
            permissionType={pendingPermission.type}
            onChoice={handlePermissionChoice}
            user={user}
          />
        )}

        {devMode && (
          <BridgeInspector logs={logs} onClear={clearBridgeLogs} />
        )}
      </div>
    </>
  );
}
