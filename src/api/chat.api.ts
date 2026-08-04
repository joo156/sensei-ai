/** Mentor / concept chat endpoints. */
import { delay, http } from "./http";
import { isMockMode } from "@/config/env";
import type {
  ConceptChatRequest,
  ConceptChatResponse,
  CreateChatRequest,
  CreateChatResponse,
  MentorChatRequest,
  MentorChatResponse,
} from "@/types/api/chat.contracts";

const stamp = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export async function createChat(req: CreateChatRequest): Promise<CreateChatResponse> {
  if (!isMockMode()) return http.post<CreateChatResponse>("/chats", req);
  await delay(60);
  return { chatId: `chat-${Date.now().toString(36)}` };
}

async function mockAnswer(
  req: MentorChatRequest,
  context: { docTitle: string; workspaceName: string },
): Promise<MentorChatResponse> {
  await delay(700);
  return {
    message: {
      id: `m-${Date.now().toString(36)}`,
      role: "assistant",
      text: `Here's a grounded answer based on ${context.docTitle} in the ${context.workspaceName} workspace. Every claim is cited to an indexed chunk (mock response — ${req.model}).`,
      time: stamp(),
    },
    citations: [],
  };
}

export async function generateMentorResponse(
  req: MentorChatRequest,
  context: { docTitle: string; workspaceName: string },
): Promise<MentorChatResponse> {
  if (!isMockMode()) return http.post<MentorChatResponse>("/mentor/chat", req);
  return mockAnswer(req, context);
}

export async function generateConceptResponse(
  req: ConceptChatRequest,
  context: { docTitle: string; workspaceName: string },
): Promise<ConceptChatResponse> {
  if (!isMockMode()) return http.post<ConceptChatResponse>("/concept/chat", req);
  return mockAnswer(req, context);
}

export async function getChats(workspaceId: string) {
  if (!isMockMode()) return http.get(`/chats?workspace_id=${workspaceId}`);
  const { getWorkspaceData } = await import("./workspace.api");
  const data = await getWorkspaceData(workspaceId);
  return { chats: data.chats };
}
