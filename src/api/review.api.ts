/** Review endpoints — approve / reject / needs-edit / comment plus audit trail. */
import { delay, http } from "./http";
import { isMockMode } from "@/config/env";
import type { ReviewState } from "@/types/domain";
import type { WsAuditEntry } from "@/types/domain";
import type {
  GetAuditHistoryResponse,
  GetReviewQueueResponse,
  ReviewRequest,
  ReviewResponse,
} from "@/types/api/review.contracts";

function audit(
  req: ReviewRequest,
  action: WsAuditEntry["action"],
  actor: string,
): WsAuditEntry {
  return {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    itemId: req.itemId,
    itemLabel: req.label ?? req.itemId,
    action,
    actor,
    at: new Date().toISOString().slice(0, 16).replace("T", " "),
    comment: req.comment,
  };
}

async function submit(
  path: string,
  req: ReviewRequest,
  status: ReviewState,
  action: WsAuditEntry["action"],
  actor: string,
): Promise<ReviewResponse> {
  if (!isMockMode()) return http.post<ReviewResponse>(path, req);
  await delay(80);
  return { itemId: req.itemId, status, audit: audit(req, action, actor) };
}

export const approveGeneration = (req: ReviewRequest, actor = "You") =>
  submit("/review/approve", req, "Approved", "Approved", actor);

export const rejectGeneration = (req: ReviewRequest, actor = "You") =>
  submit("/review/reject", req, "Rejected", "Rejected", actor);

export const requestEdits = (req: ReviewRequest, actor = "You") =>
  submit("/review/needs-edit", req, "Needs Edit", "Needs Edit", actor);

export const flagGeneration = (req: ReviewRequest, actor = "System") =>
  submit("/review/flag", req, "Pending", "Flagged", actor);

export const commentOnGeneration = (req: ReviewRequest, actor = "You") =>
  submit("/review/comment", req, "Pending", "Comment", actor);

export async function getReviewQueue(workspaceId: string): Promise<GetReviewQueueResponse> {
  if (!isMockMode()) return http.get<GetReviewQueueResponse>(`/review?workspace_id=${workspaceId}`);
  const { getWorkspaceData } = await import("./workspace.api");
  const data = await getWorkspaceData(workspaceId);
  return { itemIds: data.questions.filter((q) => q.review === "Pending").map((q) => q.id) };
}

export async function getAuditHistory(workspaceId: string): Promise<GetAuditHistoryResponse> {
  if (!isMockMode()) {
    return http.get<GetAuditHistoryResponse>(`/review/audit?workspace_id=${workspaceId}`);
  }
  const { getWorkspaceData } = await import("./workspace.api");
  const data = await getWorkspaceData(workspaceId);
  return { audit: data.audit ?? [] };
}
