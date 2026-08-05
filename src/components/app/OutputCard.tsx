import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  FileSearch,
  History,
  Pencil,
  RefreshCcw,
  ShieldCheck,
  ShieldAlert,
  Quote,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NeutralBadge } from "@/components/app/badges";
import { StatusBadge, ScorePill } from "@/components/app/StatusBadge";
import { CitationChip } from "@/components/app/CitationChip";
import type { AssetCard, OutputStatus } from "@/types/domain";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Panel = "rationale" | "sources" | "validation" | "history" | null;

export function OutputCard({
  asset,
  index = 0,
  compact = false,
  onStatusChange,
}: {
  asset: AssetCard;
  index?: number;
  compact?: boolean;
  onStatusChange?: (id: string, status: OutputStatus) => void;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const [status, setStatus] = useState<OutputStatus>(asset.status);
  const [note, setNote] = useState(asset.reviewerNote ?? "");

  const setState = (next: OutputStatus) => {
    setStatus(next);
    onStatusChange?.(asset.id, next);
    toast.success(`${asset.id} marked ${next}`);
  };

  const approved = status === "Approved";
  const toggle = (p: Panel) => setPanel(panel === p ? null : p);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.32, ease: "easeOut" }}
      className="surface-card hover:shadow-elevated overflow-hidden transition-shadow"
    >
      <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
        <NeutralBadge>{asset.kind}</NeutralBadge>
        <span className="text-muted-foreground text-xs">
          {asset.agent} · {asset.model}
        </span>
        <StatusBadge status={status} className="ml-auto" />
      </div>

      <div className="px-5 pt-3 pb-4">
        <h3 className="text-[15px] leading-snug font-semibold">{asset.title}</h3>
        <p className="text-muted-foreground mt-2 text-sm whitespace-pre-line">{asset.body}</p>

        {asset.answer && (
          <p className="border-success/30 bg-success/8 text-foreground mt-3 rounded-xl border px-3 py-2 text-sm">
            <span className="text-success font-semibold">Answer · </span>
            {asset.answer}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {asset.meta.map((m) => (
            <NeutralBadge key={m}>{m}</NeutralBadge>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <ScorePill label="Confidence" value={`${asset.confidence}%`} />
          <ScorePill label="Grounding" value={`${asset.grounding}%`} good={asset.grounding >= 95} />
          <ScorePill
            label="Validation"
            value={
              asset.validation.schema && asset.validation.support && asset.validation.duplicates
                ? "Passed"
                : "Warning"
            }
            good={
              asset.validation.schema && asset.validation.support && asset.validation.duplicates
            }
          />
          <ScorePill label="Versions" value={`v${asset.versions}`} />
        </div>

        {!compact && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {asset.sources.map((s) => (
              <CitationChip key={s.chunk} source={s} />
            ))}
          </div>
        )}
      </div>

      <div className="border-border bg-muted/30 flex flex-wrap items-center gap-1 border-t px-3 py-2">
        <PanelButton
          active={panel === "rationale"}
          onClick={() => toggle("rationale")}
          icon={Quote}
        >
          Rationale
        </PanelButton>
        <PanelButton
          active={panel === "sources"}
          onClick={() => toggle("sources")}
          icon={FileSearch}
        >
          Sources
        </PanelButton>
        <PanelButton
          active={panel === "validation"}
          onClick={() => toggle("validation")}
          icon={asset.validation.support ? ShieldCheck : ShieldAlert}
        >
          Reports
        </PanelButton>
        <PanelButton active={panel === "history"} onClick={() => toggle("history")} icon={History}>
          History
        </PanelButton>

        <span className="ml-auto flex flex-wrap items-center gap-1">
          <IconAction icon={Pencil} label="Edit" onClick={() => setState("Needs Editing")} />
          <IconAction
            icon={Copy}
            label="Duplicate"
            onClick={() => toast.success("Duplicated into drafts")}
          />
          <IconAction
            icon={RefreshCcw}
            label="Regenerate"
            onClick={() => toast.info("Regenerating with the same sources…")}
          />
          <Button
            size="sm"
            variant="ghost"
            disabled={!approved}
            onClick={() => toast.success("Added to export queue")}
            title={approved ? "Export" : "Approve before exporting"}
          >
            <Download className="size-3.5" /> Export
          </Button>
        </span>
      </div>

      <AnimatePresence initial={false}>
        {panel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="border-border overflow-hidden border-t"
          >
            <div className="px-5 py-4 text-sm">
              {panel === "rationale" && (
                <p className="text-muted-foreground leading-relaxed">{asset.rationale}</p>
              )}

              {panel === "sources" && (
                <ul className="space-y-2">
                  {asset.sources.map((s) => (
                    <li key={s.chunk} className="border-border rounded-xl border p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-medium">{s.doc}</span>
                        <span className="text-muted-foreground">
                          p.{s.page} · {s.chunk}
                        </span>
                        <span className="text-success ml-auto font-semibold">
                          {(s.score * 100).toFixed(0)}% match
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-2 font-mono text-xs leading-relaxed">
                        “{s.snippet}”
                      </p>
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toast.info("Jumping to source chunk")}
                        >
                          Jump to source
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toast.info("Opening original document")}
                        >
                          View original
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {panel === "validation" && (
                <div className="space-y-2">
                  <Check3 ok={asset.validation.schema} label="Schema validation" />
                  <Check3 ok={asset.validation.support} label="Support / grounding check" />
                  <Check3 ok={asset.validation.duplicates} label="Duplicate detection" />
                  <p className="text-muted-foreground mt-3 text-xs">{asset.validation.notes}</p>
                </div>
              )}

              {panel === "history" && (
                <ol className="space-y-3">
                  {Array.from({ length: asset.versions }).map((_, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="bg-primary/12 text-primary mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold">
                        v{asset.versions - i}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {i === 0 ? "Current version" : "Earlier draft"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {i === 0
                            ? `${asset.createdAt} · ${asset.model}`
                            : "Regenerated after reviewer feedback"}
                        </p>
                        {i > 0 && (
                          <p className="border-border text-muted-foreground mt-1.5 rounded-lg border p-2 font-mono text-[11px]">
                            <span className="text-destructive">
                              - shared between every invocation
                            </span>
                            <br />
                            <span className="text-success">
                              + persists across calls and accumulates state
                            </span>
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border-border bg-card/40 border-t px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {asset.reviewer ? `Reviewed by ${asset.reviewer}` : "Awaiting a reviewer"} ·{" "}
            {asset.createdAt}
          </span>
          <span className="ml-auto flex gap-1.5">
            <Button
              size="sm"
              variant={approved ? "secondary" : "default"}
              onClick={() => setState("Approved")}
            >
              <Check className="size-3.5" /> Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => setState("Rejected")}>
              <X className="size-3.5" /> Reject
            </Button>
          </span>
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Leave a reviewer note…"
          className="border-border bg-background focus:border-primary/50 mt-2.5 w-full rounded-xl border px-3 py-2 text-sm outline-none"
        />
        {!approved && (
          <p className="text-warning mt-2 text-xs">
            Export stays locked until this output is approved by a human.
          </p>
        )}
      </div>
    </motion.article>
  );
}

function PanelButton({
  children,
  icon: Icon,
  active,
  onClick,
}: {
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-primary/12 text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-3.5" />
      {children}
      <ChevronDown className={cn("size-3 transition-transform", active && "rotate-180")} />
    </button>
  );
}

function IconAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button size="sm" variant="ghost" onClick={onClick} title={label}>
      <Icon className="size-3.5" />
      <span className="sr-only sm:not-sr-only">{label}</span>
    </Button>
  );
}

function Check3({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-md",
          ok ? "bg-success/12 text-success" : "bg-warning/15 text-warning",
        )}
      >
        {ok ? <Check className="size-3" /> : <ShieldAlert className="size-3" />}
      </span>
      <span className={ok ? "text-muted-foreground" : "text-warning font-medium"}>{label}</span>
      <span className="text-muted-foreground ml-auto text-xs">{ok ? "Passed" : "Warning"}</span>
    </div>
  );
}
