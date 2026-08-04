import { cn } from "@/lib/utils";
import type { OutputStatus } from "@/types/domain";

const base =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap";

const tone: Record<OutputStatus, string> = {
  Draft: "border-border bg-muted text-muted-foreground",
  "Pending Review": "border-warning/40 bg-warning/12 text-warning",
  Approved: "border-success/30 bg-success/10 text-success",
  Rejected: "border-destructive/30 bg-destructive/10 text-destructive",
  "Needs Editing": "border-info/30 bg-info/10 text-info",
};

const dot: Record<OutputStatus, string> = {
  Draft: "bg-muted-foreground",
  "Pending Review": "bg-warning",
  Approved: "bg-success",
  Rejected: "bg-destructive",
  "Needs Editing": "bg-info",
};

export function StatusBadge({ status, className }: { status: OutputStatus; className?: string }) {
  return (
    <span className={cn(base, tone[status], className)}>
      <span className={cn("size-1.5 rounded-full", dot[status])} />
      {status}
    </span>
  );
}

export function ScorePill({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good?: boolean;
}) {
  return (
    <span
      className={cn(
        "border-border bg-card/60 inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px]",
        good === false && "border-warning/40 bg-warning/10 text-warning",
      )}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-semibold">{value}</span>
    </span>
  );
}
