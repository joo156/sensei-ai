/**
 * Upload pipeline: upload → parse → chunk → embed → store.
 * Each step maps 1:1 onto a FastAPI endpoint (see docs/FASTAPI_INTEGRATION.md).
 */
import * as documentApi from "@/api/document.api";
import type { WsDoc } from "@/types/domain";

export interface UploadResult {
  document: WsDoc;
  storagePath: string;
  chunks: number;
  embedded: number;
}

export const UploadService = {
  upload: (workspaceId: string, file: UploadFileLike) =>
    documentApi.uploadDocument({ workspaceId, file }),
  parse: documentApi.parseDocument,
  chunk: documentApi.chunkDocument,
  embed: documentApi.embedDocument,
  /** Persist the finished document record (no-op in mock mode). */
  store: async (workspaceId: string, document: WsDoc) => document,

  /** Runs the whole pipeline and reports progress per stage. */
  async ingest(
    workspaceId: string,
    file: UploadFileLike,
    onStage?: (stage: "upload" | "parse" | "chunk" | "embed" | "store") => void,
  ): Promise<UploadResult> {
    onStage?.("upload");
    const { document, storage_path } = await UploadService.upload(workspaceId, file);
    onStage?.("parse");
    const parsed = await UploadService.parse(document.id);
    onStage?.("chunk");
    const chunked = await UploadService.chunk(document.id);
    onStage?.("embed");
    const embedded = await UploadService.embed(document.id);
    onStage?.("store");
    const stored = await UploadService.store(workspaceId, {
      ...document,
      pages: parsed.pages || document.pages,
      chunks: chunked.chunks.length ? chunked.chunks : document.chunks,
    });
    return {
      document: stored,
      storagePath: storage_path,
      chunks: chunked.chunks.length,
      embedded: embedded.embedded,
    };
  },
};

export type UploadFileLike = File | { name: string; size?: number; type?: string };
