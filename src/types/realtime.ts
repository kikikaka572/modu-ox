import type { RoomStatus } from "./room";

export interface CursorMovePayload {
  player_id: string;
  x: number;
  y: number;
  t: number;
}

export interface PresencePayload {
  player_id: string;
  nickname: string;
  character_id: number | null;
  color_id: number | null;
  is_host: boolean;
}

export interface RoomChangePayload {
  status: RoomStatus;
  current_question_index: number;
  question_ends_at: string | null;
  host_id: string;
}

export const REALTIME_EVENTS = {
  cursorMove: "cursor_move",
} as const;

export function roomChannelName(code: string): string {
  return `room:${code}`;
}
