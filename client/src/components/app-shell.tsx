import { useState } from "react";
import { useLocation } from "wouter";
import { useNotifications } from "@/hooks/use-notifications";
import HomeTab from "@/pages/home-tab";
import ExploreTab from "@/pages/explore-tab";
import NotificationsTab from "@/pages/notifications-tab";
import MyAppsTab from "@/pages/my-apps-tab";
import ProfileTab from "@/pages/profile-tab";
import { Home, Compass, MessageSquare, Grid3X3, UserCircle } from "lucide-react";

type TabId = "home" | "explore" | "messages" | "myapps" | "profile";

const TABS: { id: TabId; label: string; icon: typeof Home; path: string }[] = [
  { id: "home", label: "Home", icon: Home, path: "/" },
  { id: "explore", label: "Explore", icon: Compass, path: "/explore" },
  { id: "messages", label: "Activity", icon: MessageSquare, path: "/messages" },
  { id: "myapps", label: "My Apps", icon: Grid3X3, path: "/my-apps" },
  { id: "profile", label: "Profile", icon: UserCircle, path: "/profile" },
];

export default function AppShell({ initialTab }: { initialTab: TabId }) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [, navigate] = useLocation();
  const { unreadCount } = useNotifications();

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    const t = TABS.find((t) => t.id === tab);
    if (t) navigate(t.path, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 overflow-y-auto pb-16">
        {activeTab === "home" && <HomeTab />}
        {activeTab === "explore" && <ExploreTab />}
        {activeTab === "messages" && <NotificationsTab />}
        {activeTab === "myapps" && <MyAppsTab />}
        {activeTab === "profile" && <ProfileTab />}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border/30" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors relative ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => handleTabChange(tab.id)}
                data-testid={`tab-${tab.id}`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.5} />
                  {tab.id === "messages" && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[14px] h-3.5 flex items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white px-1">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
