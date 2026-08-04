/** Document + lecture-notes business logic. */
import * as documentApi from "@/api/document.api";
import type { WsChunk, WsDoc } from "@/types/domain";

export const DocumentService = {
  async listDocuments(workspaceId: string): Promise<WsDoc[]> {
    return (await documentApi.getDocuments(workspaceId)).documents;
  },

  async listChunks(workspaceId: string, documentId: string): Promise<WsChunk[]> {
    return (await documentApi.getChunks(workspaceId, documentId)).chunks;
  },

  async saveNotes(workspaceId: string, documentId: string, notes: string): Promise<void> {
    await documentApi.saveDocumentNotes({ workspaceId, documentId, notes });
  },

  deleteDocument: documentApi.deleteDocument,
};
