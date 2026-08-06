/** Document + upload pipeline endpoints (upload → parse → chunk → embed → store). */
import { delay, http } from "./http";
import { supabase } from "@/lib/supabase";
import { isMockMode } from "@/config/env";
import type { WsChunk, WsDoc } from "@/types/domain";
import type { DbDocument, DocumentStatus } from "@/types/database.types";
import type {
  ChunkDocumentResponse,
  CreateDocumentRequest,
  CreateDocumentResponse,
  EmbedDocumentResponse,
  GetChunksResponse,
  GetDocumentsResponse,
  ParseDocumentResponse,
  SaveDocumentNotesRequest,
  UpdateDocumentRequest,
  UploadDocumentRequest,
  UploadDocumentResponse,
} from "@/types/api/document.contracts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const KIND_MAP: Record<string, WsDoc["kind"]> = {
  PDF: "PDF",
  DOCX: "DOCX",
  PPTX: "PPTX",
  TXT: "TXT",
  Note: "Note",
};

/** Supabase error → plain Error with a safe fallback message. */
function toError(error: { message?: string } | null | undefined, fallback: string): Error {
  return new Error(error?.message ?? fallback);
}

function kindFromName(name: string): WsDoc["kind"] {
  const ext = name.split(".").pop()?.toUpperCase() ?? "";
  if (ext === "PDF" || ext === "DOCX" || ext === "PPTX" || ext === "TXT") return ext;
  return "Note";
}

function humanSize(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Map a `documents` table row to the UI shape. */
export function mapDocumentRow(row: DbDocument): WsDoc {
  return {
    id: row.id,
    title: row.title,
    kind: KIND_MAP[row.kind] ?? "Note",
    size: humanSize(row.size_bytes ?? undefined),
    pages: row.pages ?? 1,
    uploaded: (row.created_at ?? "").slice(0, 10),
    status: row.status === "indexed" ? "Ready" : "Processing",
    tags: row.topics ?? [],
    notes: row.notes ?? undefined,
    chunks: [],
    storagePath: row.storage_path ?? undefined,
    sizeBytes: row.size_bytes ?? undefined,
  };
}

/** UI status → database `document_status`. */
function toDbStatus(status: WsDoc["status"]): DocumentStatus {
  return status === "Ready" ? "indexed" : "uploaded";
}

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * Upload the raw file bytes to the private `documents` bucket at
 * `<workspaceId>/<documentId>/<fileName>`. The document RECORD is created
 * separately by `createDocument` so the whole flow stays inside the service
 * layer (see SUPABASE_INTEGRATION.md §6). RLS scopes the write to the
 * workspace owner.
 */
export async function uploadDocument({
  workspaceId,
  file,
}: UploadDocumentRequest): Promise<UploadDocumentResponse> {
  if (isMockMode()) {
    await delay(200);
    const id = `doc-${Date.now().toString(36)}`;
    const path = `${workspaceId}/${id}/${file.name}`;
    const document: WsDoc = {
      id,
      title: file.name.replace(/\.[^.]+$/, ""),
      kind: kindFromName(file.name),
      size: humanSize("size" in file ? file.size : undefined),
      sizeBytes: "size" in file ? file.size : undefined,
      pages: 1,
      uploaded: new Date().toISOString().slice(0, 10),
      status: "Ready",
      tags: [],
      chunks: [],
      storagePath: path,
    };
    return { document, storage_path: path };
  }
  if (!(file instanceof File)) throw new Error("Only real files can be uploaded.");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to upload a document.");
  const id = crypto.randomUUID();
  const path = `${workspaceId}/${id}/${file.name}`;
  const { error } = await supabase.storage
    .from("documents")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw toError(error, "Could not upload the file to storage.");
  const document: WsDoc = {
    id,
    title: file.name.replace(/\.[^.]+$/, ""),
    kind: kindFromName(file.name),
    size: humanSize(file.size),
    sizeBytes: file.size,
    pages: 1,
    uploaded: new Date().toISOString().slice(0, 10),
    status: "Processing",
    tags: [],
    chunks: [],
    storagePath: path,
  };
  return { document, storage_path: path };
}

/**
 * Persist a document record (text notes OR a staged upload). When the client
 * id is a uuid it is preserved so the `documents` row matches the storage
 * path; otherwise the database generates one. RLS only allows the workspace
 * owner to insert.
 */
export async function createDocument({
  workspaceId,
  doc,
}: CreateDocumentRequest): Promise<CreateDocumentResponse> {
  if (isMockMode()) {
    await delay(60);
    return { document: doc };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to create a document.");
  const { data, error } = await supabase
    .from("documents")
    .insert({
      ...(isUuid(doc.id) ? { id: doc.id } : {}),
      workspace_id: workspaceId,
      uploaded_by: user.id,
      title: doc.title,
      kind: doc.kind,
      size_bytes: doc.sizeBytes ?? null,
      pages: doc.pages ?? 1,
      chunk_count: doc.chunks?.length ?? 0,
      status: toDbStatus(doc.status),
      storage_path: doc.storagePath ?? null,
      notes: doc.notes ?? null,
      topics: doc.tags ?? [],
    })
    .select("*")
    .single();
  if (error) throw toError(error, "Could not save the document.");
  return { document: mapDocumentRow(data as DbDocument) };
}

/** Persist edits to a document record (title, notes, tags, size, pages). */
export async function updateDocument({ id, patch }: UpdateDocumentRequest): Promise<void> {
  if (isMockMode()) {
    await delay(50);
    return;
  }
  const { error } = await supabase
    .from("documents")
    .update({
      title: patch.title,
      notes: patch.notes ?? null,
      topics: patch.tags ?? [],
      size_bytes: patch.sizeBytes ?? null,
      pages: patch.pages ?? null,
    })
    .eq("id", id);
  if (error) throw toError(error, "Could not update the document.");
}

export async function parseDocument(documentId: string): Promise<ParseDocumentResponse> {
  if (!isMockMode()) return http.post<ParseDocumentResponse>(`/documents/${documentId}/parse`);
  await delay(120);
  return { documentId, pages: 1, text_length: 0 };
}

export async function chunkDocument(documentId: string): Promise<ChunkDocumentResponse> {
  if (!isMockMode()) return http.post<ChunkDocumentResponse>(`/documents/${documentId}/chunk`);
  await delay(120);
  const chunks: WsChunk[] = [];
  return { documentId, chunks };
}

export async function embedDocument(documentId: string): Promise<EmbedDocumentResponse> {
  if (!isMockMode()) return http.post<EmbedDocumentResponse>(`/documents/${documentId}/embed`);
  await delay(120);
  return { documentId, embedded: 0, model: "mock-embed-001" };
}

/** Load the documents belonging to one workspace (newest first). */
export async function getDocuments(workspaceId: string): Promise<GetDocumentsResponse> {
  if (isMockMode()) {
    const { getWorkspaceData } = await import("./workspace.api");
    const data = await getWorkspaceData(workspaceId);
    return { documents: data.docs };
  }
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw toError(error, "Could not load the documents.");
  return { documents: (data ?? []).map(mapDocumentRow) };
}

/** Load documents across several workspaces in one query, grouped by workspace id. */
export async function getDocumentsForWorkspaces(
  workspaceIds: string[],
): Promise<Record<string, WsDoc[]>> {
  if (workspaceIds.length === 0) return {};
  if (isMockMode()) {
    const { getWorkspaceData } = await import("./workspace.api");
    const grouped: Record<string, WsDoc[]> = {};
    for (const id of workspaceIds) {
      const data = await getWorkspaceData(id);
      grouped[id] = data.docs;
    }
    return grouped;
  }
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .in("workspace_id", workspaceIds)
    .order("created_at", { ascending: false });
  if (error) throw toError(error, "Could not load the documents.");
  const grouped: Record<string, WsDoc[]> = {};
  for (const row of data ?? []) {
    const doc = mapDocumentRow(row as DbDocument);
    (grouped[row.workspace_id] ??= []).push(doc);
  }
  return grouped;
}

export async function getChunks(
  workspaceId: string,
  documentId: string,
): Promise<GetChunksResponse> {
  if (!isMockMode()) return http.get<GetChunksResponse>(`/documents/${documentId}/chunks`);
  const { documents } = await getDocuments(workspaceId);
  return { chunks: documents.find((d) => d.id === documentId)?.chunks ?? [] };
}

export async function saveDocumentNotes({
  documentId,
  notes,
}: SaveDocumentNotesRequest): Promise<void> {
  if (!isMockMode()) {
    await http.patch<void>(`/documents/${documentId}/notes`, { notes });
    return;
  }
  await delay(60);
}

/** Remove the storage object (if any) and the document record. */
export async function deleteDocument(documentId: string): Promise<void> {
  if (isMockMode()) {
    await delay(60);
    return;
  }
  const { data: row, error: rowError } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", documentId)
    .maybeSingle();
  if (rowError) throw toError(rowError, "Could not delete the document.");
  if (row?.storage_path) {
    // Best-effort cleanup: a leftover storage object is preferable to blocking
    // the record deletion, so storage failures do not abort the delete.
    await supabase.storage.from("documents").remove([row.storage_path]);
  }
  const { error } = await supabase.from("documents").delete().eq("id", documentId);
  if (error) throw toError(error, "Could not delete the document.");
}
