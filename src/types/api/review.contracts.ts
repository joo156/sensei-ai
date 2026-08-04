import type { ReviewState } from "@/types/domain";
import type { WsAuditEntry } from "@/types/domain";

export interface ReviewRequest {
  workspaceId: string;
  itemId: string;
  comment?: string;
  /** Human-readable label used in the audit trail. */
  label?: string;
}

export interface ReviewResponse {
  itemId: string;
  status: ReviewState;
  audit: WsAuditEntry;
}

export interface GetReviewQueueResponse {
  itemIds: string[];
}

export interface GetAuditHistoryResponse {
  audit: WsAuditEntry[];
}
