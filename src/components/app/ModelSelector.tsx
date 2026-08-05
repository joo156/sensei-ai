import { Cpu } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ModelService } from "@/services/ModelService";

/** Catalogue comes from the service layer — never hardcoded in the UI. */
export const MODELS = ModelService.list();

export type ModelId = string;

export function ModelSelector({
  value,
  onChange,
  className,
}: {
  value: ModelId;
  onChange: (v: ModelId) => void;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ModelId)}>
      <SelectTrigger className={className ?? "h-9 w-auto min-w-44 gap-2"}>
        <Cpu className="text-muted-foreground size-3.5" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MODELS.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            <span className="flex items-center gap-2">
              <span className="font-medium">{m.name}</span>
              <span className="text-muted-foreground text-[11px]">{m.vendor}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
