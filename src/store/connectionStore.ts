import { create } from "zustand";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type ConnectionStatus = "idle" | "connecting" | "connected" | "reconnecting" | "error";

interface ConnectionState {
  status: ConnectionStatus;
  lastError: string | null;
  serverOffsetMs: number;
  channel: RealtimeChannel | null;
  setStatus: (status: ConnectionStatus, error?: string | null) => void;
  setServerOffsetMs: (offsetMs: number) => void;
  setChannel: (channel: RealtimeChannel | null) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: "idle",
  lastError: null,
  serverOffsetMs: 0,
  channel: null,
  setStatus: (status, error = null) => set({ status, lastError: error }),
  setServerOffsetMs: (offsetMs) => set({ serverOffsetMs: offsetMs }),
  setChannel: (channel) => set({ channel }),
}));
