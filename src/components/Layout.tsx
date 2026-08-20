import { useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Home,
  Info,
  Lock,
  Moon,
  Sun,
  Target,
  MoreHorizontal,
} from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "../utils/config";
import { issuesData, attendanceData } from "../data";
import { useTheme } from "../utils/theme";
import { formatDate } from "../utils/formatters";
import { IssueWarningDot } from "./ui";

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="BDSTrack home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-card">
        <Activity size={20} aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block text-base font-extrabold tracking-tight text-ink">
          {APP_NAME}
        </span>
        <span className="hidden text-[10px] font-medium uppercase tracking-wider text-inkfaint sm:block">
          {APP_TAGLINE}
        </span>
      </span>
    </Link>
  );
}

function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-bg ${className}`}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
      <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}

export function MoreSheet({ onClose }: { onClose: () => void }) {
  const { theme, toggle } = useTheme();
  const issueCount = issuesData.issues.length;
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-label="More menu">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close menu"
      />
      <div className="absolute inset-x-0 bottom-0 animate-fade-up rounded-t-3xl bg-card p-4 pb-8 shadow-card-lg">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-inkfaint">
          More
        </p>
        <div className="space-y-1">
          <Link
            to="/issues"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-3 font-medium text-ink hover:bg-bg"
          >
            <AlertTriangle size={18} className="text-warning" aria-hidden />
            Data Issues
            <IssueWarningDot count={issueCount} className="ml-auto" />
          </Link>
          <Link
            to="/about"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-3 font-medium text-ink hover:bg-bg"
          >
            <Info size={18} className="text-info" aria-hidden />
            About
          </Link>
          <button
            type="button"
            onClick={() => {
              toggle();
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 font-medium text-ink hover:bg-bg"
          >
            {theme === "dark" ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <div className="mt-2 px-3 text-[11px] text-inkfaint">
            {attendanceData.meta.period.label} · Last updated {formatDate(attendanceData.meta.lastUpdated)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const issueCount = issuesData.issues.length;
  const location = useLocation();
  const navigate = useNavigate();

  const bottomNav = [
    { to: "/", label: "Home", icon: Home, end: true },
    { to: "/analytics", label: "Analytics", icon: Activity },
    { to: "/", label: "Target", icon: Target, target: true },
  ];

  const goTarget = () => {
    const scroll = () =>
      document.getElementById("target")?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (location.pathname === "/") {
      scroll();
    } else {
      navigate("/");
      setTimeout(scroll, 80);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* ---------- Desktop sidebar ---------- */}
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-card px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 flex-1 space-y-1" aria-label="Primary">
          <NavItem to="/" icon={Home} label="Home" end />
          <NavItem to="/analytics" icon={Activity} label="Analytics" />
          <NavItem to="/issues" icon={AlertTriangle} label="Issues" badge={issueCount} />
          <NavItem to="/about" icon={Info} label="About" />
        </nav>
        <div className="space-y-3">
          <ThemeToggle className="w-full justify-start" />
          <p className="px-2 text-[11px] leading-relaxed text-inkfaint">
            {APP_TAGLINE} · {attendanceData.meta.period.label}
          </p>
        </div>
      </aside>

      {/* ---------- Mobile top bar ---------- */}
      <header className="no-print sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Logo />
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-ink"
            aria-label="Open more menu"
          >
            <MoreHorizontal size={18} aria-hidden />
            {issueCount > 0 && <IssueWarningDot count={issueCount} />}
          </button>
        </div>
      </header>

      {/* ---------- Mobile bottom nav ---------- */}
      <nav
        className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 lg:hidden"
        aria-label="Bottom navigation"
      >
        <div className="mx-auto flex max-w-md items-center justify-around">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            const isTarget = item.target;
            const active =
              isTarget
                ? location.pathname === "/"
                : location.pathname === item.to;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                onClick={isTarget ? (e) => { e.preventDefault(); goTarget(); } : undefined}
                className={() =>
                  `flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition-colors ${
                    active ? "text-primary" : "text-inkfaint"
                  }`
                }
              >
                <Icon size={20} aria-hidden />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* ---------- Content ---------- */}
      <main className="min-h-screen pb-24 pt-4 lg:ml-60 lg:pb-10 lg:pt-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {children}
        </div>
        <footer className="no-print mx-auto mt-12 max-w-6xl px-4 pb-4 text-center text-xs text-inkfaint sm:px-6">
          {APP_NAME} · {APP_TAGLINE} · {attendanceData.meta.institution} ·{" "}
          {attendanceData.meta.period.label}
          <span className="mx-1.5">·</span>
          <Lock size={11} className="mr-0.5 inline" aria-hidden />
          Roll-number privacy gate — not authentication
        </footer>
      </main>

      {moreOpen && <MoreSheet onClose={() => setMoreOpen(false)} />}
    </div>
  );
}

function NavItem({
  to,
  icon: Icon,
  label,
  badge,
  end,
}: {
  to: string;
  icon: typeof Home;
  label: string;
  badge?: number;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive ? "bg-primary/10 text-primary" : "text-ink-soft hover:bg-bg hover:text-ink"
        }`
      }
    >
      <Icon size={18} aria-hidden />
      {label}
      {badge !== undefined && badge > 0 && <IssueWarningDot count={badge} className="ml-auto" />}
    </NavLink>
  );
}