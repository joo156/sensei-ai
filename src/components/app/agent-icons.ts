import {
  Calendar,
  Compass,
  Layers,
  Lightbulb,
  ListChecks,
  Sparkle,
  Target,
  type LucideIcon,
} from "lucide-react";

export const agentIcons: Record<string, LucideIcon> = {
  compass: Compass,
  lightbulb: Lightbulb,
  "list-checks": ListChecks,
  target: Target,
  layers: Layers,
  calendar: Calendar,
  sparkle: Sparkle,
};

export function agentIcon(key: string): LucideIcon {
  return agentIcons[key] ?? Sparkle;
}
