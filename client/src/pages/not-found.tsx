import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8">
      <div className="text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto" />
        <div>
          <p className="text-sm font-medium text-foreground" data-testid="text-404">Page Not Found</p>
          <p className="text-xs text-muted-foreground mt-1">This page doesn't exist.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate("/")} className="rounded-xl" data-testid="button-go-home">
          Go Home
        </Button>
      </div>
    </div>
  );
}
