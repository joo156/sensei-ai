/** Review workflow + permissions. Components never inline role logic. */
import * as reviewApi from "@/api/review.api";
import type { ReviewState } from "@/types/domain";
import type { WsAuditEntry } from "@/types/domain";
import { ROLE_PERMISSIONS, type Permission } from "@/constants";
import type { UserRole } from "@/types/database.types";
import type { ReviewRequest, ReviewResponse } from "@/types/api/review.contracts";

export const ReviewService = {
  can(role: UserRole | undefined, permission: Permission): boolean {
    if (!role) return false;
    return (ROLE_PERMISSIONS[role] as readonly string[]).includes(permission);
  },

  approve: (req: ReviewRequest, actor?: string) => reviewApi.approveGeneration(req, actor),
  reject: (req: ReviewRequest, actor?: string) => reviewApi.rejectGeneration(req, actor),
  requestEdits: (req: ReviewRequest, actor?: string) => reviewApi.requestEdits(req, actor),
  comment: (req: ReviewRequest, actor?: string) => reviewApi.commentOnGeneration(req, actor),
  flag: (req: ReviewRequest, actor?: string) => reviewApi.flagGeneration(req, actor),

  /** Generic entry point used by the review UI. */
  async setState(
    state: ReviewState,
    req: ReviewRequest,
    actor?: string,
  ): Promise<ReviewResponse> {
    if (state === "Approved") return ReviewService.approve(req, actor);
    if (state === "Rejected") return ReviewService.reject(req, actor);
    if (state === "Needs Edit") return ReviewService.requestEdits(req, actor);
    return ReviewService.flag(req, actor);
  },

  async queue(workspaceId: string): Promise<string[]> {
    return (await reviewApi.getReviewQueue(workspaceId)).itemIds;
  },

  async auditHistory(workspaceId: string): Promise<WsAuditEntry[]> {
    return (await reviewApi.getAuditHistory(workspaceId)).audit;
  },

  /** An item is auto-flagged when grounding or quality fall below threshold. */
  shouldAutoFlag(grounded: number, quality: number): boolean {
    return grounded < 98 || quality < 8.5;
  },
};
