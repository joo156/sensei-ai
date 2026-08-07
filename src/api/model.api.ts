/** Model catalogue endpoint. The UI never learns how a model is executed. */
import { delay, http } from "./http";
import { paths } from "./paths";
import { env, isMockMode } from "@/config/env";
import type { GetModelsResponse, ModelInfo } from "@/types/api/analytics.contracts";

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: "mock",
    name: "Mock",
    vendor: "Local",
    desc: "Fast, deterministic responses for demos",
    available: true,
  },
  {
    id: "gemini",
    name: "Gemini 1.5",
    vendor: "Google",
    desc: "Balanced quality and latency",
    available: true,
  },
  {
    id: "kimi",
    name: "Kimi K2",
    vendor: "Moonshot",
    desc: "Long-context reasoning",
    available: true,
  },
  {
    id: "nvidia",
    name: "Nvidia Nemotron",
    vendor: "OpenRouter",
    desc: "High-precision science tasks",
    available: true,
  },
];

export async function getModels(): Promise<GetModelsResponse> {
  if (!isMockMode()) return http.get<GetModelsResponse>(paths.models);
  await delay(30);
  return { models: AVAILABLE_MODELS };
}

export function getDefaultModelId(): string {
  return AVAILABLE_MODELS.some((m) => m.id === env.DEFAULT_MODEL) ? env.DEFAULT_MODEL : "mock";
}
