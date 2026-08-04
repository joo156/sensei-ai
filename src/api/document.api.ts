/** Document + upload pipeline endpoints (upload → parse → chunk → embed → store). */
import { delay, http } from "./http";
import { isMockMode } from "@/config/env";
import type { WsChunk, WsDoc } from "@/types/domain";
import type {
  ChunkDocumentResponse,
  EmbedDocumentResponse,
  GetChunksResponse,
  GetDocumentsResponse,
  ParseDocumentResponse,
  SaveDocumentNotesRequest,
  UploadDocumentRequest,
  UploadDocumentResponse,
} from "@/types/api/document.contracts";

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

export async function uploadDocument({
  workspaceId,
  file,
}: UploadDocumentRequest): Promise<UploadDocumentResponse> {
  if (!isMockMode()) {
    const form = new FormData();
    form.append("workspace_id", workspaceId);
    if (file instanceof File) form.append("file", file);
    return http.post<UploadDocumentResponse>("/upload", form);
  }
  await delay(200);
  const id = `doc-${Date.now().toString(36)}`;
  const document: WsDoc = {
    id,
    title: file.name.replace(/\.[^.]+$/, ""),
    kind: kindFromName(file.name),
    size: humanSize("size" in file ? file.size : undefined),
    pages: 1,
    uploaded: new Date().toISOString().slice(0, 10),
    status: "Ready",
    tags: [],
    chunks: [],
  };
  return { document, storage_path: `${workspaceId}/${id}/${file.name}` };
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

export async function getDocuments(workspaceId: string): Promise<GetDocumentsResponse> {
  if (!isMockMode()) {
    return http.get<GetDocumentsResponse>(`/documents?workspace_id=${workspaceId}`);
  }
  const { getWorkspaceData } = await import("./workspace.api");
  const data = await getWorkspaceData(workspaceId);
  return { documents: data.docs };
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

export async function deleteDocument(documentId: string): Promise<void> {
  if (!isMockMode()) {
    await http.delete<void>(`/documents/${documentId}`);
    return;
  }
  await delay(60);
}
