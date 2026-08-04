import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { emptyWorkspaceData } from "@/lib/workspace";
import { WorkspaceService } from "@/services";
import { useServiceQuery } from "@/hooks/useServiceQuery";
import { ErrorState, LoadingState } from "@/components/app/AsyncState";
import type {
  ReviewState,
  Workspace,
  WorkspaceData,
  WsAuditEntry,
  WsChat,
  WsDoc,
  WsHistoryRow,
} from "@/types/domain";

const STORAGE_KEY = "cortexa.workspace";
const STATE_KEY = "cortexa.workspace.state";

interface PersistShape {
  activeId: string;
  workspaces: Workspace[];
  store: Record<string, WorkspaceData>;
}

interface WorkspaceCtx {
  workspaces: Workspace[];
  active: Workspace;
  setActive: (id: string) => void;
  addWorkspace: (input: { name: string; description: string }) => Workspace;
  /** Data scoped to the active workspace — switching swaps everything. */
  data: WorkspaceData;
  addDoc: (doc: WsDoc) => void;
  updateDoc: (id: string, patch: Partial<WsDoc>) => void;
  removeDoc: (id: string) => void;
  /** Review + audit */
  setReview: (
    itemId: string,
    state: ReviewState,
    opts?: { comment?: string; actor?: string; label?: string },
  ) => void;
  addAudit: (entry: Omit<WsAuditEntry, "id" | "at"> & { at?: string }) => void;
  /** Workspace-scoped write-back */
  addChat: (chat: WsChat) => void;
  appendChatMessage: (chatId: string, message: WsChat["messages"][number]) => void;
  addHistory: (row: WsHistoryRow) => void;
}

const Ctx = createContext<WorkspaceCtx | null>(null);

function nowStamp() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

/**
 * Loads workspaces through `WorkspaceService`, then renders the provider.
 * Keeps the provider itself free of any mock/seed import.
 */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { data, isPending, error, refetch } = useServiceQuery(["workspace-bootstrap"], () =>
    WorkspaceService.bootstrap(),
  );

  if (isPending) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <LoadingState label="Loading your workspaces…" />
      </div>
    );
  }

  if (error || !data || data.workspaces.length === 0) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-6">
        <ErrorState
          title={error ? "Unable to load your workspaces" : "No workspaces yet"}
          message={error?.message ?? "Create a workspace to get started."}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  return (
    <WorkspaceStore seedWorkspaces={data.workspaces} seedStore={data.store}>
      {children}
    </WorkspaceStore>
  );
}

function WorkspaceStore({
  seedWorkspaces,
  seedStore,
  children,
}: {
  seedWorkspaces: Workspace[];
  seedStore: Record<string, WorkspaceData>;
  children: ReactNode;
}) {
  const [activeId, setActiveId] = useState<string>(seedWorkspaces[0].id);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(seedWorkspaces);
  const [store, setStore] = useState<Record<string, WorkspaceData>>(seedStore);
  const hydrated = useRef(false);

  // Load persisted state after hydration.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistShape;
        if (parsed.workspaces?.length) setWorkspaces(parsed.workspaces);
        if (parsed.store) setStore(parsed.store);
        if (parsed.activeId) setActiveId(parsed.activeId);
      } else {
        const legacy = window.localStorage.getItem(STORAGE_KEY);
        if (legacy && seedWorkspaces.some((w) => w.id === legacy)) setActiveId(legacy);
      }
    } catch {
      /* ignore */
    }
    hydrated.current = true;
  }, []);

  // Persist everything so notes, chats and review history survive a reload.
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(
        STATE_KEY,
        JSON.stringify({ activeId, workspaces, store } satisfies PersistShape),
      );
      window.localStorage.setItem(STORAGE_KEY, activeId);
    } catch {
      /* ignore */
    }
  }, [activeId, workspaces, store]);

  const setActive = useCallback((id: string) => setActiveId(id), []);

  const mutate = useCallback(
    (id: string, fn: (d: WorkspaceData) => WorkspaceData) =>
      setStore((prev) => ({ ...prev, [id]: fn(prev[id] ?? emptyWorkspaceData()) })),
    [],
  );

  const value = useMemo<WorkspaceCtx>(() => {
    const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];
    const raw = store[active.id] ?? emptyWorkspaceData();
    const data: WorkspaceData = { ...raw, audit: raw.audit ?? [] };

    const pushAudit = (d: WorkspaceData, entry: WsAuditEntry): WorkspaceData => ({
      ...d,
      audit: [entry, ...(d.audit ?? [])],
    });

    return {
      workspaces,
      active,
      setActive,
      addWorkspace: ({ name, description }) => {
        const base = name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        let id = base || `workspace-${Date.now()}`;
        if (workspaces.some((w) => w.id === id)) id = `${id}-${Date.now().toString(36).slice(-4)}`;
        const ws: Workspace = {
          id,
          name: name.trim(),
          subject: description.trim() || "New workspace",
          description: description.trim(),
          docs: 0,
          assets: 0,
          pendingReview: 0,
          lastActive: "Just now",
          accent: "primary",
        };
        setWorkspaces((prev) => [...prev, ws]);
        setStore((prev) => ({ ...prev, [id]: emptyWorkspaceData() }));
        setActiveId(id);
        return ws;
      },
      data,
      addDoc: (doc) => mutate(active.id, (d) => ({ ...d, docs: [doc, ...d.docs] })),
      updateDoc: (id, patch) =>
        mutate(active.id, (d) => ({
          ...d,
          docs: d.docs.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      removeDoc: (id) =>
        mutate(active.id, (d) => ({ ...d, docs: d.docs.filter((x) => x.id !== id) })),
      setReview: (itemId, state, opts) =>
        mutate(active.id, (d) => {
          const item = d.questions.find((q) => q.id === itemId);
          const next: WorkspaceData = {
            ...d,
            questions: d.questions.map((q) => (q.id === itemId ? { ...q, review: state } : q)),
            history: d.history.map((h) => (h.id === itemId ? { ...h, review: state } : h)),
          };
          return pushAudit(next, {
            id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            itemId,
            itemLabel: opts?.label ?? item?.prompt ?? itemId,
            action: state === "Pending" ? "Flagged" : (state as WsAuditEntry["action"]),
            actor: opts?.actor ?? "You",
            at: nowStamp(),
            comment: opts?.comment,
          });
        }),
      addAudit: (entry) =>
        mutate(active.id, (d) =>
          pushAudit(d, {
            ...entry,
            id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            at: entry.at ?? nowStamp(),
          }),
        ),
      addChat: (chat) => mutate(active.id, (d) => ({ ...d, chats: [chat, ...d.chats] })),
      appendChatMessage: (chatId, message) =>
        mutate(active.id, (d) => ({
          ...d,
          chats: d.chats.map((c) =>
            c.id === chatId ? { ...c, messages: [...c.messages, message] } : c,
          ),
        })),
      addHistory: (row) => mutate(active.id, (d) => ({ ...d, history: [row, ...d.history] })),
    };
  }, [activeId, setActive, store, mutate, workspaces]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}
