import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Clock,
  Heart,
  Layers,
  Lightbulb,
  MessagesSquare,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { RoleGate } from "@/components/app/RoleGate";
import { NoActiveWorkspace } from "@/components/app/AsyncState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { TeamSection } from "@/components/app/TeamSection";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — Sensei" },
      {
        name: "description",
        content: "Continue studying, jump back into your workspace or generate a new asset.",
      },
      { property: "og:title", content: "Home — Sensei" },
      { property: "og:description", content: "Your grounded study workspace." },
    ],
  }),
  component: () => (
    <RoleGate allow={["student", "reviewer", "admin"]}>
      <StudentHome />
    </RoleGate>
  ),
});

const QUICK = [
  {
    to: "/studio",
    tab: "questions",
    label: "Question Bank",
    icon: ClipboardList,
    hint: "MCQs, short answer",
  },
  { to: "/studio", tab: "flashcards", label: "Flashcards", icon: Layers, hint: "Animated deck" },
  { to: "/studio", tab: "mentor", label: "Mentor", icon: MessagesSquare, hint: "Grounded tutor" },
  { to: "/studio", tab: "concept", label: "Concept", icon: Lightbulb, hint: "Explain any idea" },
];

function StudentHome() {
  const { user } = useAuth();
  const { active, data } = useWorkspace();
  const name = user?.name.split(" ")[0] ?? "there";

  return (
    <AppShell
      title={`Welcome back, ${name}`}
      description={
        active
          ? `You're in the ${active.name} workspace · ${data.docs.length} materials · ${data.history.length} saved runs.`
          : "You don't have a workspace yet — create one from the sidebar to get started."
      }
      actions={
        <Button asChild>
          <Link to="/studio">
            <Sparkles className="size-4" /> Quick generate
          </Link>
        </Button>
      }
    >
      {!active ? (
        <NoActiveWorkspace />
      ) : (
        <>
          {/* Continue studying */}
          <section className="surface-card overflow-hidden">
            <div className="mesh-bg grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <span className="text-primary text-[11px] font-semibold tracking-widest uppercase">
                  Continue studying
                </span>
                <h2 className="mt-2 text-xl font-semibold">Chapter 3 — Data Types & Variables</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  You reviewed 12 of 25 grounded questions. Pick up in the same session or start
                  fresh.
                </p>
                <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" /> 18 min left
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="size-3.5" /> Introduction to Python
                  </span>
                </div>
              </div>
              <Button asChild>
                <Link to="/workspace">
                  <PlayCircle className="size-4" /> Resume session
                </Link>
              </Button>
            </div>
          </section>

          {/* Quick Generate */}
          <section className="mt-6">
            <h3 className="mb-3 text-sm font-semibold tracking-tight">Quick generate</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {QUICK.map((q, i) => (
                <motion.div
                  key={q.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={q.to}
                    className="surface-card hover:border-primary/40 flex h-full items-center gap-3 p-4 transition-colors"
                  >
                    <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                      <q.icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{q.label}</p>
                      <p className="text-muted-foreground text-xs">{q.hint}</p>
                    </div>
                    <ArrowRight className="text-muted-foreground size-4" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Recent docs */}
            <div className="surface-card p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold tracking-tight">Recent documents</h3>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/library">
                    View library <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {data.docs.slice(0, 4).map((d) => (
                  <Link
                    key={d.id}
                    to="/library"
                    className="border-border hover:border-primary/40 block rounded-xl border p-3 transition-colors"
                  >
                    <p className="truncate text-sm font-medium">{d.title}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {d.kind} · {d.pages}p · {d.chunks.length} sections
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent generations */}
            <div className="surface-card p-6">
              <h3 className="text-sm font-semibold tracking-tight">Recent generations</h3>
              <div className="mt-4 divide-y">
                {data.history.slice(0, 4).map((h) => (
                  <div key={h.id} className="py-2.5">
                    <p className="truncate text-sm font-medium">
                      {h.agent} · {h.items} items
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {h.doc} · {h.date}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Continue Mentor / Favorites */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Link
              to="/workspace"
              className="surface-card hover:border-primary/40 group p-6 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                  <MessagesSquare className="size-5" />
                </span>
                <div className="flex-1">
                  <p className="font-semibold">Continue your mentor conversation</p>
                  <p className="text-muted-foreground text-xs">
                    Last message: "Explain closures in one paragraph…"
                  </p>
                </div>
                <ArrowRight className="text-muted-foreground group-hover:text-primary size-4 transition-colors" />
              </div>
            </Link>

            <div className="surface-card p-6">
              <div className="flex items-center gap-2">
                <Heart className="text-destructive size-4" />
                <p className="text-sm font-semibold">Favorite flashcards</p>
              </div>
              <div className="mt-3 space-y-2">
                {["Immutable sequence type", "What does `len()` call?", "Duck typing"].map((f) => (
                  <div
                    key={f}
                    className="border-border bg-muted/40 rounded-lg border px-3 py-2 text-sm"
                  >
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="-mx-4 mt-10 sm:-mx-6 lg:-mx-10">
            <TeamSection />
          </div>
        </>
      )}
    </AppShell>
  );
}
