import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES } from "@shared/schema";
import { ChevronLeft, Code, Globe, Shield, CheckCircle, AlertCircle, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function AddMiniApp() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [origin, setOrigin] = useState("");
  const [category, setCategory] = useState<string>("transit");
  const [permLocation, setPermLocation] = useState(false);
  const [permAuth, setPermAuth] = useState(false);
  const [intentsInput, setIntentsInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isSameOrigin = url.startsWith("/") || url.startsWith(window.location.origin);
  const isVerified = isSameOrigin;

  const createApp = useMutation({
    mutationFn: async (data: object) => {
      const res = await apiRequest("POST", "/api/mini-apps", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mini-apps"] });
      toast({ title: "Mini-app added", description: `${name} has been registered.` });
      navigate("/");
    },
    onError: () => {
      toast({ title: "Failed to add mini-app", description: "Something went wrong.", variant: "destructive" });
    },
  });

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!description.trim()) e.description = "Description is required";
    if (!url.trim()) e.url = "Entry URL is required";
    else if (!url.startsWith("https://") && !url.startsWith("/")) {
      e.url = "Entry URL must use HTTPS or be a relative path";
    }
    if (!origin.trim() && !url.startsWith("/")) {
      e.origin = "Allowed origin is required for external URLs";
    }
    if (origin && url.startsWith("https://")) {
      try {
        const urlOrigin = new URL(url).origin;
        if (origin !== urlOrigin && origin !== "*") {
          e.origin = `Origin must match URL origin (${urlOrigin})`;
        }
      } catch {
        e.url = "Invalid URL format";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const permissions: string[] = [];
    if (permLocation) permissions.push("LOCATION");
    if (permAuth) permissions.push("AUTH_CODE");

    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const allowedOrigins = url.startsWith("/") ? ["*"] : [origin || "*"];
    const intents = intentsInput
      .split(",")
      .map((s) => s.trim().toUpperCase().replace(/\s+/g, "_"))
      .filter(Boolean);

    createApp.mutate({
      id,
      name: name.trim(),
      description: description.trim(),
      icon: "Code",
      color: "#6366f1",
      category,
      url: url.trim(),
      permissions,
      allowedOrigins,
      intents,
      version: "1.0.0",
      developer: "Custom",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl px-4 h-12 flex items-center gap-3 border-b border-border/20">
        <button onClick={() => navigate("/my-apps")} data-testid="button-add-back">
          <ChevronLeft className="h-5 w-5 text-primary" />
        </button>
        <h1 className="text-base font-semibold text-foreground" data-testid="text-add-title">Add Mini-App</h1>
        <span className="ml-auto px-2 py-0.5 bg-primary/10 rounded-md text-[10px] text-primary font-medium">Dev Mode</span>
      </header>

      <div className="px-5 pt-6 pb-8 space-y-6">
        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl">
          <Code className="h-4 w-4 text-primary flex-shrink-0" />
          <p className="text-xs text-muted-foreground">Register a custom mini-app. It will appear in the dashboard immediately.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input
              placeholder="My Mini-App"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 bg-secondary/30 border-border/20 rounded-xl text-sm"
              data-testid="input-app-name"
            />
            {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Input
              placeholder="A brief description of what your app does"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-10 bg-secondary/30 border-border/20 rounded-xl text-sm"
              data-testid="input-app-desc"
            />
            {errors.description && <p className="text-[11px] text-destructive">{errors.description}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Entry URL</Label>
            <Input
              placeholder="https://example.com/app or /mini-apps/my-app.html"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-10 bg-secondary/30 border-border/20 rounded-xl text-sm"
              data-testid="input-app-url"
            />
            {errors.url && <p className="text-[11px] text-destructive">{errors.url}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Allowed Origin</Label>
            <Input
              placeholder="https://example.com"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="h-10 bg-secondary/30 border-border/20 rounded-xl text-sm"
              data-testid="input-app-origin"
            />
            {errors.origin && <p className="text-[11px] text-destructive">{errors.origin}</p>}
            {url.startsWith("/") && (
              <p className="text-[11px] text-muted-foreground/60">Same-origin app — origin auto-set to wildcard</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-10 bg-secondary/30 border-border/20 rounded-xl text-sm" data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Permissions</Label>
            <div className="space-y-3 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={permLocation}
                  onCheckedChange={(v) => setPermLocation(!!v)}
                  data-testid="check-location"
                />
                <span className="text-sm text-foreground">Location</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={permAuth}
                  onCheckedChange={(v) => setPermAuth(!!v)}
                  data-testid="check-auth"
                />
                <span className="text-sm text-foreground">Auth Code</span>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Intents (comma-separated)</Label>
            <Input
              placeholder="FIND_PARKING, RESERVE_SPOT"
              value={intentsInput}
              onChange={(e) => setIntentsInput(e.target.value)}
              className="h-10 bg-secondary/30 border-border/20 rounded-xl text-sm"
              data-testid="input-app-intents"
            />
            <p className="text-[11px] text-muted-foreground/60">Declare what actions your app can handle. Used by the intent router.</p>
          </div>

          {name && (
            <div className="flex items-center gap-2 p-3 bg-secondary/20 rounded-xl">
              {isVerified ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                  <p className="text-[11px] text-green-400">Verified — same-origin app</p>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                  <p className="text-[11px] text-yellow-400">Unverified — external origin. All permissions default to denied.</p>
                </>
              )}
            </div>
          )}

          {name && url && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <FileJson className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground">Generated Manifest (app.json)</Label>
              </div>
              <pre className="text-[10px] text-foreground/60 bg-black/20 rounded-xl p-3 overflow-x-auto font-mono leading-relaxed" data-testid="text-manifest-preview">
{JSON.stringify({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  name: name.trim(),
  entryUrl: url.trim(),
  allowedOrigin: url.startsWith("/") ? "*" : (origin || "*"),
  permissions: [
    ...(permLocation ? ["location.coarse"] : []),
    ...(permAuth ? ["identity.basic"] : []),
  ],
  intents: intentsInput.split(",").map(s => s.trim().toUpperCase().replace(/\s+/g, "_")).filter(Boolean),
  sdk: "/sdk/v1.js",
}, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <Button
          className="w-full h-11 rounded-xl text-sm font-medium"
          onClick={handleSubmit}
          disabled={createApp.isPending}
          data-testid="button-validate-add"
        >
          <Shield className="h-4 w-4 mr-2" />
          {createApp.isPending ? "Adding..." : "Validate + Add Mini-App"}
        </Button>

        <div className="flex items-center gap-2 p-3 bg-secondary/20 rounded-xl">
          <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground">Only HTTPS + verified origins are accepted. All postMessage communication is schema-validated. SDK available at <code className="text-primary/80">/sdk/v1.js</code></p>
        </div>
      </div>
    </div>
  );
}
