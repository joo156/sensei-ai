import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronDown,
  Download,
  Flag,
  History,
  MessageSquare,
  Pencil,
  Quote,
  ShieldCheck,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { RoleGate } from "@/components/app/RoleGate";
import { NoActiveWorkspace } from "@/components/app/AsyncState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ReviewBadge, NeutralBadge, DifficultyBadge } from "@/components/app/badges";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { ExportService, ReviewService } from "@/services";
import { getReviewItems } from "@/api/review.api";
import { isMockMode } from "@/config/env";
import type { GeneratedQuestion, ReviewState } from "@/types/domain";
import type { WsAuditEntry } from "@/types/domain";
import type { ReviewItem } from "@/types/api/review.contracts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Human Review — Sensei" },
      {
        name: "description",
        content:
          "Approve, reject or flag every AI output with grounding evidence, supporting chunks and a full audit trail. Nothing exports unreviewed.",
      },
      { property: "og:title", content: "Human Review — Sensei" },
      {
        property: "og:description",
        content:
          "A reviewer gate between AI generation and export, with citations and audit history.",
      },
    ],
  }),
  component: () => (
    <RoleGate allow={["reviewer", "admin"]} permission="review:approve">
      <Review />
    </RoleGate>
  ),
});

type FilterId = "all" | "flagged" | "pending" | "approved" | "rejected";

const GROUNDING_TARGET = 98;
const QUALITY_TARGET = 8.5;

function flagsFor(q: GeneratedQuestion): string[] {
  const f: string[] = [];
  if (q.grounded < GROUNDING_TARGET)
    f.push(`Grounding ${q.grounded}% below ${GROUNDING_TARGET}% target`);
  if (q.quality < QUALITY_TARGET)
    f.push(`Quality ${q.quality.toFixed(1)}/10 below ${QUALITY_TARGET} target`);
  if (!q.citations?.length) f.push("No supporting chunk attached");
  if (q.citations?.some((c) => c.score < 0.75)) f.push("Weak retrieval match on a cited chunk");
  if (q.options && new Set(q.options).size !== q.options.length)
    f.push("Duplicate distractor detected");
  return f;
}

/** Backend output status → UI review state. */
function reviewStateFromItem(item: ReviewItem): ReviewState {
  switch (item.status) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "needs_edit":
    case "edited":
      return "Needs Edit";
    default:
      return "Pending";
  }
}

/**
 * Merge backend review items with the local draft list, de-duplicating by id.
 * The backend item's persisted status wins so a reload shows the real decision.
 */
function mergeItems(local: GeneratedQuestion[], dbItems: ReviewItem[]): GeneratedQuestion[] {
  const byId = new Map<string, GeneratedQuestion>();
  for (const q of local) byId.set(q.id, q);
  for (const item of dbItems) {
    const review = reviewStateFromItem(item);
    const questions = (item.payload?.questions ?? []) as Partial<GeneratedQuestion>[];
    if (questions.length === 0) continue;
    for (const partial of questions) {
      if (!partial?.id) continue;
      byId.set(partial.id, {
        id: partial.id,
        prompt: String(partial.prompt ?? item.id),
        type: (partial.type as GeneratedQuestion["type"]) ?? "MCQ",
        difficulty: (partial.difficulty as GeneratedQuestion["difficulty"]) ?? "Beginner",
        options: partial.options ?? [],
        answer: String(partial.answer ?? ""),
        rationale: String(partial.rationale ?? ""),
        bloom: (partial.bloom as GeneratedQuestion["bloom"]) ?? "Understanding",
        quality: Number(partial.quality ?? 0),
        grounded: Number(partial.grounded ?? 0),
        estMinutes: Number(partial.estMinutes ?? 2),
        review,
        citations: (partial.citations as GeneratedQuestion["citations"]) ?? [],
      });
    }
  }
  return Array.from(byId.values());
}

function Review() {
  const { active, data, setReview, addAudit } = useWorkspace();
  const [filter, setFilter] = useState<FilterId>("all");
  const [comments, setComments] = useState<Record<string, string>>({});
  const [dbItems, setDbItems] = useState<ReviewItem[]>([]);
  const [dbAudit, setDbAudit] = useState<WsAuditEntry[]>([]);

  // Real mode: hydrate the review queue and audit from the backend so decisions
  // and items survive a reload (the backend is the source of truth, not the
  // local WorkspaceContext).
  useEffect(() => {
    if (isMockMode() || !active) {
      setDbItems([]);
      setDbAudit([]);
      return;
    }
    let cancelled = false;
    void Promise.all([getReviewItems(active.id), ReviewService.auditHistory(active.id)])
      .then(([res, audit]) => {
        if (!cancelled) {
          setDbItems(res.items);
          setDbAudit(audit);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDbItems([]);
          setDbAudit([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [active?.id]);

  const items = useMemo(() => mergeItems(data.questions, dbItems), [data.questions, dbItems]);
  const audit = useMemo(() => {
    const merged = [...dbAudit];
    for (const e of data.audit ?? []) {
      if (!merged.some((m) => m.id === e.id)) merged.push(e);
    }
    return merged;
  }, [dbAudit, data.audit]);

  const flagged = useMemo(() => items.filter((q) => flagsFor(q).length > 0), [items]);

  const counts = {
    all: items.length,
    flagged: flagged.length,
    pending: items.filter((q) => q.review === "Pending").length,
    approved: items.filter((q) => q.review === "Approved").length,
    rejected: items.filter((q) => q.review === "Rejected").length,
  };

  const visible = items.filter((q) => {
    if (filter === "all") return true;
    if (filter === "flagged") return flagsFor(q).length > 0;
    if (filter === "pending") return q.review === "Pending";
    if (filter === "approved") return q.review === "Approved";
    return q.review === "Rejected";
  });

  const decide = async (q: GeneratedQuestion, state: ReviewState) => {
    setReview(q.id, state, { comment: comments[q.id]?.trim() || undefined, label: q.prompt });
    setComments((c) => ({ ...c, [q.id]: "" }));
    if (!active || isMockMode()) return;
    try {
      await ReviewService.setState(state, {
        workspaceId: active.id,
        itemId: q.id,
        comment: comments[q.id]?.trim(),
        label: q.prompt,
      });
      const res = await getReviewItems(active.id);
      setDbItems(res.items);
      setDbAudit(await ReviewService.auditHistory(active.id));
      toast.success(`${state} · saved to the backend audit history`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not persist the decision");
    }
  };

  const onFlag = async (q: GeneratedQuestion) => {
    addAudit({
      itemId: q.id,
      itemLabel: q.prompt,
      action: "Flagged",
      actor: "You",
      comment: comments[q.id]?.trim() || "Manually flagged for a second opinion",
    });
    setComments((c) => ({ ...c, [q.id]: "" }));
    toast.info("Flagged for a second reviewer");
    if (!active || isMockMode()) return;
    try {
      await ReviewService.flag({
        workspaceId: active.id,
        itemId: q.id,
        comment: comments[q.id]?.trim(),
        label: q.prompt,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not flag on the backend");
    }
  };

  /** Real export through the backend (approved outputs only — the API enforces the gate). */
  const handleExport = async () => {
    if (!active || counts.approved === 0) return;
    try {
      await ExportService.exportApproved({
        workspaceId: active.id,
        format: "json",
        title: `${active.name} — approved study content`,
      });
      toast.success(`Downloading ${counts.approved} approved items`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    }
  };

  return (
    <AppShell
      title={active ? `Human Review · ${active.name}` : "Human Review"}
      description="Every AI output is flagged, evidenced and decided here. Exports unlock only for approved items."
      actions={
        <Button
          variant="outline"
          onClick={() => void handleExport()}
          disabled={!active || counts.approved === 0}
        >
          <Download className="size-4" /> Export approved ({counts.approved})
        </Button>
      }
    >
      {!active ? (
        <NoActiveWorkspace />
      ) : (
        <>
          {items.length === 0 ? (
            <div className="surface-card p-12 text-center">
              <h3 className="font-semibold">Nothing to review in {active.name}</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Generate outputs in the AI Studio and they will queue up here.
              </p>
            </div>
          ) : (
            <>
              {counts.flagged > 0 && (
                <div className="border-warning/35 bg-warning/10 mb-6 flex items-start gap-3 rounded-2xl border p-4">
                  <AlertTriangle className="text-warning mt-0.5 size-5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      {counts.flagged} output{counts.flagged > 1 ? "s" : ""} flagged by automatic
                      validation
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      Flags fire when grounding drops below {GROUNDING_TARGET}%, quality below{" "}
                      {QUALITY_TARGET}
                      /10, retrieval match is weak, or distractors overlap.
                    </p>
                  </div>
                </div>
              )}

              <div className="mb-5 flex flex-wrap gap-1.5">
                {(
                  [
                    ["all", "All"],
                    ["flagged", "Flagged"],
                    ["pending", "Pending"],
                    ["approved", "Approved"],
                    ["rejected", "Rejected"],
                  ] as [FilterId, string][]
                ).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setFilter(id)}
                    className={cn(
                      "rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
                      filter === id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {label} · {counts[id]}
                  </button>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
                <div className="min-w-0 space-y-5">
                  {visible.length === 0 && (
                    <div className="surface-card p-10 text-center text-sm">
                      No items match this filter.
                    </div>
                  )}
                  {visible.map((q, i) => (
                    <ReviewItem
                      key={q.id}
                      q={q}
                      index={i}
                      comment={comments[q.id] ?? ""}
                      onComment={(v) => setComments((c) => ({ ...c, [q.id]: v }))}
                      onDecide={(s) => void decide(q, s)}
                      onFlag={() => void onFlag(q)}
                    />
                  ))}
                </div>

                <AuditPanel entries={audit} />
              </div>
            </>
          )}
        </>
      )}
    </AppShell>
  );
}

function ReviewItem({
  q,
  index,
  comment,
  onComment,
  onDecide,
  onFlag,
}: {
  q: GeneratedQuestion;
  index: number;
  comment: string;
  onComment: (v: string) => void;
  onDecide: (s: ReviewState) => void;
  onFlag: () => void;
}) {
  const [open, setOpen] = useState(index === 0);
  const flags = flagsFor(q);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        "surface-card p-5 transition-shadow sm:p-6",
        flags.length > 0 && "border-warning/45",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <DifficultyBadge level={q.difficulty} />
        <NeutralBadge>{q.type}</NeutralBadge>
        <ReviewBadge state={q.review} />
        {flags.length > 0 && (
          <span className="border-warning/40 bg-warning/10 text-warning inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold">
            <Flag className="size-3" /> {flags.length} flag{flags.length > 1 ? "s" : ""}
          </span>
        )}
        <span className="ml-auto flex items-center gap-3 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-1",
              q.grounded >= GROUNDING_TARGET ? "text-success" : "text-warning",
            )}
          >
            <ShieldCheck className="size-3.5" /> {q.grounded}% grounded
          </span>
          <span className="text-muted-foreground">{q.quality.toFixed(1)}/10</span>
        </span>
      </div>

      <h3 className="mt-4 text-[15px] leading-relaxed font-medium">{q.prompt}</h3>

      {q.options && (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {q.options.map((opt) => (
            <li
              key={opt}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm",
                opt === q.answer
                  ? "border-success/35 bg-success/8 font-medium"
                  : "border-border bg-muted/40 text-muted-foreground",
              )}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}

      {flags.length > 0 && (
        <ul className="border-warning/30 bg-warning/8 mt-4 space-y-1 rounded-xl border p-3 text-xs">
          {flags.map((f) => (
            <li key={f} className="text-warning flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span className="text-foreground/80">{f}</span>
            </li>
          ))}
        </ul>
      )}

      <Button variant="ghost" size="sm" className="mt-3" onClick={() => setOpen((o) => !o)}>
        {open ? "Hide evidence" : `Supporting chunks (${q.citations?.length ?? 0})`}
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </Button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                  Answer key & rationale
                </p>
                <p className="mt-1 text-sm font-medium">{q.answer}</p>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{q.rationale}</p>
              </div>
              <div className="space-y-2">
                {q.citations?.map((c) => (
                  <div key={c.chunk} className="border-border bg-muted/40 rounded-xl border p-3">
                    <p className="flex flex-wrap items-center gap-2 text-xs font-medium">
                      <BookOpen className="text-primary size-3.5" />
                      {c.doc} · p.{c.page}
                      <span className="text-muted-foreground font-mono text-[11px]">{c.chunk}</span>
                      <span
                        className={cn("ml-auto", c.score < 0.75 ? "text-warning" : "text-primary")}
                      >
                        match {c.score.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-muted-foreground mt-2 flex gap-2 text-xs italic">
                      <Quote className="size-3 shrink-0" />
                      {c.snippet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border-border mt-4 border-t pt-4">
        <Textarea
          value={comment}
          onChange={(e) => onComment(e.target.value)}
          placeholder="Reviewer note — saved with your decision in the audit history…"
          className="min-h-16 text-sm"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onDecide("Approved")}>
            <Check className="size-4" /> Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDecide("Needs Edit")}>
            <Pencil className="size-4" /> Needs edit
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDecide("Rejected")}>
            <X className="size-4" /> Reject
          </Button>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={onFlag}>
            <Flag className="size-4" /> Flag
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

const actionTone: Record<WsAuditEntry["action"], string> = {
  Approved: "text-success border-success/35 bg-success/10",
  Rejected: "text-destructive border-destructive/35 bg-destructive/10",
  "Needs Edit": "text-warning border-warning/35 bg-warning/10",
  Flagged: "text-warning border-warning/35 bg-warning/10",
  Comment: "text-muted-foreground border-border bg-muted/50",
};

function AuditPanel({ entries }: { entries: WsAuditEntry[] }) {
  return (
    <aside className="surface-card h-max p-5 xl:sticky xl:top-24">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <History className="text-primary size-4" /> Audit history
      </p>
      <p className="text-muted-foreground mt-1 text-xs">
        Who decided what, when — scoped to this workspace and kept across reloads.
      </p>

      {entries.length === 0 ? (
        <p className="text-muted-foreground mt-6 text-sm">
          No decisions recorded yet. Approving, rejecting or flagging an output writes an entry
          here.
        </p>
      ) : (
        <ol className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {entries.map((e) => (
            <motion.li
              key={e.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="border-border border-l-2 pl-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                    actionTone[e.action],
                  )}
                >
                  {e.action}
                </span>
                <span className="text-muted-foreground text-[11px]">
                  {e.actor} · {e.at}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs font-medium">{e.itemLabel}</p>
              {e.comment && (
                <p className="text-muted-foreground mt-1 flex gap-1.5 text-[11px] italic">
                  <MessageSquare className="mt-0.5 size-3 shrink-0" />
                  {e.comment}
                </p>
              )}
            </motion.li>
          ))}
        </ol>
      )}
    </aside>
  );
}
