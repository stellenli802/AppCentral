import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Shield, MapPin, User, Fingerprint } from "lucide-react";

export type PermissionChoice = "allow-once" | "always-allow" | "deny";

export default function PermissionModal({
  appName,
  appColor,
  appIcon,
  permissionType,
  onChoice,
  user,
}: {
  appName: string;
  appColor?: string;
  appIcon?: string;
  permissionType: "location" | "auth";
  onChoice: (choice: PermissionChoice) => void;
  user?: { id?: string; firstName?: string | null; email?: string | null; profileImageUrl?: string | null } | null;
}) {
  const isAuth = permissionType === "auth";

  const firstName = user?.firstName || user?.email?.split("@")[0] || "User";
  const initial = firstName[0]?.toUpperCase() || "U";
  const platformId = user?.id ? `AC-${user.id.slice(0, 8)}` : "AC-000000";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" data-testid="permission-modal">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onChoice("deny")} />
      <div
        className="relative bg-background rounded-t-2xl sm:rounded-2xl w-full max-w-sm animate-in slide-in-from-bottom-4 duration-200 overflow-hidden"
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
      >
        {isAuth ? (
          <>
            <div className="px-6 pt-6 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Fingerprint className="h-4 w-4 text-primary" />
                <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">Identity Request</p>
              </div>
              <p className="text-base font-semibold text-foreground">
                {appName} is requesting your profile info
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This will share your identity to sign you in.
              </p>
            </div>

            <div className="px-6 py-4">
              <div className="flex items-center gap-3.5 px-4 py-4 rounded-xl bg-secondary/30 border border-border/20">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback className="text-base bg-primary/10 text-primary font-bold">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{firstName}</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">AppCentral ID: {platformId}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Shield className="h-2.5 w-2.5 text-primary" />
                    <p className="text-[10px] text-primary/80 font-medium">Platform Verified</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-4 space-y-2.5">
              <Button
                className="w-full h-12 rounded-xl text-sm font-semibold"
                onClick={() => onChoice("always-allow")}
                data-testid="perm-always-allow"
              >
                <User className="h-4 w-4 mr-2" />
                Allow & Sign In
              </Button>

              <Button
                variant="secondary"
                className="w-full h-11 rounded-xl text-sm font-medium"
                onClick={() => onChoice("allow-once")}
                data-testid="perm-allow-once"
              >
                Allow Once
              </Button>

              <Button
                variant="ghost"
                className="w-full h-10 rounded-xl text-sm font-medium text-muted-foreground"
                onClick={() => onChoice("deny")}
                data-testid="perm-deny"
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <div className="px-6 pt-6 pb-4 space-y-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <MapPin className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">
                  {appName} is requesting your GPS location
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This will share your current GPS coordinates with the app.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-secondary/30 rounded-xl">
              <Shield className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <p className="text-[10px] text-muted-foreground">Origin validated. Manifest permissions verified.</p>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full h-11 rounded-xl text-sm font-medium"
                onClick={() => onChoice("always-allow")}
                data-testid="perm-always-allow"
              >
                Always Allow
              </Button>
              <Button
                variant="secondary"
                className="w-full h-11 rounded-xl text-sm font-medium"
                onClick={() => onChoice("allow-once")}
                data-testid="perm-allow-once"
              >
                Allow Once
              </Button>
              <Button
                variant="ghost"
                className="w-full h-11 rounded-xl text-sm font-medium text-destructive"
                onClick={() => onChoice("deny")}
                data-testid="perm-deny"
              >
                Deny
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
