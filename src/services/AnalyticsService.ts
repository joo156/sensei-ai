/** Analytics business logic. */
import * as analyticsApi from "@/api/analytics.api";
import * as supabaseApi from "@/api/supabase.api";
import { isMockMode } from "@/config/env";
import { attempt } from "@/lib/result";
import type {
  AnalyticsQuery,
  AnalyticsResponse,
  AnalyticsSummary,
} from "@/types/api/analytics.contracts";
import type { Result } from "@/types/api/common";
import type { DbGeneration } from "@/types/database.types";

/** Number of items carried under `key` by a generation payload. */
function itemCount(g: DbGeneration, key: string): number {
  const payload = (g.payload ?? {}) as Record<string, unknown>;
  const items = payload[key];
  return Array.isArray(items) ? items.length : 0;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Site-wide aggregates computed from Supabase (staff read path). */
async function supabaseSummary(): Promise<AnalyticsSummary> {
  const generations = await supabaseApi.listAllGenerations();
  const questions = generations.reduce(
    (n, g) =>
      n + (g.kind === "question_bank" || g.kind === "test_help" ? itemCount(g, "questions") : 0),
    0,
  );
  const flashcards = generations.reduce(
    (n, g) => n + (g.kind === "flashcards" ? itemCount(g, "flashcards") : 0),
    0,
  );
  const studyPlans = generations.filter((g) => g.kind === "study_plan").length;
  const grounding = mean(
    generations.map((g) => g.grounding_score).filter((v): v is number => v != null),
  );
  const quality = mean(
    generations.map((g) => g.quality_score).filter((v): v is number => v != null),
  );
  const reviewed = generations.filter((g) => g.review_status !== "pending").length;
  const reviewCompletion = generations.length > 0 ? (reviewed / generations.length) * 100 : null;

  return {
    questions,
    flashcards,
    studyPlans,
    grounding: grounding != null ? Math.round(grounding * 10) / 10 : null,
    quality: quality != null ? Math.round(quality * 10) / 10 : null,
    reviewCompletion: reviewCompletion != null ? Math.round(reviewCompletion * 10) / 10 : null,
  };
}

export const AnalyticsService = {
  async get(query: AnalyticsQuery): Promise<Result<AnalyticsResponse>> {
    return attempt("AnalyticsService.get", async () => {
      const charts = await analyticsApi.getAnalytics(query);
      if (isMockMode()) return charts;
      // Real mode: charts come from FastAPI, the stat-card aggregates are
      // computed live from the site's Supabase data (migration 019's staff
      // read path) so the numbers always reflect the real database.
      const summary = await supabaseSummary();
      return { ...charts, summary };
    });
  },
};
