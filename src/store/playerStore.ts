import { create } from "zustand";
import type { Player } from "@/types/player";

interface PlayerState {
  myPlayerId: string | null;
  players: Record<string, Player>;
  takenCombos: Set<string>;
  setMyPlayerId: (id: string) => void;
  upsertPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  setPlayers: (players: Player[]) => void;
  reset: () => void;
}

function comboKey(characterId: number | null, colorId: number | null): string | null {
  if (characterId === null || colorId === null) return null;
  return `${characterId}:${colorId}`;
}

function recomputeTakenCombos(players: Record<string, Player>): Set<string> {
  const taken = new Set<string>();
  for (const player of Object.values(players)) {
    const key = comboKey(
      player.characterId === null ? null : Number(player.characterId),
      player.colorId === null ? null : Number(player.colorId)
    );
    if (key) taken.add(key);
  }
  return taken;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  myPlayerId: null,
  players: {},
  takenCombos: new Set(),

  setMyPlayerId: (id) => set({ myPlayerId: id }),

  upsertPlayer: (player) =>
    set((state) => {
      const players = { ...state.players, [player.id]: player };
      return { players, takenCombos: recomputeTakenCombos(players) };
    }),

  removePlayer: (playerId) =>
    set((state) => {
      const players = { ...state.players };
      delete players[playerId];
      return { players, takenCombos: recomputeTakenCombos(players) };
    }),

  setPlayers: (playerList) => {
    const players = Object.fromEntries(playerList.map((p) => [p.id, p]));
    set({ players, takenCombos: recomputeTakenCombos(players) });
  },

  reset: () => set({ myPlayerId: null, players: {}, takenCombos: new Set() }),
}));
