/** History business logic. */
import * as historyApi from "@/api/history.api";
import type { WsHistoryRow } from "@/types/domain";

export const HistoryService = {
  async list(workspaceId: string): Promise<WsHistoryRow[]> {
    return (await historyApi.getHistory({ workspaceId })).history;
  },

  /** Builds the row a generator writes back to workspace history. */
  buildRow(input: {
    agent: string;
    doc: string;
    items: number;
    quality?: number;
    chatId?: string;
  }): WsHistoryRow {
    return {
      id: `gen-${Date.now().toString(36)}`,
      date: new Date().toISOString().slice(0, 16).replace("T", " "),
      agent: input.agent,
      doc: input.doc,
      status: "Completed",
      quality: input.quality ?? 9.2,
      review: "Pending",
      items: input.items,
      chatId: input.chatId,
    };
  },

  append: historyApi.appendHistory,
};
