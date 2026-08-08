/** Flashcard favorites business logic (persisted per user via Supabase RLS). */
import * as supabaseApi from "@/api/supabase.api";
import { isMockMode } from "@/config/env";
import { supabase } from "@/lib/supabase";
import { attempt } from "@/lib/result";
import type { Result } from "@/types/api/common";
import type { FlashcardFavorite } from "@/types/database.types";

export const FavoriteService = {
  /** All flashcards the signed-in user has favorited (real mode). */
  async list(): Promise<Result<FlashcardFavorite[]>> {
    return attempt("FavoriteService.list", async () => {
      if (isMockMode()) return [];
      return supabaseApi.listFlashcardFavorites();
    });
  },

  /**
   * Toggle a favorite. The row is keyed by `user_id + front` (unique), so
   * favoriting the same card twice flips it off. Returns the new state.
   */
  async toggleFavorite(input: {
    front: string;
    back?: string | null;
    topic?: string | null;
    format?: string | null;
    sourceChunkId?: string | null;
    generationId?: string | null;
  }): Promise<Result<boolean>> {
    return attempt("FavoriteService.toggleFavorite", async () => {
      if (isMockMode()) {
        // Local-only toggle is fine for the demo mode (state held in the deck).
        return true;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in to save favorites");
      const existing = await supabaseApi.listFlashcardFavorites();
      const row = existing.find((f) => f.user_id === user.id && f.front === input.front);
      if (row) {
        await supabaseApi.removeFlashcardFavorite(user.id, input.front);
        return false;
      }
      await supabaseApi.addFlashcardFavorite({
        user_id: user.id,
        generation_id: input.generationId ?? null,
        front: input.front,
        back: input.back ?? null,
        topic: input.topic ?? null,
        format: input.format ?? null,
        source_chunk_id: input.sourceChunkId ?? null,
      });
      return true;
    });
  },

  /** Favorite states for a set of cards (real mode). */
  async favoritedSet(fronts: string[]): Promise<Result<Set<string>>> {
    return attempt("FavoriteService.favoritedSet", async () => {
      if (isMockMode() || fronts.length === 0) return new Set<string>();
      const rows = await supabaseApi.listFlashcardFavorites();
      const wanted = new Set(fronts);
      return new Set(rows.filter((r) => wanted.has(r.front)).map((r) => r.front));
    });
  },
};
