import { Button } from "@/components/ui/button";
import { Layers, ArrowRight, Shield, Zap, Compass } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-20 h-20 rounded-[22px] bg-primary flex items-center justify-center mb-8">
          <Layers className="h-10 w-10 text-primary-foreground" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2" data-testid="text-hero-heading">
          App Central
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-8" data-testid="text-hero-description">
          Your mini-app hub. Transit, parking, travel, and more — all in one place.
        </p>

        <div className="flex items-center justify-center gap-6 mb-10">
          {[
            { icon: Shield, label: "Secure" },
            { icon: Zap, label: "Instant" },
            { icon: Compass, label: "Smart" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                <Icon className="h-4.5 w-4.5 text-muted-foreground" />
              </div>
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        <Button
          size="lg"
          asChild
          className="w-full max-w-xs h-12 text-sm rounded-xl"
          data-testid="button-login"
        >
          <a href="/api/login" className="gap-2">
            Sign In to Continue
            <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </div>

      <footer className="pb-8 pt-4 text-center">
        <p className="text-[10px] text-muted-foreground/40" data-testid="text-footer">
          App Central
        </p>
      </footer>
    </div>
  );
}
