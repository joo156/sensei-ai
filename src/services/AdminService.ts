/** Admin dashboard aggregates — live, staff-wide numbers. */
import * as supabaseApi from "@/api/supabase.api";
import { isMockMode } from "@/config/env";
import { attempt } from "@/lib/result";
import type { Result } from "@/types/api/common";
import type { DbGeneration } from "@/types/database.types";

export interface AdminOverview {
  /** Documents across every workspace (staff-wide). */
  documents: number;
  /** Generated question items across all question/test-help generations. */
  questions: number;
  /** Mean grounding score (0–100), null when nothing is scored yet. */
  grounding: number | null;
  /** Mean quality score (0–10), null when nothing is scored yet. */
  quality: number | null;
}

export interface AdminPipelineStats {
  /** Total indexed chunks across every workspace (live count). */
  chunksIndexed: number;
  avgRetrievalMs: number | null;
  topK: number | null;
  embeddingModel: string | null;
  validationPassRate: number | null;
  supportCheckedPct: number | null;
}

/** Number of question items carried by a generation payload. */
function questionItemCount(g: DbGeneration): number {
  const payload = (g.payload ?? {}) as Record<string, unknown>;
  const questions = payload.questions;
  return Array.isArray(questions) ? questions.length : 0;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export const AdminService = {
  /**
   * Live platform totals for the admin dashboard. Real mode aggregates the
   * Supabase `workspace_with_owner` + `generations` tables (staff-wide reads);
   * mock mode returns the demo figures so the dashboard still has content.
   */
  async overview(): Promise<Result<AdminOverview>> {
    return attempt("AdminService.overview", async () => {
      if (isMockMode()) {
        return { documents: 5, questions: 480, grounding: 98.4, quality: 9.3 };
      }
      const [workspaces, generations] = await Promise.all([
        supabaseApi.listWorkspacesWithOwner(),
        supabaseApi.listAllGenerations(),
      ]);
      const grounding = mean(
        generations.map((g) => g.grounding_score).filter((v): v is number => v != null),
      );
      const quality = mean(
        generations.map((g) => g.quality_score).filter((v): v is number => v != null),
      );
      return {
        documents: workspaces.reduce((n, w) => n + w.document_count, 0),
        questions: generations.reduce((n, g) => n + questionItemCount(g), 0),
        grounding: grounding != null ? Math.round(grounding * 10) / 10 : null,
        quality: quality != null ? Math.round(quality * 10) / 10 : null,
      };
    });
  },

  /**
   * Live RAG pipeline telemetry for the /pipeline page. Real mode reads the
   * staff-gated `pipeline_stats` view (migration 019); mock mode returns the
   * demo figures so the page still has content.
   */
  async pipelineStats(): Promise<Result<AdminPipelineStats>> {
    return attempt("AdminService.pipelineStats", async () => {
      if (isMockMode()) {
        return {
          chunksIndexed: 990,
          avgRetrievalMs: 184,
          topK: 8,
          embeddingModel: "gemini-embedding-001",
          validationPassRate: 97.2,
          supportCheckedPct: 100,
        };
      }
      const row = await supabaseApi.getPipelineStats();
      return {
        chunksIndexed: row?.chunks_indexed ?? 0,
        avgRetrievalMs: row?.avg_retrieval_ms ?? null,
        topK: row?.top_k ?? null,
        embeddingModel: row?.embedding_model ?? null,
        validationPassRate: row?.validation_pass_rate ?? null,
        supportCheckedPct: row?.support_checked_pct ?? null,
      };
    });
  },
};
