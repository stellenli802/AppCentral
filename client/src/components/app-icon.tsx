import type { MiniApp } from "@shared/schema";
import {
  Plane, Layers, CloudSun,
  UtensilsCrossed, Bike, ShoppingBag, Building2,
} from "lucide-react";

function StreamFlixIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M7 4C7 4 17 4 17 4C19 4 19 6 17 8L12 14L17 20C19 22 17 22 15 20L7 10C5 8 5 4 7 4Z" fill="currentColor" />
    </svg>
  );
}

function StreamTVIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="4" width="20" height="14" rx="3" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9.5 8.5L16 12l-6.5 3.5V8.5z" fill="currentColor" />
    </svg>
  );
}

function TicketHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="6" width="16" height="10" rx="2" fill="currentColor" opacity="0.35" transform="rotate(-5 10 11)" />
      <rect x="6" y="8" width="16" height="10" rx="2" fill="currentColor" opacity="0.8" transform="rotate(5 14 13)" />
      <path d="M13 11v4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1.5 1.5" opacity="0.6" />
    </svg>
  );
}

function BullseyeMartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function PrimeCartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 4h2l1 2h13l-2 8H8L6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="9" cy="19" r="1.5" fill="currentColor" />
      <circle cx="17" cy="19" r="1.5" fill="currentColor" />
      <path d="M8 17c2-1.2 5-1.5 7-1.2l2.5 0.8" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function SparkMartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2l2.5 4.5h-5L12 2z" fill="#FFC220" />
      <path d="M12 22l-2.5-4.5h5L12 22z" fill="#FFC220" />
      <path d="M2 12l4.5-2.5v5L2 12z" fill="#FFC220" />
      <path d="M22 12l-4.5 2.5v-5L22 12z" fill="#FFC220" />
      <path d="M4.9 4.9l4.2 2.2-2 2L4.9 4.9z" fill="#FFC220" opacity="0.8" />
      <path d="M19.1 4.9l-2.2 4.2-2-2 4.2-2.2z" fill="#FFC220" opacity="0.8" />
      <path d="M4.9 19.1l2.2-4.2 2 2-4.2 2.2z" fill="#FFC220" opacity="0.8" />
      <path d="M19.1 19.1l-4.2-2.2 2-2 2.2 4.2z" fill="#FFC220" opacity="0.8" />
    </svg>
  );
}

function CityMoveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <rect x="5" y="8" width="14" height="8" rx="2" fill="currentColor" />
      <rect x="6" y="6" width="5" height="4" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="12" y="7" width="5" height="3" rx="1" fill="currentColor" opacity="0.7" />
      <circle cx="8.5" cy="17" r="1.5" fill="white" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="15.5" cy="17" r="1.5" fill="white" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
}

function SpotHeroIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" />
      <text x="12" y="12" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="sans-serif">P</text>
    </svg>
  );
}

const CUSTOM_ICONS: Record<string, (props: { className?: string }) => JSX.Element> = {
  StreamFlixIcon,
  StreamTVIcon,
  TicketHubIcon,
  BullseyeMartIcon,
  PrimeCartIcon,
  SparkMartIcon,
  CityMoveIcon,
  SpotHeroIcon,
};

export const ICON_MAP: Record<string, typeof Plane> = {
  Plane, CloudSun, UtensilsCrossed, Bike, ShoppingBag, Building2,
};

export function getAppIcon(iconName: string): typeof Plane | null {
  return ICON_MAP[iconName] || null;
}

export function getCustomIcon(iconName: string) {
  return CUSTOM_ICONS[iconName] || null;
}

export function RenderIcon({ iconName, className }: { iconName: string; className?: string }) {
  const CustomIcon = getCustomIcon(iconName);
  if (CustomIcon) return <CustomIcon className={className} />;
  const LucideIcon = getAppIcon(iconName);
  if (LucideIcon) return <LucideIcon className={className} />;
  return <Layers className={className} />;
}

export default function AppIcon({
  app,
  onLaunch,
  size = "md",
}: {
  app: MiniApp;
  onLaunch: () => void;
  size?: "sm" | "md";
}) {
  const LucideIcon = getAppIcon(app.icon);
  const CustomIcon = getCustomIcon(app.icon);
  const dim = size === "sm" ? "w-11 h-11" : "w-[52px] h-[52px]";
  const iconSize = size === "sm" ? "h-5 w-5" : "h-6 w-6";

  return (
    <button
      className="flex flex-col items-center gap-1.5 w-full active:scale-95 transition-transform duration-100"
      onClick={onLaunch}
      data-testid={`button-app-${app.id}`}
    >
      <div
        className={`${dim} rounded-2xl flex items-center justify-center`}
        style={{ backgroundColor: app.color }}
      >
        {CustomIcon ? (
          <CustomIcon className={`${iconSize} text-white`} />
        ) : LucideIcon ? (
          <LucideIcon className={`${iconSize} text-white`} />
        ) : (
          <Layers className={`${iconSize} text-white`} />
        )}
      </div>
      <span className="text-[11px] text-foreground/70 truncate w-full text-center leading-tight" data-testid={`text-app-name-${app.id}`}>
        {app.name}
      </span>
    </button>
  );
}
