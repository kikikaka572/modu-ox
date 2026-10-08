import { create } from "zustand";
import type { Room } from "@/types/room";

interface RoomState {
  room: Room | null;
  setRoom: (room: Room) => void;
  updateRoom: (patch: Partial<Room>) => void;
  clearRoom: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  room: null,
  setRoom: (room) => set({ room }),
  updateRoom: (patch) =>
    set((state) => (state.room ? { room: { ...state.room, ...patch } } : state)),
  clearRoom: () => set({ room: null }),
}));
