import { useAuth } from "@/hooks/use-auth";
import { useDevMode } from "@/hooks/use-dev-mode";
import { useLocation } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  ChevronRight, Shield, CreditCard, User, Bell, Moon, HelpCircle,
  FileText, LogOut, Code, ToggleLeft, ToggleRight, Globe, Lock,
} from "lucide-react";

function SectionHeader({ label }: { label: string }) {
  return (
    <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1" data-testid={`section-${label.toLowerCase().replace(/\s/g, "-")}`}>
      {label}
    </h2>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  sublabel,
  onClick,
  iconColor,
  iconBg,
  testId,
  trailing,
}: {
  icon: typeof Shield;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  iconColor?: string;
  iconBg?: string;
  testId: string;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      className="w-full flex items-center gap-3 py-3 text-left active:bg-secondary/30 transition-colors"
      onClick={onClick}
      data-testid={testId}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconBg || "hsl(var(--secondary)/0.5)", color: iconColor || "hsl(var(--muted-foreground))" }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{label}</p>
        {sublabel && <p className="text-[11px] text-muted-foreground/60">{sublabel}</p>}
      </div>
      {trailing || <ChevronRight className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />}
    </button>
  );
}

export default function ProfileTab() {
  const { user, logout } = useAuth();
  const { devMode, toggleDevMode } = useDevMode();
  const [, navigate] = useLocation();

  const initials = user?.username?.slice(0, 2).toUpperCase() || "?";

  return (
    <div className="px-5 pt-6 pb-8 space-y-6">
      <div className="flex items-center gap-4" data-testid="profile-header">
        <Avatar className="h-16 w-16 ring-2 ring-primary/20">
          <AvatarImage src={user?.profileImage || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate" data-testid="text-profile-name">
            {user?.username || "User"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5" data-testid="text-profile-id">
            ID: {user?.id || "—"}
          </p>
          <p className="text-[11px] text-primary/80 mt-0.5">Platform Verified Account</p>
        </div>
      </div>

      <section>
        <SectionHeader label="Account" />
        <div className="bg-secondary/20 rounded-xl px-3 divide-y divide-border/10">
          <SettingsRow
            icon={User}
            label="Personal Information"
            sublabel="Name, username, profile"
            iconColor="#3B82F6"
            iconBg="#3B82F620"
            testId="profile-personal-info"
          />
          <SettingsRow
            icon={CreditCard}
            label="Payment Methods"
            sublabel="Cards, wallets, billing"
            iconColor="#10B981"
            iconBg="#10B98120"
            testId="profile-payment"
          />
          <SettingsRow
            icon={Globe}
            label="Linked Accounts"
            sublabel="Connected services"
            iconColor="#8B5CF6"
            iconBg="#8B5CF620"
            testId="profile-linked-accounts"
          />
        </div>
      </section>

      <section>
        <SectionHeader label="Privacy & Security" />
        <div className="bg-secondary/20 rounded-xl px-3 divide-y divide-border/10">
          <SettingsRow
            icon={Shield}
            label="App Permissions"
            sublabel="Manage location & identity access"
            onClick={() => navigate("/permissions?from=profile")}
            iconColor="#F59E0B"
            iconBg="#F59E0B20"
            testId="profile-permissions"
          />
          <SettingsRow
            icon={Lock}
            label="Security"
            sublabel="Authentication, sessions"
            iconColor="#EF4444"
            iconBg="#EF444420"
            testId="profile-security"
          />
          <SettingsRow
            icon={Bell}
            label="Notification Preferences"
            sublabel="Alerts, sounds, badges"
            iconColor="#EC4899"
            iconBg="#EC489920"
            testId="profile-notif-prefs"
          />
        </div>
      </section>

      <section>
        <SectionHeader label="Preferences" />
        <div className="bg-secondary/20 rounded-xl px-3 divide-y divide-border/10">
          <SettingsRow
            icon={Moon}
            label="Appearance"
            sublabel="Dark mode enabled"
            iconColor="#6366F1"
            iconBg="#6366F120"
            testId="profile-appearance"
            trailing={
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Dark</span>
            }
          />
          <button
            className="w-full flex items-center gap-3 py-3 text-left active:bg-secondary/30 transition-colors"
            onClick={toggleDevMode}
            data-testid="profile-devmode-toggle"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#14B8A620", color: "#14B8A6" }}
            >
              <Code className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">Developer Mode</p>
              <p className="text-[11px] text-muted-foreground/60">Bridge inspector, debug tools</p>
            </div>
            {devMode ? (
              <ToggleRight className="h-5 w-5 text-primary flex-shrink-0" />
            ) : (
              <ToggleLeft className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />
            )}
          </button>
        </div>
      </section>

      <section>
        <SectionHeader label="Support" />
        <div className="bg-secondary/20 rounded-xl px-3 divide-y divide-border/10">
          <SettingsRow
            icon={HelpCircle}
            label="Help & Support"
            sublabel="FAQ, contact us"
            iconColor="#06B6D4"
            iconBg="#06B6D420"
            testId="profile-help"
          />
          <SettingsRow
            icon={FileText}
            label="Terms & Privacy Policy"
            sublabel="Legal information"
            iconColor="#78716C"
            iconBg="#78716C20"
            testId="profile-legal"
          />
        </div>
      </section>

      <section className="pt-1">
        <button
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-destructive/80 active:text-destructive transition-colors rounded-xl bg-destructive/5"
          onClick={() => logout()}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
        <p className="text-center text-[10px] text-muted-foreground/40 mt-3">
          AppCentral v2.0.0
        </p>
      </section>
    </div>
  );
}
