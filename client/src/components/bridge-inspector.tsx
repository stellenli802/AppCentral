import { useState, useRef, useCallback, useEffect } from "react";
import {
  Terminal, ChevronDown, ChevronUp, Trash2, X,
  Shield, ShieldAlert, ArrowDown, ArrowUp,
} from "lucide-react";

export type BridgeLogEntry = {
  id: string;
  timestamp: number;
  direction: "inbound" | "outbound";
  type: string;
  origin: string;
  status: "allowed" | "blocked" | "error";
  payload: object;
};

export function useBridgeLogger() {
  const logsRef = useRef<BridgeLogEntry[]>([]);
  const [logs, setLogs] = useState<BridgeLogEntry[]>([]);

  const log = useCallback(
    (entry: Omit<BridgeLogEntry, "id" | "timestamp">) => {
      const newEntry: BridgeLogEntry = {
        ...entry,
        id: Math.random().toString(36).slice(2),
        timestamp: Date.now(),
      };
      logsRef.current = [newEntry, ...logsRef.current].slice(0, 200);
      setLogs([...logsRef.current]);
    },
    []
  );

  const clear = useCallback(() => {
    logsRef.current = [];
    setLogs([]);
  }, []);

  return { logs, log, clear };
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour12: false }) + "." + String(d.getMilliseconds()).padStart(3, "0");
}

function StatusBadge({ status }: { status: BridgeLogEntry["status"] }) {
  if (status === "allowed") return <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-medium">ALLOW</span>;
  if (status === "blocked") return <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">BLOCK</span>;
  return <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-medium">ERROR</span>;
}

function LogRow({ entry, expanded, onToggle }: { entry: BridgeLogEntry; expanded: boolean; onToggle: () => void }) {
  const DirIcon = entry.direction === "inbound" ? ArrowDown : ArrowUp;
  const dirColor = entry.direction === "inbound" ? "text-blue-400" : "text-purple-400";

  return (
    <div className="border-b border-border/10 last:border-b-0">
      <button
        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-secondary/20 transition-colors"
        onClick={onToggle}
        data-testid={`bridge-log-${entry.id}`}
      >
        <DirIcon className={`h-3 w-3 flex-shrink-0 ${dirColor}`} />
        <span className="text-[10px] text-muted-foreground/50 w-[72px] flex-shrink-0 font-mono">{formatTime(entry.timestamp)}</span>
        <span className="text-[11px] font-mono text-foreground/80 flex-1 truncate">{entry.type}</span>
        <StatusBadge status={entry.status} />
        {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground/30" /> : <ChevronDown className="h-3 w-3 text-muted-foreground/30" />}
      </button>
      {expanded && (
        <div className="px-3 pb-2 space-y-1">
          <div className="flex gap-4 text-[10px]">
            <span className="text-muted-foreground/50">Origin:</span>
            <span className="text-foreground/60 font-mono">{entry.origin}</span>
          </div>
          <pre className="text-[10px] text-foreground/50 font-mono bg-black/20 rounded p-2 overflow-x-auto max-h-32 overflow-y-auto">
            {JSON.stringify(entry.payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function BridgeInspector({
  logs,
  onClear,
}: {
  logs: BridgeLogEntry[];
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "allowed" | "blocked">("all");

  const filtered = filter === "all" ? logs : logs.filter((l) => l.status === filter);
  const blockedCount = logs.filter((l) => l.status === "blocked").length;

  if (!open) {
    return (
      <button
        className="fixed bottom-20 right-3 z-50 flex items-center gap-1.5 px-3 py-2 rounded-full bg-zinc-800 border border-zinc-700 shadow-lg text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
        onClick={() => setOpen(true)}
        data-testid="button-open-inspector"
      >
        <Terminal className="h-3.5 w-3.5" />
        Bridge
        {logs.length > 0 && (
          <span className="min-w-[18px] h-4 flex items-center justify-center rounded-full bg-primary/20 text-primary text-[9px] font-bold px-1">
            {logs.length}
          </span>
        )}
        {blockedCount > 0 && (
          <span className="min-w-[18px] h-4 flex items-center justify-center rounded-full bg-red-500/20 text-red-400 text-[9px] font-bold px-1">
            {blockedCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 max-h-[50vh] flex flex-col bg-zinc-900 border-t border-zinc-700 shadow-2xl" data-testid="bridge-inspector-panel">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 flex-shrink-0">
        <Terminal className="h-3.5 w-3.5 text-zinc-400" />
        <span className="text-xs font-semibold text-zinc-300 flex-1">Bridge Inspector</span>
        <div className="flex items-center gap-1">
          {(["all", "allowed", "blocked"] as const).map((f) => (
            <button
              key={f}
              className={`text-[9px] px-2 py-0.5 rounded font-medium transition-colors ${filter === f ? "bg-primary/20 text-primary" : "text-zinc-500 hover:text-zinc-300"}`}
              onClick={() => setFilter(f)}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        <button onClick={onClear} className="p-1 text-zinc-500 hover:text-zinc-300" data-testid="button-clear-inspector">
          <Trash2 className="h-3 w-3" />
        </button>
        <button onClick={() => setOpen(false)} className="p-1 text-zinc-500 hover:text-zinc-300" data-testid="button-close-inspector">
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-zinc-600 text-xs">
            {logs.length === 0 ? "No bridge messages yet" : "No matching messages"}
          </div>
        ) : (
          filtered.map((entry) => (
            <LogRow
              key={entry.id}
              entry={entry}
              expanded={expandedId === entry.id}
              onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
