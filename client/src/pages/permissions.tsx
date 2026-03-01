import { useLocation, useSearch } from "wouter";
import { useMiniApps } from "@/hooks/use-mini-apps";
import { usePermissions } from "@/hooks/use-permissions";
import { RenderIcon } from "@/components/app-icon";
import type { MiniApp } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, MapPin, Key, Shield, Loader2 } from "lucide-react";

function PermissionRow({
  app,
  permission,
  granted,
  onToggle,
}: {
  app: MiniApp;
  permission: string;
  granted: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${app.color}20`, color: app.color }}
      >
        <RenderIcon iconName={app.icon} className="h-4 w-4" />
      </div>
      <span className="flex-1 text-sm text-foreground">{app.name}</span>
      <Switch
        checked={granted}
        onCheckedChange={onToggle}
        data-testid={`switch-${permission}-${app.id}`}
      />
    </div>
  );
}

export default function Permissions() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const backTo = params.get("from") === "profile" ? "/profile" : "/my-apps";
  const { apps, isLoading: appsLoading } = useMiniApps();
  const { isGranted, setPermission, isLoading: permsLoading } = usePermissions();

  const locationApps = apps.filter((a) => a.permissions.includes("LOCATION"));
  const authApps = apps.filter((a) => a.permissions.includes("AUTH_CODE"));

  const handleToggle = (miniAppId: string, permission: string, currentlyGranted: boolean) => {
    setPermission.mutate({ miniAppId, permission, granted: !currentlyGranted });
  };

  if (appsLoading || permsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl px-4 h-12 flex items-center gap-3 border-b border-border/20">
        <button onClick={() => navigate(backTo)} data-testid="button-perm-back">
          <ChevronLeft className="h-5 w-5 text-primary" />
        </button>
        <h1 className="text-base font-semibold text-foreground" data-testid="text-perm-title">Permissions</h1>
      </header>

      <div className="px-5 pt-4 pb-8 space-y-7">
        <p className="text-xs text-muted-foreground">Manage what mini-apps can access. Toggling off will revoke the permission.</p>

        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5" data-testid="text-perm-location">
            <MapPin className="h-3 w-3" /> Location
          </h2>
          <div className="bg-secondary/30 rounded-xl px-3 divide-y divide-border/20">
            {locationApps.map((app) => {
              const granted = isGranted(app.id, "location") === true;
              return (
                <PermissionRow
                  key={app.id}
                  app={app}
                  permission="location"
                  granted={granted}
                  onToggle={() => handleToggle(app.id, "location", granted)}
                />
              );
            })}
            {locationApps.length === 0 && (
              <p className="text-xs text-muted-foreground/60 py-4 text-center">No apps require location</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5" data-testid="text-perm-auth">
            <Key className="h-3 w-3" /> Authentication
          </h2>
          <div className="bg-secondary/30 rounded-xl px-3 divide-y divide-border/20">
            {authApps.map((app) => {
              const granted = isGranted(app.id, "auth") === true;
              return (
                <PermissionRow
                  key={app.id}
                  app={app}
                  permission="auth"
                  granted={granted}
                  onToggle={() => handleToggle(app.id, "auth", granted)}
                />
              );
            })}
            {authApps.length === 0 && (
              <p className="text-xs text-muted-foreground/60 py-4 text-center">No apps require authentication</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5" data-testid="text-perm-security">
            <Shield className="h-3 w-3" /> Security
          </h2>
          <div className="bg-secondary/30 rounded-xl p-4 space-y-2.5">
            <p className="text-xs text-foreground/80 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Only verified mini-app origins allowed
            </p>
            <p className="text-xs text-foreground/80 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-primary" />
              All communications are Zod-validated
            </p>
            <p className="text-xs text-foreground/80 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Permissions persist per user in the database
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
