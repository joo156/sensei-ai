import { useState } from "react";
import { BrandMark } from "@/components/app/BrandMark";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  BarChart3,
  Check,
  ChevronsUpDown,
  Command as CommandIcon,
  FileStack,
  History,
  Home,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  SquareTerminal,
  User as UserIcon,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/app/theme";
import { GlobalSearch } from "@/components/app/GlobalSearch";
import { NotificationCenter } from "@/components/app/NotificationCenter";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth, type Role } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import sprintsLogo from "@/assets/sprints-logo.png";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  count?: number;
  roles: Role[];
};

const NAV_WORK: NavItem[] = [
  { to: "/home", label: "Home", icon: Home, roles: ["student", "reviewer"] },
  { to: "/admin", label: "Admin", icon: BarChart3, roles: ["admin"], badge: "Admin" },
  {
    to: "/studio",
    label: "AI Studio",
    icon: Sparkles,
    roles: ["student", "reviewer", "admin"],
    badge: "Generate",
  },
  {
    to: "/workspace",
    label: "Workspace",
    icon: SquareTerminal,
    roles: ["student", "reviewer", "admin"],
  },
];

const NAV_CONTENT: NavItem[] = [
  {
    to: "/library",
    label: "Content Library",
    icon: FileStack,
    roles: ["student", "reviewer", "admin"],
  },
  {
    to: "/review",
    label: "Review Queue",
    icon: ShieldCheck,
    roles: ["reviewer", "admin"],
    count: 3,
  },
  { to: "/history", label: "History", icon: History, roles: ["student", "reviewer", "admin"] },
];

const NAV_INSIGHT: NavItem[] = [
  { to: "/pipeline", label: "RAG Pipeline", icon: Workflow, roles: ["admin"] },
  { to: "/analytics", label: "Analytics", icon: BarChart3, roles: ["admin"] },
  { to: "/agents", label: "Agents", icon: Sparkles, roles: ["admin"] },
];

function NavSection({
  title,
  items,
  role,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  role: Role;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const visible = items.filter((i) => i.roles.includes(role));
  if (!visible.length) return null;
  return (
    <div className="mb-5">
      <p className="text-muted-foreground mb-1.5 px-3 text-[11px] font-semibold tracking-widest uppercase">
        {title}
      </p>
      <nav className="flex flex-col gap-0.5">
        {visible.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="bg-primary absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full"
                />
              )}
              <item.icon className="size-4 shrink-0" />
              {item.label}
              {item.badge && (
                <span className="bg-primary/12 text-primary ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                  {item.badge}
                </span>
              )}
              {item.count != null && (
                <span className="bg-warning/15 text-warning ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function WorkspaceSwitcher() {
  const { workspaces, active, setActive, addWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");

  const create = () => {
    if (!name.trim()) return;
    const ws = addWorkspace({ name, description: details });
    setName("");
    setDetails("");
    setCreating(false);
    toast.success(`${ws.name} created — it's now your active workspace`);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="border-sidebar-border bg-card/60 hover:border-primary/40 flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-colors">
            <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold">
              {active.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold">{active.name}</span>
              <span className="text-muted-foreground block truncate text-[11px]">
                {active.description || `${active.docs} docs · ${active.assets} assets`}
              </span>
            </span>
            <ChevronsUpDown className="text-muted-foreground size-3.5 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-1.5">
          <p className="text-muted-foreground px-2.5 py-1.5 text-[11px] font-semibold tracking-widest uppercase">
            Workspaces · isolated docs, chats & assets
          </p>
          {workspaces.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                setActive(w.id);
                setOpen(false);
                toast.success(`Switched to ${w.name}`);
              }}
              className="hover:bg-muted flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left"
            >
              <span className="bg-muted text-foreground flex size-7 items-center justify-center rounded-lg text-[11px] font-bold">
                {w.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{w.name}</span>
                <span className="text-muted-foreground block truncate text-[11px]">
                  {w.subject}
                </span>
              </span>
              {w.id === active.id && <Check className="text-primary size-4 shrink-0" />}
            </button>
          ))}
          <button
            onClick={() => {
              setOpen(false);
              setCreating(true);
            }}
            className="hover:bg-muted text-muted-foreground mt-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm"
          >
            <Plus className="size-4" /> New workspace
          </button>
        </PopoverContent>
      </Popover>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New workspace</DialogTitle>
            <DialogDescription>
              A workspace keeps its own documents, chats, generations and review history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ws-name">Workspace name</Label>
              <Input
                id="ws-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Databases · CS3040"
                onKeyDown={(e) => e.key === "Enter" && create()}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ws-details">Short details</Label>
              <Textarea
                id="ws-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="What this workspace is for — course code, term, focus topics…"
                className="min-h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={create} disabled={!name.trim()}>
              <Plus className="size-4" /> Create workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-1">
      <BrandMark className="size-9" />
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold tracking-tight">Sensei</span>
        <span className="text-muted-foreground block text-[11px]">Grounded learning assets</span>
      </span>
    </Link>
  );
}

function SidebarBody({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  return (
    <>
      <Brand />
      <div className="mt-4">
        <WorkspaceSwitcher />
      </div>
      <div className="mt-6 flex-1 overflow-y-auto">
        <NavSection title="Work" items={NAV_WORK} role={role} onNavigate={onNavigate} />
        <NavSection title="Content" items={NAV_CONTENT} role={role} onNavigate={onNavigate} />
        <NavSection title="Insight" items={NAV_INSIGHT} role={role} onNavigate={onNavigate} />
      </div>
    </>
  );
}

function UserMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="bg-primary/12 text-primary ring-primary/25 ml-1 flex size-9 items-center justify-center rounded-full text-xs font-semibold ring-1">
          {user.initials}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1.5">
        <div className="px-2.5 py-2">
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="text-muted-foreground truncate text-[11px]">{user.email}</p>
          <p className="text-primary mt-1 text-[10px] font-semibold tracking-widest uppercase">
            {user.role}
          </p>
        </div>
        <div className="border-border my-1 border-t" />
        <Link
          to="/settings"
          className="hover:bg-muted flex items-center gap-2 rounded-md px-2.5 py-2 text-sm"
        >
          <Settings className="size-4" /> Settings
        </Link>
        <button
          onClick={() => {
            signOut();
            toast.success("Signed out");
            navigate({ to: "/" });
          }}
          className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </PopoverContent>
    </Popover>
  );
}

export function AppShell({
  children,
  title,
  description,
  actions,
  bleed = false,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  bleed?: boolean;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { user } = useAuth();
  const role: Role = user?.role ?? "student";

  return (
    <div className="bg-background min-h-screen">
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      <aside className="bg-sidebar border-sidebar-border fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r px-4 py-5 lg:flex">
        <SidebarBody role={role} />
        <div className="surface-card mt-4 p-4">
          <span className="inline-block rounded-lg bg-white px-2 py-1.5 ring-1 ring-black/5">
            <img
              src={sprintsLogo}
              alt="Sprints AI"
              className="h-6 w-auto object-contain"
              loading="lazy"
            />
          </span>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
            Built by students during the Sprints AI training programme.
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="glass-panel sticky top-0 z-20 flex h-16 items-center gap-3 border-b px-4 sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-sidebar flex w-72 flex-col px-4 py-5">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarBody role={role} />
            </SheetContent>
          </Sheet>

          <button
            onClick={() => setSearchOpen(true)}
            className="text-muted-foreground hover:border-primary/40 hover:text-foreground border-border bg-card/60 flex h-9 flex-1 items-center gap-2 rounded-xl border px-3 text-sm transition-colors sm:max-w-md"
          >
            <Search className="size-4" />
            <span className="truncate">Search documents, questions, flashcards, chats…</span>
            <kbd className="border-border text-muted-foreground ml-auto hidden items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] sm:flex">
              <CommandIcon className="size-2.5" />K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            {role !== "reviewer" && (
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link to="/studio">
                  <Sparkles className="size-4" /> Generate
                </Link>
              </Button>
            )}
            <NotificationCenter />
            <ThemeToggle />
            {user ? (
              <UserMenu />
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link to="/login">
                  <UserIcon className="size-4" /> Sign in
                </Link>
              </Button>
            )}
          </div>
        </header>

        {bleed ? (
          <main className="h-[calc(100vh-4rem)] overflow-hidden">{children}</main>
        ) : (
          <main className="mesh-bg min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 lg:px-10">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mx-auto max-w-7xl"
            >
              {title && (
                <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
                    {description && (
                      <p className="text-muted-foreground mt-1.5 max-w-2xl text-sm">
                        {description}
                      </p>
                    )}
                  </div>
                  {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>
              )}
              {children}
            </motion.div>
          </main>
        )}
      </div>
    </div>
  );
}
