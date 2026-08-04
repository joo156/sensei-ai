/** Workspace endpoints. */
import { delay, http } from "./http";
import { isMockMode } from "@/config/env";
import { workspaces as seedWorkspaces } from "@/mock/studio-data";
import type { Workspace } from "@/types/domain";
import { emptyWorkspaceData, workspaceData as seedWorkspaceData } from "@/mock/workspace-data";
import type { WorkspaceData } from "@/types/domain";
import type {
  BootstrapWorkspacesResponse,
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  GetWorkspaceResponse,
  GetWorkspacesResponse,
  UpdateWorkspaceRequest,
} from "@/types/api/workspace.contracts";

export async function getWorkspaces(): Promise<GetWorkspacesResponse> {
  if (!isMockMode()) return http.get<GetWorkspacesResponse>("/workspaces");
  await delay(60);
  return { workspaces: seedWorkspaces };
}

export async function getWorkspace(id: string): Promise<GetWorkspaceResponse> {
  if (!isMockMode()) return http.get<GetWorkspaceResponse>(`/workspaces/${id}`);
  await delay(60);
  const workspace = seedWorkspaces.find((w) => w.id === id) ?? seedWorkspaces[0];
  return { workspace, data: seedWorkspaceData[id] ?? emptyWorkspaceData() };
}

export function slugifyWorkspaceName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createWorkspace(
  input: CreateWorkspaceRequest,
): Promise<CreateWorkspaceResponse> {
  if (!isMockMode()) return http.post<CreateWorkspaceResponse>("/workspaces", input);
  await delay(80);
  const id = slugifyWorkspaceName(input.name) || `workspace-${Date.now()}`;
  const workspace: Workspace = {
    id,
    name: input.name.trim(),
    subject: input.description.trim() || "New workspace",
    description: input.description.trim(),
    docs: 0,
    assets: 0,
    pendingReview: 0,
    lastActive: "Just now",
    accent: "primary",
  };
  return { workspace };
}

export async function updateWorkspace({ id, patch }: UpdateWorkspaceRequest): Promise<void> {
  if (!isMockMode()) {
    await http.patch<void>(`/workspaces/${id}`, patch);
    return;
  }
  await delay(50);
}

export async function getWorkspaceData(id: string): Promise<WorkspaceData> {
  const res = await getWorkspace(id);
  return res.data;
}

/** GET /workspaces/bootstrap — workspaces plus their scoped data in one call. */
export async function getWorkspaceBootstrap(): Promise<BootstrapWorkspacesResponse> {
  if (!isMockMode()) return http.get<BootstrapWorkspacesResponse>("/workspaces/bootstrap");
  await delay(220);
  const workspaces = seedWorkspaces;
  const store: Record<string, WorkspaceData> = {};
  for (const w of workspaces) store[w.id] = seedWorkspaceData[w.id] ?? emptyWorkspaceData();
  return { workspaces, store };
}
