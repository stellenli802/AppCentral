import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";
import LandingPage from "@/pages/landing";
import AppShell from "@/components/app-shell";
import MiniAppRunner from "@/pages/mini-app-runner";
import Permissions from "@/pages/permissions";
import AddMiniApp from "@/pages/add-mini-app";
import SearchPage from "@/pages/search-tab";
import { Loader2 } from "lucide-react";

function AuthGate() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <Switch>
      <Route path="/app/:id" component={MiniAppRunner} />
      <Route path="/permissions" component={Permissions} />
      <Route path="/add-app" component={AddMiniApp} />
      <Route path="/search" component={SearchPage} />
      <Route path="/explore" component={() => <AppShell initialTab="explore" />} />
      <Route path="/messages" component={() => <AppShell initialTab="messages" />} />
      <Route path="/my-apps" component={() => <AppShell initialTab="myapps" />} />
      <Route path="/profile" component={() => <AppShell initialTab="profile" />} />
      <Route path="/" component={() => <AppShell initialTab="home" />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthGate />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
