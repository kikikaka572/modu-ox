import { create } from "zustand";
import type { Position, RevealResult, RoundPhase } from "@/types/game";

interface RawPosition extends Position {
  updatedAt: number;
}

interface GameState {
  phase: RoundPhase;
  questionEndsAt: string | null;
  rawPositions: Record<string, RawPosition>;
  myRawPosition: Position;
  revealResult: RevealResult | null;

  setPhase: (phase: RoundPhase) => void;
  startRound: (questionEndsAt: string) => void;
  setRawPosition: (playerId: string, position: Position) => void;
  setMyRawPosition: (position: Position) => void;
  setRevealResult: (result: RevealResult) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  phase: "waiting",
  questionEndsAt: null,
  rawPositions: {},
  myRawPosition: { x: 0.5, y: 0.5 },
  revealResult: null,

  setPhase: (phase) => set({ phase }),

  startRound: (questionEndsAt) =>
    set({ phase: "countdown", questionEndsAt, revealResult: null, rawPositions: {} }),

  setRawPosition: (playerId, position) =>
    set((state) => ({
      rawPositions: {
        ...state.rawPositions,
        [playerId]: { ...position, updatedAt: Date.now() },
      },
    })),

  setMyRawPosition: (position) => set({ myRawPosition: position }),

  setRevealResult: (result) => set({ phase: "revealed", revealResult: result }),

  reset: () =>
    set({ phase: "waiting", questionEndsAt: null, rawPositions: {}, revealResult: null }),
}));
