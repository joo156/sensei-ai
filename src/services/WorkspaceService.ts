/** Workspace business logic. */
import * as workspaceApi from "@/api/workspace.api";
import { attempt } from "@/lib/result";
import type { Result } from "@/types/api/common";
import type { BootstrapWorkspacesResponse } from "@/types/api/workspace.contracts";
import type { Workspace, WorkspaceData } from "@/types/domain";

export const WorkspaceService = {
  /** Workspaces + their scoped data — used to hydrate the workspace provider. */
  async bootstrap(): Promise<Result<BootstrapWorkspacesResponse>> {
    return attempt("WorkspaceService.bootstrap", () => workspaceApi.getWorkspaceBootstrap());
  },

  async listWorkspaces(): Promise<Result<Workspace[]>> {
    return attempt(
      "WorkspaceService.listWorkspaces",
      async () => (await workspaceApi.getWorkspaces()).workspaces,
    );
  },

  async getWorkspace(id: string): Promise<Result<{ workspace: Workspace; data: WorkspaceData }>> {
    return attempt("WorkspaceService.getWorkspace", () => workspaceApi.getWorkspace(id));
  },

  async getWorkspaceData(id: string): Promise<Result<WorkspaceData>> {
    return attempt("WorkspaceService.getWorkspaceData", () => workspaceApi.getWorkspaceData(id));
  },

  async createWorkspace(input: { name: string; description: string }): Promise<Result<Workspace>> {
    return attempt(
      "WorkspaceService.createWorkspace",
      async () => (await workspaceApi.createWorkspace(input)).workspace,
    );
  },

  async updateWorkspace(
    input: Parameters<typeof workspaceApi.updateWorkspace>[0],
  ): Promise<Result<void>> {
    return attempt("WorkspaceService.updateWorkspace", () => workspaceApi.updateWorkspace(input));
  },

  /** Ensures a workspace id is unique against the ids already known locally. */
  uniqueId(name: string, taken: string[]): string {
    const base = workspaceApi.slugifyWorkspaceName(name) || `workspace-${Date.now()}`;
    return taken.includes(base) ? `${base}-${Date.now().toString(36).slice(-4)}` : base;
  },
};
