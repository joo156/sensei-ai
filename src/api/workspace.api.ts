/** Workspace endpoints. */
import { delay } from "./http";
import { supabase } from "@/lib/supabase";
import { isMockMode } from "@/config/env";
import { workspaces as seedWorkspaces } from "@/mock/studio-data";
import { emptyWorkspaceData, workspaceData as seedWorkspaceData } from "@/mock/workspace-data";
import type { Workspace, WorkspaceAccent, WorkspaceData } from "@/types/domain";
import type { DbWorkspace } from "@/types/database.types";
import type {
  BootstrapWorkspacesResponse,
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  GetWorkspaceResponse,
  GetWorkspacesResponse,
  UpdateWorkspaceRequest,
} from "@/types/api/workspace.contracts";

const ACCENTS: WorkspaceAccent[] = ["primary", "info", "success", "warning"];

/** Supabase error → plain Error with a safe fallback message. */
function toError(error: { message?: string } | null | undefined, fallback: string): Error {
  return new Error(error?.message ?? fallback);
}

/** Map a stored workspace row to the UI shape, defaulting fields not in the DB yet. */
function mapWorkspace(row: DbWorkspace): Workspace {
  const accent = ACCENTS.includes(row.accent as WorkspaceAccent)
    ? (row.accent as WorkspaceAccent)
    : "primary";
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    description: row.description || undefined,
    docs: 0,
    assets: 0,
    pendingReview: 0,
    lastActive: relativeTime(row.updated_at),
    accent,
  };
}

/** Human "N minutes/hours/days ago" label derived from a row's updated_at. */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Just now";
  const minutes = Math.round((Date.now() - then) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
}

export async function getWorkspaces(): Promise<GetWorkspacesResponse> {
  if (isMockMode()) {
    await delay(60);
    return { workspaces: seedWorkspaces };
  }
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw toError(error, "Could not load your workspaces.");
  const rows = (data ?? []) as DbWorkspace[];
  return { workspaces: rows.map(mapWorkspace) };
}

export async function getWorkspace(id: string): Promise<GetWorkspaceResponse> {
  if (isMockMode()) {
    await delay(60);
    const workspace = seedWorkspaces.find((w) => w.id === id) ?? seedWorkspaces[0];
    return { workspace, data: seedWorkspaceData[id] ?? emptyWorkspaceData() };
  }
  const { data, error } = await supabase.from("workspaces").select("*").eq("id", id).maybeSingle();
  if (error) throw toError(error, "Could not load the workspace.");
  const row = data as DbWorkspace | null;
  if (!row) throw new Error("Workspace not found.");
  return { workspace: mapWorkspace(row), data: seedWorkspaceData[id] ?? emptyWorkspaceData() };
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
  if (isMockMode()) {
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to create a workspace.");
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("workspaces")
    .insert({
      owner_id: user.id,
      name: input.name.trim(),
      subject: input.description.trim() || "New workspace",
      description: input.description.trim(),
      accent: "primary",
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();
  if (error) throw toError(error, "Could not create the workspace.");
  return { workspace: mapWorkspace(data as DbWorkspace) };
}

export async function updateWorkspace({ id, patch }: UpdateWorkspaceRequest): Promise<void> {
  if (isMockMode()) {
    await delay(50);
    return;
  }
  const { error } = await supabase
    .from("workspaces")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw toError(error, "Could not update the workspace.");
}

export async function getWorkspaceData(id: string): Promise<WorkspaceData> {
  const res = await getWorkspace(id);
  return res.data;
}

/** GET /workspaces/bootstrap — workspaces plus their scoped data in one call. */
export async function getWorkspaceBootstrap(): Promise<BootstrapWorkspacesResponse> {
  if (isMockMode()) {
    await delay(220);
    const workspaces = seedWorkspaces;
    const store: Record<string, WorkspaceData> = {};
    for (const w of workspaces) store[w.id] = seedWorkspaceData[w.id] ?? emptyWorkspaceData();
    return { workspaces, store };
  }
  const { workspaces } = await getWorkspaces();
  const store: Record<string, WorkspaceData> = {};
  for (const w of workspaces) store[w.id] = seedWorkspaceData[w.id] ?? emptyWorkspaceData();
  return { workspaces, store };
}
