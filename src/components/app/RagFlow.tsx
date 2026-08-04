import { motion } from "motion/react";
import { Check } from "lucide-react";
import { ContentService } from "@/services";
import { useServiceQuery } from "@/hooks/useServiceQuery";
import { cn } from "@/lib/utils";

export function RagFlow({
  active = 7,
  orientation = "vertical",
  className,
}: {
  active?: number;
  orientation?: "vertical" | "horizontal";
  className?: string;
}) {
  const { data } = useServiceQuery(["rag-stages"], () => ContentService.ragStages(), {
    staleTime: Infinity,
  });
  const ragStages = data ?? [];

  if (orientation === "horizontal") {
    return (
      <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
        {ragStages.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors",
                i < active && "border-success/30 bg-success/10 text-success",
                i === active && "border-primary bg-primary/12 text-primary shadow-glow",
                i > active && "border-border text-muted-foreground",
              )}
            >
              {s.label}
            </span>
            {i < ragStages.length - 1 && (
              <span className="bg-border h-px w-3 shrink-0" aria-hidden />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <ol className={cn("relative", className)}>
      <span className="bg-border absolute top-2 bottom-2 left-[15px] w-px" aria-hidden />
      {ragStages.map((s, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <li key={s.key} className="relative flex gap-3 pb-4 last:pb-0">
            <span
              className={cn(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                done && "border-success/40 bg-success/12 text-success",
                current && "border-primary bg-primary text-primary-foreground",
                !done && !current && "border-border bg-card text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" /> : i + 1}
              {current && (
                <motion.span
                  className="border-primary absolute inset-0 rounded-full border"
                  animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
                />
              )}
            </span>
            <div className="min-w-0 pt-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  current ? "text-primary" : !done && "text-muted-foreground",
                )}
              >
                {s.label}
                {current && <span className="ml-2 text-[11px] font-normal">running…</span>}
              </p>
              <p className="text-muted-foreground truncate text-xs">{s.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
